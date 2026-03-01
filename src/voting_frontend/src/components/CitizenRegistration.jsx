import React, { useState } from 'react';
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    <div className="card">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Citizen Registration</h2>
      {message.text && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
          {message.text}
        </div>
      )}

      {registrationSuccess ? (
        <div className="mb-10 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h3>
            <p className="text-green-400 font-semibold mb-2">Step 1 Complete: Citizen details saved.</p>
            <p className="text-slate-300">
              Please wait for an Election Officer to verify your details.
            </p>
          </div>

          <div className="border-t border-slate-700 pt-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-2">Step 2: Setup Biometric Authentication (Recommended)</h3>
            <p className="text-slate-300 text-sm mb-6">
              For enhanced security and faster future access, please register your fingerprint or device authenticator now.
            </p>
            <BiometricAuth onSuccess={() => window.location.reload()} />

            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Skip setup and go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Provide Citizen Details</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="As per Aadhaar card"
                />
              </div>

              <div>
                <label className="label">Date of Birth *</label>
                <input
                  type="text"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div>
                <label className="label">Aadhaar Number *</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  required
                  maxLength="12"
                  className="input"
                  placeholder="12 digit Aadhaar number"
                />
              </div>

              <div>
                <label className="label">Voter ID Number *</label>
                <input
                  type="text"
                  name="voterIdNumber"
                  value={formData.voterIdNumber}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Your Voter ID / EPIC Number"
                />
              </div>

              <div>
                <label className="label">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="label">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4">Address Details</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label">Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="House no, Street name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="input"
                    placeholder="Locality, Landmark"
                  />
                </div>

                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">District *</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    maxLength="6"
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4">Documents (Optional for Demo)</h3>
              <p className="text-sm text-gray-600 mb-4">
                For demo purposes, you can use placeholder images or leave empty
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Aadhaar Photo URL</label>
                  <input
                    type="text"
                    name="aadhaarPhotoUrl"
                    value={formData.aadhaarPhotoUrl}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="label">Your Photo URL</label>
                  <input
                    type="text"
                    name="photoUrl"
                    value={formData.photoUrl}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-3"
            >
              {loading ? 'Registering...' : 'Register & Login'}
            </button>

            <p className="text-sm text-gray-600 text-center">
              By registering, you agree to the terms and conditions. You will be logged in with Internet Identity.
            </p>
          </form>
        </>
      )}
    </div>
  );
}

export default CitizenRegistration;
