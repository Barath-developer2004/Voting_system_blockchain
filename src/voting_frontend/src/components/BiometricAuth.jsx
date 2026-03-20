import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, AlertTriangle, Loader2, Trash2, Lock, CheckCircle2, XCircle, Info } from 'lucide-react';
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
      if (!window.PublicKeyCredential) { setIsBiometricAvailable(false); return; }
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsBiometricAvailable(available);
    } catch { setIsBiometricAvailable(false); }
  };

  const checkBiometricEnrollment = async () => {
    try { setIsEnrolled(api.isBiometricEnrolled()); } catch {}
  };

  const generateChallenge = () => crypto.getRandomValues(new Uint8Array(32));

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  };

  const handleRegisterBiometric = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const isAuth = await api.isAuthenticated();
      if (!isAuth) await api.login();
      const principal = await api.getPrincipal();
      const challenge = generateChallenge();
      const hostname = window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname;

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge, rp: { name: 'Blockchain Voting System', id: hostname },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: principal, displayName: 'Voter' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          timeout: 60000, userVerification: 'preferred',
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'preferred', residentKey: 'preferred' },
          attestation: 'direct'
        }
      });
      if (!credential) throw new Error('Failed to create credential');

      const credentialData = {
        id: arrayBufferToBase64(credential.id), rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: { clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON), attestationObject: arrayBufferToBase64(credential.response.attestationObject) }
      };

      const enrollResult = await api.enrollBiometricCredential(credentialData);
      if (!enrollResult.ok) throw new Error(enrollResult.err || 'Failed to enroll on blockchain');

      const principalId = await api.getPrincipal();
      // Store credential data in both sessionStorage and localStorage
      // localStorage ensures it survives across tabs and page refreshes
      const credentialStore = JSON.stringify({
        id: credentialData.id,
        rawId: credentialData.rawId,
        type: credentialData.type
      });
      sessionStorage.setItem(`biometric_credential_${principalId}`, credentialStore);
      localStorage.setItem(`biometric_credential_${principalId}`, credentialStore);
      localStorage.setItem(`biometric_enrolled_${principalId}`, 'true');
      setIsEnrolled(true);
      setMessage({ type: 'success', text: 'Biometric registration successful! You can now use your fingerprint.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Biometric registration failed. Please try again.' });
      if (onError) onError(error);
    } finally { setLoading(false); }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      if (!isEnrolled) throw new Error('Biometric not enrolled. Please register first.');
      const principalId = await api.getPrincipal();
      // Try sessionStorage first, then localStorage for backward compat
      let storedCredential = sessionStorage.getItem(`biometric_credential_${principalId}`);
      if (!storedCredential) {
        storedCredential = localStorage.getItem(`biometric_credential_${principalId}`);
        if (storedCredential) {
          // Migrate to sessionStorage and clean up localStorage
          sessionStorage.setItem(`biometric_credential_${principalId}`, storedCredential);
          localStorage.removeItem(`biometric_credential_${principalId}`);
        }
      }
      if (!storedCredential) throw new Error('No biometric credential found for your account');
      const credentialData = JSON.parse(storedCredential);
      const challenge = generateChallenge();

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: new Uint8Array(base64ToArrayBuffer(credentialData.rawId)), transports: ['internal'] }],
          timeout: 60000, userVerification: 'preferred'
        }
      });
      if (!assertion) throw new Error('Biometric verification failed');

      const verifyResult = await api.verifyBiometricCredential({
        credentialId: credentialData.id,
        clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
        signature: arrayBufferToBase64(assertion.response.signature)
      });

      if (verifyResult && verifyResult.ok) {
        setMessage({ type: 'success', text: 'Biometric login successful!' });
        if (onSuccess) setTimeout(() => onSuccess(), 1000);
      } else throw new Error('Backend verification failed');
    } catch (error) {
      setMessage({ type: 'error', text: 'Biometric login failed. Please try again.' });
      if (onError) onError(error);
    } finally { setLoading(false); }
  };

  const handleRemoveBiometric = async () => {
    try {
      const principalId = await api.getPrincipal();
      sessionStorage.removeItem(`biometric_credential_${principalId}`);
      localStorage.removeItem(`biometric_credential_${principalId}`);
      localStorage.removeItem(`biometric_enrolled_${principalId}`);
      localStorage.removeItem('biometric_credential');
      localStorage.removeItem('biometric_enrolled');
      setIsEnrolled(false);
      setMessage({ type: 'success', text: 'Biometric authentication removed' });
    } catch { setMessage({ type: 'error', text: 'Failed to remove biometric' }); }
  };

  if (!isBiometricAvailable) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-warning-500/5 border border-warning-500/15">
        <AlertTriangle size={18} className="text-warning-400 flex-shrink-0" />
        <p className="text-sm text-warning-400">Biometric authentication is not available on this device.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message.text && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-success-500/5 border border-success-500/15 text-success-400' :
          'bg-danger-500/5 border border-danger-500/15 text-danger-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-surface-700/40 bg-surface-800/30 p-6 space-y-5">
        {!isEnrolled ? (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 mb-4">
                <Fingerprint size={30} className="text-brand-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Register Fingerprint</h3>
              <p className="text-sm text-surface-400 max-w-xs mx-auto">Enable biometric authentication for faster and more secure login.</p>
            </div>
            <button onClick={handleRegisterBiometric} disabled={loading} className="btn btn-primary w-full group">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Registering...</> :
                <><Fingerprint size={16} className="group-hover:scale-110 transition-transform" /> Register Fingerprint</>}
            </button>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success-500/10 mb-4">
                <ShieldCheck size={30} className="text-success-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Biometric Registered</h3>
              <p className="text-sm text-surface-400 max-w-xs mx-auto">Your fingerprint is enrolled. Use it to login securely.</p>
            </div>
            <button onClick={handleBiometricLogin} disabled={loading}
              className="btn w-full bg-success-500/10 text-success-400 border border-success-500/20 hover:bg-success-500/20 transition-colors">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> :
                <><Fingerprint size={16} /> Login with Fingerprint</>}
            </button>
            <button onClick={handleRemoveBiometric} className="btn btn-danger w-full">
              <Trash2 size={14} /> Remove Fingerprint
            </button>
          </>
        )}
      </div>

      <div className="rounded-xl bg-brand-500/5 border border-brand-500/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={14} className="text-brand-400" />
          <p className="text-xs font-semibold text-brand-400">Security Note</p>
        </div>
        <ul className="space-y-1.5 text-xs text-surface-400">
          <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-brand-500/40 mt-1.5 flex-shrink-0" />Your fingerprint data never leaves your device</li>
          <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-brand-500/40 mt-1.5 flex-shrink-0" />Uses WebAuthn standard for maximum security</li>
          <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-brand-500/40 mt-1.5 flex-shrink-0" />Encrypted end-to-end communication</li>
          <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-brand-500/40 mt-1.5 flex-shrink-0" />Can be managed from Settings</li>
        </ul>
      </div>
    </div>
  );
}

export default BiometricAuth;