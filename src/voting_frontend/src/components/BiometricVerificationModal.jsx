import React, { useState } from 'react';
import * as api from '../service';

function BiometricVerificationModal({ onVerified, onCancel, candidateName, electionTitle }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEnrolled, setIsEnrolled] = useState(api.isBiometricEnrolled());

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

  const handleBiometricVerification = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!isEnrolled) {
        setMessage({
          type: 'error',
          text: '❌ Biometric not enrolled. Please register your fingerprint first.'
        });
        setLoading(false);
        return;
      }

      console.log('👆 Prompting for fingerprint verification before voting...');

      const storedCredential = localStorage.getItem('biometric_credential');
      if (!storedCredential) {
        throw new Error('Biometric credential not found');
      }

      const credentialData = JSON.parse(storedCredential);
      const challenge = generateChallenge();

      setMessage({
        type: 'info',
        text: '👆 Place your finger on the scanner...'
      });

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
        throw new Error('Fingerprint verification cancelled');
      }

      console.log('✅ Fingerprint verified successfully');

      // Update biometric session
      localStorage.setItem('biometric_session', JSON.stringify({
        verified: true,
        timestamp: Date.now(),
        credentialId: credentialData.id
      }));

      setMessage({
        type: 'success',
        text: '✅ Fingerprint verified! Proceeding with vote...'
      });

      // Call onVerified callback after short delay
      setTimeout(() => {
        onVerified();
      }, 1000);

    } catch (error) {
      console.error('❌ Biometric verification error:', error);
      
      if (error.name === 'NotAllowedError') {
        setMessage({
          type: 'error',
          text: '❌ Fingerprint verification was cancelled or timed out'
        });
      } else if (error.message.includes('cancelled')) {
        setMessage({
          type: 'error',
          text: '❌ Fingerprint verification cancelled by user'
        });
      } else {
        setMessage({
          type: 'error',
          text: `❌ Verification failed: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkipBiometric = () => {
    // Allow voting without biometric if not enrolled
    setMessage({
      type: 'warning',
      text: '⚠️ Voting without biometric verification. Proceeding...'
    });
    setTimeout(() => {
      onVerified();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border-2 border-blue-500 rounded-lg p-8 max-w-md w-full space-y-6 shadow-2xl shadow-blue-500/20">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👆</div>
          <h2 className="text-2xl font-bold text-white mb-2">Security Verification</h2>
          <p className="text-slate-300 text-sm">
            Before casting your vote, please verify your identity using your fingerprint
          </p>
        </div>

        {/* Vote Details */}
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 border border-slate-600">
          <div className="text-xs text-slate-400">ELECTION</div>
          <div className="text-white font-semibold text-sm line-clamp-1">
            {electionTitle}
          </div>
          <div className="text-xs text-slate-400 mt-3">CANDIDATE</div>
          <div className="text-blue-400 font-semibold">
            {candidateName}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`p-4 rounded-lg text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500 text-green-400'
                : message.type === 'error'
                ? 'bg-red-500/20 border border-red-500 text-red-400'
                : message.type === 'warning'
                ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                : 'bg-blue-500/20 border border-blue-500 text-blue-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBiometricVerification}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Verifying Fingerprint...
              </>
            ) : (
              <>
                👆 Verify with Fingerprint
              </>
            )}
          </button>

          {!isEnrolled && (
            <button
              onClick={handleSkipBiometric}
              className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg transition-all duration-300"
            >
              Skip (Biometric Not Enrolled)
            </button>
          )}

          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-200 font-semibold rounded-lg transition-all duration-300"
          >
            ✕ Cancel Voting
          </button>
        </div>

        {/* Security Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300 space-y-1">
          <div className="font-semibold">🔒 Security Information:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Your vote is encrypted end-to-end</li>
            <li>Fingerprint never leaves your device</li>
            <li>Vote cannot be changed after casting</li>
            <li>Recorded immutably on blockchain</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BiometricVerificationModal;
