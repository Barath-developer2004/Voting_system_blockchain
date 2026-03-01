import React, { useState, useEffect } from 'react';
import BiometricAuth from './BiometricAuth';
import * as api from '../service';

function Settings() {
  const [activeTab, setActiveTab] = useState('security');
  const [principal, setPrincipal] = useState('');
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const principalId = await api.getPrincipal();
      setPrincipal(principalId);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(principal);
    alert('✅ Principal copied to clipboard');
  };

  const handleLogoutAllDevices = () => {
    if (confirm('Are you sure? You will be logged out from all devices.')) {
      api.clearBiometricSession();
      alert('✅ All sessions cleared');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold gradient-text mb-8">Settings</h2>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700 mb-8">
        <button
          onClick={() => setActiveTab('security')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          🔒 Security
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'sessions'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          📱 Sessions
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'account'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          👤 Account
        </button>
      </div>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Biometric Authentication</h3>
            <BiometricAuth
              onSuccess={() => {
                console.log('✅ Biometric setup successful');
              }}
              onError={(error) => {
                console.error('❌ Biometric setup error:', error);
              }}
            />
          </div>

          <div className="card">
            <h4 className="text-lg font-bold mb-4">Two-Factor Authentication (2FA)</h4>
            <p className="text-slate-400 mb-4">
              Coming soon: Protect your account with additional security layer
            </p>
            <button className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg cursor-not-allowed opacity-50">
              🔐 Coming Soon
            </button>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold mb-6">Active Sessions</h3>
          
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-white">Current Device</p>
                <p className="text-sm text-slate-400">
                  {navigator.userAgent.substring(0, 50)}...
                </p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Active Now
              </span>
            </div>
          </div>

          <div className="card bg-red-500/5 border border-red-500/20">
            <h4 className="text-lg font-bold text-red-400 mb-2">Logout All Devices</h4>
            <p className="text-slate-400 mb-4">
              Sign out from all devices except this one. This will invalidate all active sessions.
            </p>
            <button
              onClick={handleLogoutAllDevices}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
            >
              🚪 Logout All Devices
            </button>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-6">Account Information</h3>

          <div className="card">
            <label className="text-sm text-slate-400 mb-2 block">Your Principal ID</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={principal}
                readOnly
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 font-mono text-sm"
              />
              <button
                onClick={handleCopyPrincipal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Use this to recover your account or verify your identity
            </p>
          </div>

          <div className="card">
            <h4 className="text-lg font-bold mb-2">Account Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Internet Identity</p>
                <p className="text-green-400 font-semibold">✅ Connected</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Biometric</p>
                <p className={`font-semibold ${api.isBiometricEnrolled() ? 'text-green-400' : 'text-slate-400'}`}>
                  {api.isBiometricEnrolled() ? '✅ Enrolled' : '❌ Not Enrolled'}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-500/5 border border-yellow-500/20">
            <h4 className="text-lg font-bold text-yellow-400 mb-2">⚠️ Delete Account</h4>
            <p className="text-slate-400 mb-4">
              Permanently delete your account. This action cannot be undone.
            </p>
            <button className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all duration-300">
              🗑️ Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
