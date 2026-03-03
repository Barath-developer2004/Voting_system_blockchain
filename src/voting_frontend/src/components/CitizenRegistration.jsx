import React, { useState } from 'react';
import { User, Calendar, CreditCard, Phone, MapPin, ShieldCheck, Send, CheckCircle2, Lock, Upload, AlertCircle, PartyPopper, Fingerprint, ArrowRight, RotateCcw } from 'lucide-react';
import * as api from '../service';
import BiometricAuth from './BiometricAuth';

function CitizenRegistration() {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    aadhaarNumber: '',
    voterIdNumber: '',
    mobileNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    gender: 'Male',
    aadhaarPhotoUrl: '',
    photoUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Aadhaar OTP verification state
  const [otpStep, setOtpStep] = useState('idle'); // 'idle' | 'sent' | 'verified'
  const [otpValue, setOtpValue] = useState('');
  const [otpMessage, setOtpMessage] = useState({ type: '', text: '' });
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Reset OTP verification if Aadhaar or mobile changes
    if (name === 'aadhaarNumber' || name === 'mobileNumber') {
      setOtpStep('idle');
      setOtpValue('');
      setOtpMessage({ type: '', text: '' });
    }
  };

  const handleRequestOTP = async () => {
    if (formData.aadhaarNumber.length !== 12) {
      setOtpMessage({ type: 'error', text: 'Aadhaar number must be exactly 12 digits.' });
      return;
    }
    if (!formData.mobileNumber || formData.mobileNumber.length < 10) {
      setOtpMessage({ type: 'error', text: 'Please enter a valid mobile number first.' });
      return;
    }

    setOtpLoading(true);
    setOtpMessage({ type: '', text: '' });

    try {
      // Ensure authenticated
      const isAuth = await api.isAuthenticated();
      if (!isAuth) {
        await api.login();
      }

      const result = await api.requestAadhaarOTP(formData.aadhaarNumber, formData.mobileNumber);
      if (result.ok) {
        setOtpStep('sent');
        setOtpMessage({ type: 'success', text: result.ok });
      } else {
        setOtpMessage({ type: 'error', text: result.err });
      }
    } catch (error) {
      console.error('OTP request error:', error);
      setOtpMessage({ type: 'error', text: 'Failed to request OTP: ' + error.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpMessage({ type: 'error', text: 'Please enter the 6-digit OTP.' });
      return;
    }

    setOtpLoading(true);
    setOtpMessage({ type: '', text: '' });

    try {
      const result = await api.verifyAadhaarOTP(formData.aadhaarNumber, otpValue);
      if (result.ok) {
        setOtpStep('verified');
        setOtpMessage({ type: 'success', text: '\u2705 ' + result.ok });
      } else {
        setOtpMessage({ type: 'error', text: result.err });
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      setOtpMessage({ type: 'error', text: 'Verification failed: ' + error.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Check if already authenticated, if not login first
      console.log('🔐 Checking authentication...');
      const isAuth = await api.isAuthenticated();
      console.log('🔐 Is authenticated:', isAuth);

      if (!isAuth) {
        console.log('🔐 Not authenticated, initiating login...');
        await api.login();
        console.log('🔐 Login completed');
      }

      // Prepare data
      const address = {
        line1: formData.addressLine1,
        line2: formData.addressLine2 || '',
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode
      };

      const gender = { [formData.gender]: null };

      const registrationData = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        aadhaarNumber: formData.aadhaarNumber,
        mobileNumber: formData.mobileNumber,
        address: address,
        gender: gender,
        aadhaarPhotoUrl: formData.aadhaarPhotoUrl || 'https://via.placeholder.com/150',
        photoUrl: formData.photoUrl || 'https://via.placeholder.com/150',
        voterIdNumber: formData.voterIdNumber
      };

      console.log('📝 Submitting registration:', registrationData);

      // Register citizen
      const result = await api.registerCitizen(registrationData);

      console.log('✅ Registration result:', result);

      if (result.ok) {
        setMessage({ type: 'success', text: '✅ Registration successful! Please setup biometric login.' });
        setRegistrationSuccess(true);
        // Do not reset form or redirect yet.
      } else {
        console.error('❌ Registration error from backend:', result.err);
        setMessage({ type: 'error', text: '❌ ' + result.err });
      }
    } catch (error) {
      console.error('❌ Registration exception:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Check if it's a signature error (authentication issue)
      if (error.message && error.message.includes('Invalid signature')) {
        setMessage({
          type: 'error',
          text: '❌ Authentication session expired. Please logout and login again to register.'
        });
      } else {
        setMessage({ type: 'error', text: '❌ Registration failed: ' + (error.message || 'Please try again.') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Citizen Registration</h2>
        <p className="text-surface-400">Complete the form below to register as a voter on the blockchain</p>
      </div>

      {/* Alert messages */}
      {message.text && (
        <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 border ${
          message.type === 'success'
            ? 'bg-success-500/10 border-success-500/20 text-success-400'
            : 'bg-danger-500/10 border-danger-500/20 text-danger-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {registrationSuccess ? (
        /* ── Success / Biometric Setup ── */
        <div className="card p-8 space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success-500/10 text-success-400 mb-5">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h3>
            <p className="text-success-400 font-medium mb-1">Step 1 Complete — Citizen details saved</p>
            <p className="text-surface-400 text-sm">Please wait for an Election Officer to verify your details.</p>
          </div>

          <div className="divider" />

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Fingerprint size={20} className="text-brand-400" />
              <h3 className="text-lg font-bold text-white">Step 2: Setup Biometric Authentication</h3>
            </div>
            <p className="text-surface-400 text-sm mb-6 ml-8">
              Register your fingerprint or device authenticator for enhanced security and faster access.
            </p>
            <BiometricAuth onSuccess={() => window.location.reload()} />

            <button
              onClick={() => window.location.reload()}
              className="btn btn-ghost w-full mt-4"
            >
              Skip setup and go to Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Registration Form ── */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details Card */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-500/10 text-brand-400">
                <User size={18} />
              </div>
              <h3 className="text-lg font-bold text-white">Personal Details</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text" name="fullName" value={formData.fullName}
                  onChange={handleChange} required className="input"
                  placeholder="As per Aadhaar card"
                />
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input
                  type="text" name="dateOfBirth" value={formData.dateOfBirth}
                  onChange={handleChange} required className="input"
                  placeholder="DD-MM-YYYY"
                />
              </div>
              <div>
                <label className="label">Voter ID Number *</label>
                <input
                  type="text" name="voterIdNumber" value={formData.voterIdNumber}
                  onChange={handleChange} required className="input"
                  placeholder="Your Voter ID / EPIC Number"
                />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange}
                  className="select">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aadhaar Verification Card */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-lg font-bold text-white">Aadhaar Verification</h3>
              {otpStep === 'verified' && <span className="badge badge-success ml-auto">Verified</span>}
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="label">Aadhaar Number *</label>
                <input
                  type="text" name="aadhaarNumber" value={formData.aadhaarNumber}
                  onChange={handleChange} required maxLength="12" className="input"
                  placeholder="12-digit Aadhaar number"
                  disabled={otpStep === 'verified'}
                />
              </div>
              <div>
                <label className="label">Mobile Number * (linked to Aadhaar)</label>
                <input
                  type="tel" name="mobileNumber" value={formData.mobileNumber}
                  onChange={handleChange} required className="input"
                  placeholder="+91 98765 43210"
                  disabled={otpStep === 'verified'}
                />
              </div>
            </div>

            {/* OTP Flow */}
            {otpStep !== 'verified' && formData.aadhaarNumber.length === 12 && formData.mobileNumber.length >= 10 && (
              <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={15} className="text-brand-400" />
                  <span className="text-sm font-semibold text-brand-300">OTP Verification</span>
                </div>
                <p className="text-xs text-surface-400 mb-4">
                  {otpStep === 'idle'
                    ? 'Verify your Aadhaar via OTP sent to your registered mobile.'
                    : 'Enter the 6-digit OTP sent to your mobile number.'}
                </p>

                {otpMessage.text && (
                  <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 text-sm ${
                    otpMessage.type === 'success'
                      ? 'bg-success-500/10 border border-success-500/20 text-success-400'
                      : 'bg-danger-500/10 border border-danger-500/20 text-danger-400'
                  }`}>
                    {otpMessage.type === 'success' ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
                    <span>{otpMessage.text}</span>
                  </div>
                )}

                {otpStep === 'idle' && (
                  <button type="button" onClick={handleRequestOTP} disabled={otpLoading}
                    className="btn btn-primary btn-sm">
                    {otpLoading ? <><span className="animate-spin">⏳</span> Sending…</> : <><Send size={14} /> Send OTP to Mobile</>}
                  </button>
                )}

                {otpStep === 'sent' && (
                  <div className="flex gap-2">
                    <input
                      type="text" value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength="6" className="input flex-1 font-mono tracking-widest text-center"
                      placeholder="• • • • • •"
                    />
                    <button type="button" onClick={handleVerifyOTP}
                      disabled={otpLoading || otpValue.length !== 6}
                      className="btn btn-primary btn-sm">
                      {otpLoading ? 'Verifying…' : 'Verify'}
                    </button>
                    <button type="button" onClick={handleRequestOTP}
                      disabled={otpLoading} className="btn btn-ghost btn-sm">
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {otpStep === 'verified' && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-success-500/10 border border-success-500/20">
                <CheckCircle2 size={18} className="text-success-400 flex-shrink-0" />
                <span className="text-sm font-medium text-success-300">Aadhaar verified — your identity has been confirmed via OTP</span>
              </div>
            )}
          </div>

          {/* Address Card */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400">
                <MapPin size={18} />
              </div>
              <h3 className="text-lg font-bold text-white">Address Details</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="label">Address Line 1 *</label>
                <input
                  type="text" name="addressLine1" value={formData.addressLine1}
                  onChange={handleChange} required className="input"
                  placeholder="House no, Street name"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address Line 2</label>
                <input
                  type="text" name="addressLine2" value={formData.addressLine2}
                  onChange={handleChange} className="input"
                  placeholder="Locality, Landmark"
                />
              </div>
              <div>
                <label className="label">City *</label>
                <input type="text" name="city" value={formData.city}
                  onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="label">District *</label>
                <input type="text" name="district" value={formData.district}
                  onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="label">State *</label>
                <input type="text" name="state" value={formData.state}
                  onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="label">Pincode *</label>
                <input type="text" name="pincode" value={formData.pincode}
                  onChange={handleChange} required maxLength="6" className="input" />
              </div>
            </div>
          </div>

          {/* Documents Card */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400">
                <Upload size={18} />
              </div>
              <h3 className="text-lg font-bold text-white">Documents</h3>
              <span className="badge badge-neutral ml-auto">Optional</span>
            </div>
            <p className="text-xs text-surface-500 mb-5 ml-12">For demo purposes, you can use placeholder images or leave empty</p>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Aadhaar Photo URL</label>
                <input type="text" name="aadhaarPhotoUrl" value={formData.aadhaarPhotoUrl}
                  onChange={handleChange} className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Your Photo URL</label>
                <input type="text" name="photoUrl" value={formData.photoUrl}
                  onChange={handleChange} className="input" placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || otpStep !== 'verified'}
            className="btn btn-primary btn-lg w-full"
          >
            {loading ? (
              <><span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Registering…</>
            ) : otpStep !== 'verified' ? (
              <><Lock size={18} /> Verify Aadhaar First</>
            ) : (
              <><ArrowRight size={18} /> Register & Login</>
            )}
          </button>

          <p className="text-xs text-surface-500 text-center pb-2">
            By registering, you agree to the terms and conditions. Your Aadhaar has been verified via OTP.
          </p>
        </form>
      )}
    </div>
  );
}

export default CitizenRegistration;
