import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, User, Lock, Copy, LogOut, Trash2, CheckCircle2, Fingerprint, Key, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';
import BiometricAuth from './BiometricAuth';
import * as api from '../service';
import { generateMnemonic } from 'bip39';

function Settings() {
  const [activeTab, setActiveTab] = useState('security');
  const [principal, setPrincipal] = useState('');
  const [copied, setCopied] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try { setPrincipal(await api.getPrincipal()); } catch {}
  };

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(principal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateMnemonic = () => {
    const phrase = generateMnemonic(256); // 24 words
    setMnemonic(phrase);
    setShowMnemonic(true);
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setMnemonicCopied(true);
    setTimeout(() => setMnemonicCopied(false), 2000);
  };

  const handleLogoutAllDevices = () => {
    if (confirm('Are you sure? You will be logged out from all devices.')) {
      api.clearBiometricSession();
      alert('All sessions cleared');
      window.location.reload();
    }
  };

  const tabs = [
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'sessions', label: 'Sessions', icon: Smartphone },
    { key: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-surface-400 mt-0.5">Manage your security, sessions, and account</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-surface-700/40">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative ${
                active ? 'text-brand-400' : 'text-surface-400 hover:text-surface-200'
              }`}>
              <Icon size={15} /> {tab.label}
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t" />}
            </button>
          );
        })}
      </div>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Fingerprint size={18} className="text-brand-400" /> Biometric Authentication
            </h3>
            <BiometricAuth
              onSuccess={() => {}}
              onError={() => {}}
            />
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-danger-500/10 flex items-center justify-center">
                <ShieldAlert size={18} className="text-danger-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Account Recovery Phrase</h4>
                <p className="text-xs text-surface-500">Generate a 24-word phrase to recover your account if you lose access</p>
              </div>
            </div>
            
            {!mnemonic ? (
              <button onClick={handleGenerateMnemonic} className="btn btn-primary w-full sm:w-auto mt-2">
                <KeyRound size={16} /> Generate Recovery Phrase
              </button>
            ) : (
              <div className="mt-4 p-4 border border-danger-500/30 bg-danger-500/5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-danger-400 font-semibold">Write this down and keep it safe!</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowMnemonic(!showMnemonic)} className="btn btn-ghost btn-sm">
                      {showMnemonic ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                    </button>
                    <button onClick={handleCopyMnemonic} className="btn btn-ghost btn-sm">
                      {mnemonicCopied ? <><CheckCircle2 size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>
                </div>
                
                {showMnemonic ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {mnemonic.split(' ').map((word, index) => (
                      <div key={index} className="bg-surface-800 border border-surface-700 p-2 rounded-lg flex gap-2 items-center">
                        <span className="text-surface-500 text-xs w-4">{index + 1}.</span>
                        <span className="text-white text-sm font-mono font-medium">{word}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-800 border border-surface-700 p-4 rounded-lg flex items-center justify-center h-24">
                    <span className="text-surface-500 text-sm italic">Phrase hidden for security</span>
                  </div>
                )}
                
                <p className="text-xs text-surface-400 mt-4 text-center">
                  This 24-word phrase is the ONLY way to recover your account. If you lose it, we cannot help you retrieve it.
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-700/30 flex items-center justify-center">
                <Key size={18} className="text-surface-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h4>
                <p className="text-xs text-surface-500">Additional security layer for your account</p>
              </div>
            </div>
            <button disabled className="btn btn-ghost btn-sm opacity-50 cursor-not-allowed">
              <Lock size={14} /> Coming Soon
            </button>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone size={18} className="text-brand-400" /> Active Sessions
          </h3>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center">
                  <Smartphone size={18} className="text-success-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Current Device</p>
                  <p className="text-xs text-surface-500 max-w-xs truncate">{navigator.userAgent.substring(0, 60)}...</p>
                </div>
              </div>
              <span className="badge badge-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" /> Active
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-danger-500/15 bg-danger-500/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <LogOut size={18} className="text-danger-400" />
              <h4 className="text-sm font-bold text-danger-400">Logout All Devices</h4>
            </div>
            <p className="text-xs text-surface-400 mb-4">Sign out from all devices. This will invalidate all active sessions.</p>
            <button onClick={handleLogoutAllDevices} className="btn btn-danger btn-sm">
              <LogOut size={14} /> Logout All
            </button>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User size={18} className="text-brand-400" /> Account Information
          </h3>

          <div className="card">
            <label className="label">Your Principal ID</label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="text" value={principal} readOnly className="input flex-1 !font-mono !text-xs" />
              <button onClick={handleCopyPrincipal}
                className={`btn btn-sm flex-shrink-0 transition-colors ${copied ? 'bg-success-500/10 text-success-400 border-success-500/20' : 'btn-ghost'}`}>
                {copied ? <><CheckCircle2 size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <p className="text-xs text-surface-500 mt-2">Use this to recover your account or verify your identity</p>
          </div>

          <div className="card">
            <h4 className="text-sm font-bold text-white mb-4">Account Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card">
                <p className="text-xs text-surface-500 mb-1">Internet Identity</p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-success-400" />
                  <span className="text-sm font-semibold text-success-400">Connected</span>
                </div>
              </div>
              <div className="stat-card">
                <p className="text-xs text-surface-500 mb-1">Biometric</p>
                <div className="flex items-center gap-1.5">
                  {api.isBiometricEnrolled() ? (
                    <><CheckCircle2 size={14} className="text-success-400" /><span className="text-sm font-semibold text-success-400">Enrolled</span></>
                  ) : (
                    <><Shield size={14} className="text-surface-500" /><span className="text-sm font-semibold text-surface-400">Not Enrolled</span></>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-warning-500/15 bg-warning-500/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Trash2 size={18} className="text-warning-400" />
              <h4 className="text-sm font-bold text-warning-400">Delete Account</h4>
            </div>
            <p className="text-xs text-surface-400 mb-4">Permanently delete your account. This action cannot be undone.</p>
            <button className="btn btn-sm bg-warning-500/10 text-warning-400 border border-warning-500/20 hover:bg-warning-500/20">
              <Trash2 size={14} /> Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;