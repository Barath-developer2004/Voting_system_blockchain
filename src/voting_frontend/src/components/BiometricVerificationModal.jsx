import React, { useState } from 'react';
import { Fingerprint, X, Shield, CheckCircle2, XCircle, AlertTriangle, Loader2, Lock, Blocks, CreditCard } from 'lucide-react';
import * as api from '../service';

function BiometricVerificationModal({ onVerified, onCancel, candidateName, electionTitle, submittingVote }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEnrolled] = useState(api.isBiometricEnrolled());

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

  const handleBiometricVerification = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      if (!isEnrolled) {
        setMessage({ type: 'error', text: 'Biometric not enrolled. Please register your fingerprint first.' });
        setLoading(false);
        return;
      }

      const principalId = await api.getPrincipal();
      // Check sessionStorage first (where enrollment stores it), then localStorage as fallback
      let storedCredential = sessionStorage.getItem(`biometric_credential_${principalId}`);
      if (!storedCredential) {
        storedCredential = localStorage.getItem(`biometric_credential_${principalId}`);
      }
      if (!storedCredential) {
        const legacyCredential = localStorage.getItem('biometric_credential');
        if (!legacyCredential) throw new Error('Biometric credential not found. Please register your fingerprint first.');
        storedCredential = legacyCredential;
      }

      const credentialData = JSON.parse(storedCredential);
      const challenge = generateChallenge();
      setMessage({ type: 'info', text: 'Place your finger on the scanner...' });

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: new Uint8Array(base64ToArrayBuffer(credentialData.rawId)), transports: ['internal'] }],
          timeout: 60000, userVerification: 'preferred'
        }
      });
      if (!assertion) throw new Error('Fingerprint verification cancelled');

      const verifyResult = await api.verifyBiometricCredential({
        credentialId: credentialData.id,
        clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
        signature: arrayBufferToBase64(assertion.response.signature)
      });
      if (!verifyResult || !verifyResult.ok) throw new Error('Blockchain verification failed.');

      localStorage.setItem(`biometric_session_${principalId}`, JSON.stringify({ verified: true, timestamp: Date.now(), credentialId: credentialData.id }));
      setMessage({ type: 'success', text: 'Identity verified! Recording your vote...' });
      
      // Delay briefly to allow state to settle, then call onVerified
      setTimeout(async () => {
        try {
          await onVerified();
        } catch (err) {
          console.error('Error calling onVerified:', err);
          setMessage({ type: 'error', text: `Failed to submit vote: ${err.message}` });
          setLoading(false);
        }
      }, 500);
    } catch (error) {
      if (error.name === 'NotAllowedError') setMessage({ type: 'error', text: 'Verification was cancelled or timed out' });
      else setMessage({ type: 'error', text: `Verification failed: ${error.message}` });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-surface-700/50 bg-surface-900 shadow-2xl shadow-brand-500/10 overflow-hidden animate-fade-in-up">
        {/* Top gradient bar */}
        <div className="h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500" />

        {/* Close button */}
        <button onClick={onCancel} disabled={loading || submittingVote} className="absolute top-4 right-4 text-surface-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <X size={18} />
        </button>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
              loading ? 'bg-brand-500/10' : 'bg-brand-500/10'
            }`}>
              <Fingerprint size={36} className={`text-brand-400 ${loading ? 'animate-pulse' : ''}`} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Biometric Verification</h2>
            <p className="text-sm text-surface-400">Confirm your identity to cast your vote</p>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-success-400"><CheckCircle2 size={14} /> Internet Identity</div>
            <div className="flex-1 h-px bg-surface-700" />
            <div className="flex items-center gap-1.5 text-success-400"><CheckCircle2 size={14} /> Aadhaar OTP</div>
            <div className="flex-1 h-px bg-surface-700" />
            <div className="flex items-center gap-1.5 text-brand-400"><Fingerprint size={14} /> Fingerprint</div>
          </div>

          {/* Vote Details */}
          <div className="rounded-xl bg-surface-800/50 border border-surface-700/40 p-4 space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-1">Election</p>
              <p className="text-sm font-medium text-white truncate">{electionTitle}</p>
            </div>
            <div className="h-px bg-surface-700/40" />
            <div>
              <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-1">Candidate</p>
              <p className="text-sm font-semibold text-brand-400">{candidateName}</p>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-success-500/5 border border-success-500/15 text-success-400' :
              message.type === 'error' ? 'bg-danger-500/5 border border-danger-500/15 text-danger-400' :
              message.type === 'warning' ? 'bg-warning-500/5 border border-warning-500/15 text-warning-400' :
              'bg-brand-500/5 border border-brand-500/15 text-brand-400'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> :
               message.type === 'error' ? <XCircle size={16} /> :
               message.type === 'warning' ? <AlertTriangle size={16} /> :
               <Fingerprint size={16} className="animate-pulse" />}
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={handleBiometricVerification} disabled={loading || submittingVote}
              className="btn btn-primary w-full btn-lg group">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> :
               submittingVote ? <><Loader2 size={18} className="animate-spin" /> Submitting Vote...</> :
                <><Fingerprint size={18} className="group-hover:scale-110 transition-transform" /> Verify with Fingerprint</>}
            </button>

            {!isEnrolled && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-danger-500/5 border border-danger-500/15">
                <XCircle size={16} className="text-danger-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-danger-400">Biometric Not Enrolled</p>
                  <p className="text-xs text-danger-400/70 mt-0.5">Go to Settings to enroll your fingerprint before voting.</p>
                </div>
              </div>
            )}

            <button onClick={onCancel} disabled={loading} className="btn btn-ghost w-full">
              <X size={14} /> Cancel
            </button>
          </div>

          {/* Security info */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { icon: Lock, label: 'Internet Identity' },
              { icon: CreditCard, label: 'Aadhaar OTP' },
              { icon: Fingerprint, label: 'Biometric' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center">
                  <Icon size={14} className="text-surface-500 mx-auto mb-1" />
                  <p className="text-[10px] text-surface-500">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BiometricVerificationModal;