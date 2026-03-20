import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Phone, CreditCard, KeyRound, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import * as api from '../service';

function AccountRecovery({ onBack, onRecoveryComplete }) {
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'submitted' | 'status'
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recoveryStatus, setRecoveryStatus] = useState(null);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (aadhaarNumber.length !== 12 || mobileNumber.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 12-digit Aadhaar and mobile number.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await api.requestRecoveryOTP(aadhaarNumber, mobileNumber);
      if (result.ok) {
        setStep('otp');
        setMessage({ type: 'success', text: result.ok });
      } else {
        setMessage({ type: 'error', text: result.err });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to request recovery OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the 6-digit OTP.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await api.verifyRecoveryOTP(aadhaarNumber, otp);
      if (result.ok) {
        setStep('submitted');
        setMessage({ type: 'success', text: result.ok });
      } else {
        setMessage({ type: 'error', text: result.err });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      setMessage({ type: 'error', text: 'Enter your 12-digit Aadhaar to check status.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await api.getMyRecoveryStatus(aadhaarNumber);
      if (result.ok) {
        setRecoveryStatus(result.ok);
        setStep('status');
        if (result.ok.status === 'approved') {
          setMessage({ type: 'success', text: 'Your account has been recovered! You can now access your dashboard.' });
        }
      } else {
        setMessage({ type: 'error', text: result.err });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to check status. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <button onClick={onBack}
        className="mb-6 text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-300 border border-blue-500/30 hover:border-blue-500 flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="card">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ShieldAlert size={24} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Account Recovery</h2>
            <p className="text-sm text-surface-400">Recover your citizen profile with a new Internet Identity</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-surface-300 space-y-1">
              <p className="font-medium text-blue-300">Lost your Internet Identity?</p>
              <p>If you lost your device or forgot your anchor number, you can transfer your citizen profile to your new Internet Identity. You'll need your <strong className="text-white">Aadhaar number</strong> and <strong className="text-white">registered mobile</strong> to verify ownership.</p>
            </div>
          </div>
        </div>

        {/* Form step */}
        {step === 'form' && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <CreditCard size={14} /> Aadhaar Number
              </label>
              <input
                type="text" maxLength={12} value={aadhaarNumber}
                onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-digit Aadhaar number"
                className="input font-mono" required
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Phone size={14} /> Registered Mobile Number
              </label>
              <input
                type="tel" value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                placeholder="Enter mobile linked to Aadhaar"
                className="input" required
              />
            </div>

            {message.text && (
              <div className={`rounded-xl p-3 text-sm ${
                message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>{message.text}</div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading || aadhaarNumber.length !== 12 || mobileNumber.length < 10}
                className="btn btn-primary flex-1">
                {loading ? 'Sending OTP...' : 'Send Recovery OTP'}
              </button>
              <button type="button" onClick={handleCheckStatus}
                disabled={loading || aadhaarNumber.length !== 12}
                className="btn btn-ghost">
                Check Status
              </button>
            </div>
          </form>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <KeyRound size={14} /> Enter 6-digit OTP
              </label>
              <input
                type="text" maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="input font-mono text-center text-2xl tracking-[0.5em]"
                autoFocus
              />
            </div>

            {message.text && (
              <div className={`rounded-xl p-3 text-sm ${
                message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>{message.text}</div>
            )}

            <div className="flex gap-3">
              <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}
                className="btn btn-primary flex-1">
                {loading ? 'Verifying...' : 'Verify & Submit Recovery'}
              </button>
              <button onClick={() => { setStep('form'); setOtp(''); setMessage({ type: '', text: '' }); }}
                className="btn btn-ghost">
                Resend
              </button>
            </div>
          </div>
        )}

        {/* Submitted step */}
        {step === 'submitted' && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-2">
              <Clock size={32} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Recovery Request Submitted</h3>
            <p className="text-surface-400 text-sm max-w-sm mx-auto">
              Your identity has been verified via OTP. An Election Officer will review and approve your account transfer.
            </p>
            {message.text && (
              <div className="rounded-xl p-3 text-sm bg-green-500/10 text-green-400 border border-green-500/20">
                {message.text}
              </div>
            )}
            <button onClick={handleCheckStatus} disabled={loading}
              className="btn btn-ghost mt-4">
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        )}

        {/* Status step */}
        {step === 'status' && recoveryStatus && (
          <div className="text-center py-6 space-y-4">
            {recoveryStatus.status === 'pending' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10">
                  <Clock size={32} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Pending Review</h3>
                <p className="text-surface-400 text-sm">Request #{Number(recoveryStatus.requestId)} is awaiting admin approval.</p>
              </>
            )}
            {recoveryStatus.status === 'approved' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Account Recovered!</h3>
                <p className="text-surface-400 text-sm">Your citizen profile has been transferred to your new identity.</p>
                <button onClick={() => onRecoveryComplete && onRecoveryComplete()}
                  className="btn btn-primary mt-4">
                  Go to Dashboard
                </button>
              </>
            )}
            {recoveryStatus.status === 'rejected' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10">
                  <XCircle size={32} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Request Rejected</h3>
                <p className="text-surface-400 text-sm">Your recovery request was rejected by the admin. You may submit a new request.</p>
                <button onClick={() => { setStep('form'); setMessage({ type: '', text: '' }); setRecoveryStatus(null); }}
                  className="btn btn-ghost mt-4">
                  Try Again
                </button>
              </>
            )}

            {message.text && (
              <div className={`rounded-xl p-3 text-sm ${
                message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>{message.text}</div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="card mt-6">
        <h3 className="text-sm font-bold text-surface-300 uppercase tracking-wider mb-4">How Recovery Works</h3>
        <div className="space-y-3">
          {[
            { num: '1', text: 'Log in with your new Internet Identity (create a new anchor if needed)' },
            { num: '2', text: 'Enter the Aadhaar number and mobile you used during registration' },
            { num: '3', text: 'Verify with the OTP sent to your registered mobile' },
            { num: '4', text: 'An Election Officer reviews and approves the transfer' },
            { num: '5', text: 'Your citizen profile is linked to your new identity — re-enroll biometrics' },
          ].map(s => (
            <div key={s.num} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/15 text-brand-400 text-xs font-bold flex items-center justify-center">{s.num}</span>
              <p className="text-sm text-surface-400">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AccountRecovery;
