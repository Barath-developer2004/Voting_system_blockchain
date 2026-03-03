import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Clock, Landmark, Vote, BarChart3, Plus, X, RefreshCw, ChevronDown, CheckCircle2, XCircle, Phone, MapPin, CreditCard, Calendar, User, FileText, AlertCircle, Eye, Image } from 'lucide-react';
import * as api from '../service';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingCitizens, setPendingCitizens] = useState([]);
  const [allCitizens, setAllCitizens] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [expandedCitizen, setExpandedCitizen] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, all, stats] = await Promise.all([
        api.getPendingCitizens(),
        api.getAllCitizens(),
        api.getStatistics()
      ]);

      if (pending.ok) setPendingCitizens(pending.ok);
      if (all.ok) setAllCitizens(all.ok);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (principal, approve) => {
    try {
      const result = await api.verifyCitizen(
        principal, approve,
        [],
        approve ? [] : ['Documents incomplete']
      );
      if (result.ok) {
        alert(result.ok);
        await loadData();
      } else {
        alert('Error: ' + result.err);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify citizen: ' + error.message);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const electionData = {
        title: formData.get('title'),
        description: formData.get('description'),
        electionType: { [formData.get('type')]: null },
        level: { [formData.get('level')]: null },
        constituency: formData.get('constituency'),
        state: formData.get('state') ? [formData.get('state')] : [],
        votingStartDate: BigInt(new Date(formData.get('startDate')).getTime() * 1000000),
        votingEndDate: BigInt(new Date(formData.get('endDate')).getTime() * 1000000)
      };
      const result = await api.createElection(electionData);
      if (result.ok) {
        alert('Election created successfully! ID: ' + result.ok);
        setShowElectionForm(false);
        e.target.reset();
      } else {
        alert('Error: ' + result.err);
      }
    } catch (error) {
      console.error('Error creating election:', error);
      alert('Failed to create election');
    }
  };

  const formatDate = (timestamp) => new Date(Number(timestamp) / 1000000).toLocaleString();
  const getGenderText = (gender) => Object.keys(gender)[0];
  const getStatusText = (status) => Object.keys(status)[0];

  const statCards = statistics ? [
    { label: 'Total Citizens',  value: statistics.totalCitizens,        icon: Users,      color: 'brand' },
    { label: 'Verified',        value: statistics.verifiedCitizens,     icon: ShieldCheck, color: 'success' },
    { label: 'Pending',         value: statistics.pendingVerifications, icon: Clock,       color: 'warning' },
    { label: 'Elections',       value: statistics.totalElections,       icon: Landmark,    color: 'brand' },
    { label: 'Active',          value: statistics.activeElections,      icon: Vote,        color: 'success' },
    { label: 'Votes Cast',      value: statistics.totalVotesCast,       icon: BarChart3,   color: 'brand' },
  ] : [];

  const colorMap = {
    brand:   'from-brand-500/20 to-brand-500/5 text-brand-400 border-brand-500/15',
    success: 'from-success-500/20 to-success-500/5 text-success-400 border-success-500/15',
    warning: 'from-warning-500/20 to-warning-500/5 text-warning-400 border-warning-500/15',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Election Officer Dashboard</h2>
          <p className="text-sm text-surface-400 mt-0.5">Manage citizens, elections, and candidates</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} disabled={loading} className="btn btn-ghost btn-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => setShowElectionForm(!showElectionForm)}
            className={showElectionForm ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}>
            {showElectionForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Create Election</>}
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`rounded-2xl border bg-gradient-to-b p-4 ${colorMap[s.color]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} className="opacity-80" />
                  <span className="text-xs opacity-70">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{Number(s.value)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Election Form */}
      {showElectionForm && (
        <div className="card animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Landmark size={20} className="text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create New Election</h3>
              <p className="text-xs text-surface-400">Fill in the details to set up a new election</p>
            </div>
          </div>
          <form onSubmit={handleCreateElection} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Election Title *</label>
                <input name="title" required className="input" placeholder="2026 Parliament Elections" />
              </div>
              <div>
                <label className="label">Constituency *</label>
                <input name="constituency" required className="input" placeholder="e.g., Tiruvallur or ALL" />
                <p className="text-xs text-surface-500 mt-1.5">District name for district-wide, "ALL" for national</p>
              </div>
              <div>
                <label className="label">Type *</label>
                <select name="type" required className="input">
                  <option value="General">General</option>
                  <option value="ByElection">By-Election</option>
                  <option value="Referendum">Referendum</option>
                  <option value="LocalBody">Local Body</option>
                </select>
              </div>
              <div>
                <label className="label">Level *</label>
                <select name="level" required className="input">
                  <option value="National">National</option>
                  <option value="State">State</option>
                  <option value="District">District</option>
                  <option value="Municipal">Municipal</option>
                  <option value="Village">Village</option>
                </select>
              </div>
              <div>
                <label className="label">State</label>
                <input name="state" className="input" placeholder="Tamil Nadu" />
              </div>
              <div>
                <label className="label">Start Date & Time *</label>
                <input name="startDate" type="datetime-local" required className="input" />
              </div>
              <div>
                <label className="label">End Date & Time *</label>
                <input name="endDate" type="datetime-local" required className="input" />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" className="input" rows="3" placeholder="Election description..." />
            </div>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create Election
            </button>
          </form>
        </div>
      )}

      {/* Tabs + Content */}
      <div className="card !p-0">
        <div className="flex border-b border-surface-700/40">
          {[
            { key: 'pending', label: 'Pending Verification', count: pendingCitizens.length, icon: Clock },
            { key: 'all', label: 'All Citizens', count: allCitizens.length, icon: Users },
          ].map(tab => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  active ? 'text-brand-400' : 'text-surface-400 hover:text-surface-200'
                }`}>
                <TabIcon size={15} />
                {tab.label}
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                  active ? 'bg-brand-500/15 text-brand-400' : 'bg-surface-700/50 text-surface-500'
                }`}>{tab.count}</span>
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t" />}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
            </div>
          ) : activeTab === 'pending' ? (
            pendingCitizens.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success-500/10 mb-4">
                  <CheckCircle2 size={28} className="text-success-400" />
                </div>
                <p className="text-surface-300 font-medium">All caught up!</p>
                <p className="text-sm text-surface-500 mt-1">No pending verifications at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCitizens.map((citizen, idx) => (
                  <div key={idx} className="rounded-xl border border-surface-700/40 bg-surface-800/30 p-5 hover:border-surface-600/60 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center border border-brand-500/20">
                          <span className="text-lg font-bold gradient-text">{citizen.fullName.charAt(0)}</span>
                        </div>
                        <div className="lg:hidden">
                          <p className="font-semibold text-white">{citizen.fullName}</p>
                          <p className="text-xs text-surface-400">{getGenderText(citizen.gender)}, {Number(citizen.age)} years</p>
                        </div>
                      </div>
                      <div className="flex-1 grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <p className="font-semibold text-white hidden lg:block">{citizen.fullName}</p>
                          <p className="text-xs text-surface-400 hidden lg:block">{getGenderText(citizen.gender)}, {Number(citizen.age)} years</p>
                          <div className="flex items-center gap-2 text-sm text-surface-300">
                            <Phone size={13} className="text-surface-500" /> {citizen.mobileNumber}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-surface-300">
                            <CreditCard size={13} className="text-surface-500" /> {citizen.aadhaarNumber.substring(0,4)} •••• ••••
                          </div>
                          <div className="flex items-center gap-2 text-surface-300">
                            <Calendar size={13} className="text-surface-500" /> {citizen.dateOfBirth}
                          </div>
                          <p className="text-xs text-surface-500">Reg: {formatDate(citizen.registrationTime)}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-surface-300">
                            <MapPin size={13} className="text-surface-500" />
                            <span className="font-medium text-brand-400">{citizen.constituency}</span>
                          </div>
                          <p className="text-surface-400">{citizen.district}, {citizen.state}</p>
                        </div>
                      </div>
                      <div className="flex lg:flex-col gap-2 flex-shrink-0">
                        <button onClick={() => setExpandedCitizen(expandedCitizen === idx ? null : idx)}
                          className={`btn btn-sm flex-1 lg:flex-none ${expandedCitizen === idx ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20'}`}>
                          <Eye size={14} /> {expandedCitizen === idx ? 'Hide' : 'Review'}
                        </button>
                        <button onClick={() => handleVerify(citizen.principal, true)}
                          className="btn btn-sm flex-1 lg:flex-none bg-success-500/10 text-success-400 border border-success-500/20 hover:bg-success-500/20">
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button onClick={() => handleVerify(citizen.principal, false)}
                          className="btn btn-sm flex-1 lg:flex-none btn-danger">
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>

                    {/* Expanded Document Review Panel */}
                    {expandedCitizen === idx && (
                      <div className="mt-5 pt-5 border-t border-surface-700/40 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText size={15} className="text-brand-400" />
                          <h4 className="text-sm font-semibold text-white">Document Verification</h4>
                          <span className="text-xs text-surface-500 ml-auto">Review documents before approving</span>
                        </div>

                        {/* Photo Documents */}
                        <div className="grid sm:grid-cols-2 gap-4 mb-5">
                          <div className="rounded-xl border border-surface-700/40 bg-surface-900/50 p-3">
                            <div className="flex items-center gap-2 mb-2.5">
                              <Image size={13} className="text-surface-500" />
                              <span className="text-xs font-medium text-surface-400">Aadhaar Card Photo</span>
                            </div>
                            {citizen.aadhaarPhotoUrl && citizen.aadhaarPhotoUrl !== 'https://via.placeholder.com/150' ? (
                              <img src={citizen.aadhaarPhotoUrl} alt="Aadhaar Card" className="w-full h-44 object-contain rounded-lg bg-surface-800 border border-surface-700/30" />
                            ) : (
                              <div className="w-full h-44 rounded-lg bg-surface-800 border border-dashed border-surface-600/50 flex items-center justify-center">
                                <div className="text-center">
                                  <Image size={24} className="text-surface-600 mx-auto mb-2" />
                                  <p className="text-xs text-surface-600">No document uploaded</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="rounded-xl border border-surface-700/40 bg-surface-900/50 p-3">
                            <div className="flex items-center gap-2 mb-2.5">
                              <User size={13} className="text-surface-500" />
                              <span className="text-xs font-medium text-surface-400">Voter Photo / Selfie</span>
                            </div>
                            {citizen.photoUrl && citizen.photoUrl !== 'https://via.placeholder.com/150' ? (
                              <img src={citizen.photoUrl} alt="Voter Photo" className="w-full h-44 object-contain rounded-lg bg-surface-800 border border-surface-700/30" />
                            ) : (
                              <div className="w-full h-44 rounded-lg bg-surface-800 border border-dashed border-surface-600/50 flex items-center justify-center">
                                <div className="text-center">
                                  <User size={24} className="text-surface-600 mx-auto mb-2" />
                                  <p className="text-xs text-surface-600">No photo uploaded</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detailed Info Grid */}
                        <div className="rounded-xl border border-surface-700/40 bg-surface-900/30 p-4">
                          <h5 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Submitted Details</h5>
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2.5">
                              <CreditCard size={13} className="text-surface-500 flex-shrink-0" />
                              <span className="text-surface-500">Aadhaar No:</span>
                              <span className="text-white font-mono text-xs">{citizen.aadhaarNumber}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <FileText size={13} className="text-surface-500 flex-shrink-0" />
                              <span className="text-surface-500">Voter ID:</span>
                              <span className="text-white font-mono text-xs">{citizen.voterIdNumber}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Calendar size={13} className="text-surface-500 flex-shrink-0" />
                              <span className="text-surface-500">DOB:</span>
                              <span className="text-surface-200">{citizen.dateOfBirth}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Phone size={13} className="text-surface-500 flex-shrink-0" />
                              <span className="text-surface-500">Mobile:</span>
                              <span className="text-surface-200">{citizen.mobileNumber}</span>
                            </div>
                            <div className="sm:col-span-2 flex items-start gap-2.5">
                              <MapPin size={13} className="text-surface-500 flex-shrink-0 mt-0.5" />
                              <span className="text-surface-500 flex-shrink-0">Address:</span>
                              <span className="text-surface-300">
                                {citizen.addressLine1}{citizen.addressLine2 ? ', ' + citizen.addressLine2 : ''}, {citizen.city}, {citizen.district}, {citizen.state} &mdash; {citizen.pincode}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Aadhaar OTP Verified Status */}
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <CheckCircle2 size={13} className="text-success-400" />
                          <span className="text-success-400 font-medium">Aadhaar verified via OTP</span>
                          <span className="text-surface-600 mx-1">&middot;</span>
                          <span className="text-surface-500">Registered: {formatDate(citizen.registrationTime)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            allCitizens.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-700/30 mb-4">
                  <Users size={28} className="text-surface-500" />
                </div>
                <p className="text-surface-300 font-medium">No citizens registered yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allCitizens.map((citizen, idx) => {
                  const st = getStatusText(citizen.status);
                  return (
                    <div key={idx} className="rounded-xl border border-surface-700/30 bg-surface-800/20 p-4 hover:border-surface-600/50 transition-colors">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-surface-700/40 flex items-center justify-center text-sm font-semibold text-surface-300">
                            {citizen.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{citizen.fullName}</p>
                            <p className="text-xs text-surface-500">{Number(citizen.age)}y · {getGenderText(citizen.gender)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-surface-300">{citizen.constituency}</p>
                          <p className="text-xs text-surface-500">{citizen.district}, {citizen.state}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm text-surface-300">
                            <Phone size={12} className="text-surface-500" /> {citizen.mobileNumber}
                          </div>
                          {citizen.voterIdNumber && citizen.voterIdNumber[0] && (
                            <p className="text-xs text-surface-500 mt-0.5 font-mono">EPIC: {citizen.voterIdNumber[0]}</p>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <span className={`badge ${
                            st === 'Verified' ? 'badge-success' :
                            st === 'Pending' ? 'badge-warning' :
                            st === 'Rejected' ? 'badge-danger' : 'badge-neutral'
                          }`}>{st}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;