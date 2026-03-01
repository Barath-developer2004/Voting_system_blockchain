import React, { useState, useEffect } from 'react';
import * as api from '../service';

function BiometricAuth({ onSuccess, onError }) {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    checkBiometricAvailability();
    checkBiometricEnrollment();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        console.warn('❌ WebAuthn not supported on this browser');
        setIsBiometricAvailable(false);
        return;
      }

      // Check if platform authenticator is available (fingerprint, etc.)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('✅ Biometric availability:', available);
      setIsBiometricAvailable(available);
    } catch (error) {
      console.error('❌ Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    }
  };

  const checkBiometricEnrollment = () => {
    try {
      const enrolled = localStorage.getItem('biometric_enrolled') === 'true';
      setIsEnrolled(enrolled);
      console.log('📱 Biometric enrolled:', enrolled);
    } catch (error) {
      console.error('❌ Error checking enrollment:', error);
    }
  };

  const generateChallenge = () => {
    return crypto.getRandomValues(new Uint8Array(32));
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleRegisterBiometric = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🔐 Starting biometric registration...');

      // Check authentication first
      const isAuth = await api.isAuthenticated();
      if (!isAuth) {
        console.log('🔐 Not authenticated, initiating login...');
        await api.login();
      }

      const principal = await api.getPrincipal();
      console.log('👤 Principal:', principal);

      // Create credential
      const challenge = generateChallenge();
      // Use localhost for WebAuthn as it doesn't accept IP addresses
      const hostname = window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname;
      const rp = {
        name: 'Blockchain Voting System',
        id: hostname
      };

      const user = {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: principal,
        displayName: 'Voter'
      };

      const pubKeyCredParams = [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ];

      console.log('📝 Creating credential...');
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: rp,
          user: user,
          pubKeyCredParams: pubKeyCredParams,
          timeout: 60000,
          userVerification: 'preferred',
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Only platform authenticators (fingerprint, etc.)
            userVerification: 'preferred',
            residentKey: 'preferred'
          },
          attestation: 'direct'
        }
      });

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      console.log('✅ Credential created successfully');

      // Convert credential to base64 strings for transmission
      const credentialData = {
        id: arrayBufferToBase64(credential.id),
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64(credential.response.attestationObject)
        }
      };

      // Enroll on blockchain with converted data
      console.log('📤 Enrolling biometric on blockchain...');
      const enrollResult = await api.enrollBiometricCredential(credentialData);

      if (!enrollResult.ok) {
        throw new Error(enrollResult.err || 'Failed to enroll on blockchain');
      }

      localStorage.setItem('biometric_credential', JSON.stringify(credentialData));
      localStorage.setItem('biometric_enrolled', 'true');

      setIsEnrolled(true);
      setMessage({
        type: 'success',
        text: '✅ Biometric registration successful! You can now login with your fingerprint.'
      });

      console.log('✅ Biometric registration complete');
    } catch (error) {
      console.error('❌ Biometric registration error:', error);
      setMessage({
        type: 'error',
        text: `❌ Registration failed: ${error.message}`
      });
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🔐 Starting biometric login...');

      if (!isEnrolled) {
        throw new Error('Biometric not enrolled. Please register first.');
      }

      const storedCredential = localStorage.getItem('biometric_credential');
      if (!storedCredential) {
        throw new Error('No biometric credential found');
      }

      const credentialData = JSON.parse(storedCredential);
      const challenge = generateChallenge();

      console.log('👆 Prompting for fingerprint verification...');

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: [
            {
              type: 'public-key',
              id: new Uint8Array(base64ToArrayBuffer(credentialData.rawId)),
              transports: ['internal']
            }
          ],
          timeout: 60000,
          userVerification: 'preferred'
        }
      });

      if (!assertion) {
        throw new Error('Biometric verification failed');
      }

      console.log('✅ Biometric verified successfully');

      // Verify credential with backend
      const verifyResult = await api.verifyBiometricCredential({
        credentialId: credentialData.id,
        clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
        signature: arrayBufferToBase64(assertion.response.signature)
      });

      if (verifyResult && verifyResult.ok) {
        setMessage({
          type: 'success',
          text: '✅ Biometric login successful!'
        });
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1000);
        }
      } else {
        throw new Error('Backend verification failed');
      }
    } catch (error) {
      console.error('❌ Biometric login error:', error);
      setMessage({
        type: 'error',
        text: `❌ Login failed: ${error.message}`
      });
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBiometric = () => {
    try {
      localStorage.removeItem('biometric_credential');
      localStorage.removeItem('biometric_enrolled');
      setIsEnrolled(false);
      setMessage({
        type: 'success',
        text: '✅ Biometric authentication removed'
      });
    } catch (error) {
      console.error('❌ Error removing biometric:', error);
      setMessage({
        type: 'error',
        text: '❌ Failed to remove biometric'
      });
    }
  };

  if (!isBiometricAvailable) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Biometric authentication is not available on this device.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        {!isEnrolled ? (
          <>
            <div className="text-center">
              <div className="text-4xl mb-2">👆</div>
              <h3 className="font-bold text-lg mb-2">Register Fingerprint</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enable biometric authentication for faster and more secure login.
              </p>
            </div>
            <button
              onClick={handleRegisterBiometric}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {loading ? '⏳ Registering...' : '📱 Register Fingerprint'}
            </button>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="font-bold text-lg mb-2">Biometric Registered</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your fingerprint is enrolled. Use it to login securely.
              </p>
            </div>
            <button
              onClick={handleBiometricLogin}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? '⏳ Verifying...' : '👆 Login with Fingerprint'}
            </button>
            <button
              onClick={handleRemoveBiometric}
              className="w-full px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-all duration-300"
            >
              🗑️ Remove Fingerprint
            </button>
          </>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">🔒 Security Note:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Your fingerprint data never leaves your device</li>
          <li>Uses WebAuthn standard for maximum security</li>
          <li>Encrypted end-to-end communication</li>
          <li>Can be managed from Settings</li>
        </ul>
      </div>
    </div>
  );
}

export default BiometricAuth;
