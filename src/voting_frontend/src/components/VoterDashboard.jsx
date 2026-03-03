import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Phone, CreditCard, Shield, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronRight, Fingerprint, FileText } from 'lucide-react';
import * as api from '../service';

function VoterDashboard({ setCurrentView, onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setRefreshing(true);
      const result = await api.getMyCitizenProfile();
      if (result.ok) {
        setProfile(result.ok);
        if (onProfileUpdate) onProfileUpdate();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-10 w-48" />
        <div className="card space-y-4">
          <div className="skeleton h-6 w-64" />
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-500/10 mb-6">
          <User size={36} className="text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Citizen Profile Found</h2>
        <p className="text-surface-400 mb-8 leading-relaxed max-w-md mx-auto">
          Register as a citizen to participate in elections and make your voice heard on the blockchain.
        </p>
        <button onClick={() => setCurrentView('register')} className="btn btn-primary btn-lg group">
          Register Now
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  const statusText = Object.keys(profile.status)[0];
  const getGenderText = (gender) => Object.keys(gender)[0];
  const formatDate = (timestamp) => new Date(Number(timestamp) / 1000000).toLocaleString();

  const statusConfig = {
    Pending:   { color: 'warning', icon: Clock,        label: 'Pending Verification', message: 'Your registration is being reviewed by an Election Officer. You will be able to vote once verified.' },
    Verified:  { color: 'success', icon: CheckCircle2, label: 'Verified',             message: 'You are verified and eligible to vote. Head to Elections to participate!' },
    Rejected:  { color: 'danger',  icon: XCircle,      label: 'Rejected',             message: 'Your registration was rejected. Please contact the Election Commission for details.' },
    Suspended: { color: 'neutral', icon: AlertCircle,  label: 'Suspended',            message: 'Your account has been suspended. Please contact the Election Commission.' },
  };

  const status = statusConfig[statusText] || statusConfig.Pending;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Profile</h2>
          <p className="text-sm text-surface-400 mt-0.5">Your citizen registration details</p>
        </div>
        <button onClick={loadProfile} disabled={refreshing} className="btn btn-ghost btn-sm">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {/* Status Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 ${
        status.color === 'success' ? 'bg-success-500/5 border-success-500/20' :
        status.color === 'warning' ? 'bg-warning-500/5 border-warning-500/20' :
        status.color === 'danger'  ? 'bg-danger-500/5 border-danger-500/20' :
        'bg-surface-800/50 border-surface-700/30'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            status.color === 'success' ? 'bg-success-500/15 text-success-400' :
            status.color === 'warning' ? 'bg-warning-500/15 text-warning-400' :
            status.color === 'danger'  ? 'bg-danger-500/15 text-danger-400' :
            'bg-surface-700/50 text-surface-400'
          }`}>
            <StatusIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className={`badge ${
                status.color === 'success' ? 'badge-success' :
                status.color === 'warning' ? 'badge-warning' :
                status.color === 'danger'  ? 'badge-danger' : 'badge-neutral'
              }`}>{status.label}</span>
              {profile.isEligible && <span className="badge badge-success">Eligible to Vote</span>}
            </div>
            <p className={`text-sm leading-relaxed ${
              status.color === 'success' ? 'text-success-400/80' :
              status.color === 'warning' ? 'text-warning-400/80' :
              status.color === 'danger'  ? 'text-danger-400/80' : 'text-surface-400'
            }`}>{status.message}</p>
          </div>
          {statusText === 'Verified' && (
            <button onClick={() => setCurrentView('elections')} className="btn btn-secondary btn-sm flex-shrink-0">
              Go Vote <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-700/40">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center border border-brand-500/20">
            <span className="text-2xl font-bold gradient-text">{profile.fullName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{profile.fullName}</h3>
            <p className="text-sm text-surface-400">{getGenderText(profile.gender)} · {Number(profile.age)} years · {profile.constituency}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-2"><User size={13} /> Personal Information</h4>
            <InfoRow icon={Calendar} label="Date of Birth" value={profile.dateOfBirth} />
            <InfoRow icon={CreditCard} label="Aadhaar" value={`${profile.aadhaarNumber.substring(0, 4)} •••• ••••`} mono />
            {profile.voterIdNumber && <InfoRow icon={FileText} label="Voter ID / EPIC" value={profile.voterIdNumber} mono />}
            <InfoRow icon={Phone} label="Mobile" value={profile.mobileNumber} />
          </div>
          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-2"><MapPin size={13} /> Address & Location</h4>
            <InfoRow icon={MapPin} label="Address" value={`${profile.addressLine1}, ${profile.city}`} />
            <InfoRow label="District" value={profile.district} />
            <InfoRow label="State" value={profile.state} />
            <InfoRow label="Pincode" value={profile.pincode} mono />
            <InfoRow icon={Shield} label="Constituency" value={profile.constituency} highlight />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-surface-700/40">
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-2 mb-4"><Clock size={13} /> Registration Details</h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-xs text-surface-500 mb-1">Registered</p>
              <p className="text-sm font-medium text-white">{formatDate(profile.registrationTime)}</p>
            </div>
            {profile.verifiedAt && profile.verifiedAt[0] && (
              <div className="stat-card">
                <p className="text-xs text-surface-500 mb-1">Verified</p>
                <p className="text-sm font-medium text-white">{formatDate(profile.verifiedAt[0])}</p>
              </div>
            )}
            <div className="stat-card">
              <p className="text-xs text-surface-500 mb-1">Vote Eligibility</p>
              <p className={`text-sm font-semibold ${profile.isEligible ? 'text-success-400' : 'text-surface-400'}`}>
                {profile.isEligible ? 'Eligible' : 'Not Yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {statusText === 'Verified' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={() => setCurrentView('elections')} className="card-interactive group flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors"><Shield size={20} /></div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">View Elections</p>
              <p className="text-xs text-surface-400">Browse and participate in active elections</p>
            </div>
            <ChevronRight size={16} className="text-surface-500 group-hover:text-brand-400 transition-colors" />
          </button>
          <button onClick={() => setCurrentView('settings')} className="card-interactive group flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors"><Fingerprint size={20} /></div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Biometric Settings</p>
              <p className="text-xs text-surface-400">Manage fingerprint authentication</p>
            </div>
            <ChevronRight size={16} className="text-surface-500 group-hover:text-purple-400 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, highlight }) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? <Icon size={15} className="text-surface-500 mt-0.5 flex-shrink-0" /> : <span className="w-[15px] flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-surface-500 mb-0.5">{label}</p>
        <p className={`text-sm truncate ${highlight ? 'font-semibold text-brand-400' : mono ? 'font-mono text-surface-200' : 'text-surface-200'}`}>{value}</p>
      </div>
    </div>
  );
}

export default VoterDashboard;
