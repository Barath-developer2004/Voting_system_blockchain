import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Clock, Landmark, Vote, BarChart3, Plus, X, RefreshCw, ChevronDown, CheckCircle2, XCircle, Phone, MapPin, CreditCard, Calendar, User, FileText, AlertCircle, Eye, Image, MessageSquare, ShieldAlert, UserPlus, Copy } from 'lucide-react';
import * as api from '../service';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingCitizens, setPendingCitizens] = useState([]);
  const [allCitizens, setAllCitizens] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [expandedCitizen, setExpandedCitizen] = useState(null);
  const [smsStatus, setSmsStatus] = useState(null);
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsGatewayUrl, setSmsGatewayUrl] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [recoveryRequests, setRecoveryRequests] = useState([]);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [newAdminPrincipal, setNewAdminPrincipal] = useState('');
  const [adminList, setAdminList] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, all, stats, sms, recovery, admins] = await Promise.all([
        api.getPendingCitizens(),
        api.getAllCitizens(),
        api.getStatistics(),
        api.getSmsStatus().catch(() => null),
        api.getPendingRecoveryRequests().catch(() => null),
        api.getAdmins().catch(() => null)
      ]);

      if (pending.ok) setPendingCitizens(pending.ok);
      if (all.ok) setAllCitizens(all.ok);
      setStatistics(stats);
      if (sms && sms.ok) {
        setSmsStatus(sms.ok);
        if (sms.ok.gateway) setSmsGatewayUrl(sms.ok.gateway);
      }
      if (recovery && recovery.ok) setRecoveryRequests(recovery.ok);
      if (admins && admins.ok) setAdminList(admins.ok);
    } catch (error) {
      console.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSmsConfig = async (e) => {
    e.preventDefault();
    setSmsLoading(true);
    try {
      const result = await api.configureSms(
        smsApiKey,
        true,
        smsGatewayUrl || null
      );
      if (result.ok) {
        alert(result.ok);
        setSmsApiKey('');
        const sms = await api.getSmsStatus();
        if (sms.ok) setSmsStatus(sms.ok);
      } else {
        alert(result.err || 'Failed to configure SMS');
      }
    } catch (error) {
      alert('Failed to configure SMS. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSmsDisable = async () => {
    setSmsLoading(true);
    try {
      const result = await api.configureSms('', false, null);
      if (result.ok) {
        alert(result.ok);
        const sms = await api.getSmsStatus();
        if (sms.ok) setSmsStatus(sms.ok);
      }
    } catch (error) {
      alert('Failed to update SMS settings.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleReviewRecovery = async (requestId, approve) => {
    setRecoveryLoading(true);
    try {
      const result = await api.reviewRecoveryRequest(requestId, approve);
      if (result.ok) {
        alert(result.ok);
        await loadData();
      } else {
        alert(result.err || 'Failed to review recovery request');
      }
    } catch (error) {
      alert('Failed to review recovery request. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminPrincipal.trim()) return;
    setAdminLoading(true);
    try {
      const result = await api.addAdminByInitializer(
        window.__ic_agent_Principal
          ? window.__ic_agent_Principal.fromText(newAdminPrincipal.trim())
          : newAdminPrincipal.trim()
      );
      if (result.ok) {
        alert(result.ok);
        setNewAdminPrincipal('');
        await loadData();
      } else {
        alert(result.err || 'Failed to add admin');
      }
    } catch (error) {
      alert('Failed to add admin. Only the initial deployer/admin can add new admins.');
    } finally {
      setAdminLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPrincipal(text);
    setTimeout(() => setCopiedPrincipal(''), 2000);
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
        alert('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error');
      alert('Failed to verify citizen. Please try again.');
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
        alert('Failed to create election. Please check the details and try again.');
      }
    } catch (error) {
      console.error('Error creating election');
      alert('Failed to create election. Please check the details and try again.');
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
            { key: 'recovery', label: 'Recovery', count: recoveryRequests.length, icon: ShieldAlert },
            { key: 'admins', label: 'Admin Setup', count: null, icon: UserPlus },
            { key: 'sms', label: 'SMS Settings', count: null, icon: MessageSquare },
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
                {tab.count !== null && <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                  active ? 'bg-brand-500/15 text-brand-400' : 'bg-surface-700/50 text-surface-500'
                }`}>{tab.count}</span>}
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
          ) : activeTab === 'recovery' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-400" /> Account Recovery Requests
              </h3>
              <p className="text-sm text-surface-400">
                When citizens lose their Internet Identity, they can request to transfer their profile to a new identity.
                Review and approve legitimate requests below.
              </p>

              {recoveryRequests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-700/30 mb-4">
                    <ShieldAlert size={28} className="text-surface-500" />
                  </div>
                  <p className="text-surface-300 font-medium">No pending recovery requests</p>
                  <p className="text-surface-500 text-sm mt-1">Recovery requests will appear here when citizens need account transfers.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recoveryRequests.map((req, idx) => (
                    <div key={idx} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="badge badge-warning">Request #{Number(req.id)}</span>
                          <span className="badge badge-success ml-2">OTP Verified</span>
                        </div>
                        <span className="text-xs text-surface-500">
                          {new Date(Number(req.requestedAt) / 1000000).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-surface-500 mb-1">Aadhaar Number</p>
                          <p className="text-surface-300 font-mono">
                            {'••••••••' + req.aadhaarNumber.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 mb-1">Mobile</p>
                          <p className="text-surface-300">{req.mobileNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 mb-1">Old Principal</p>
                          <div className="flex items-center gap-1">
                            <p className="text-surface-400 font-mono text-xs truncate max-w-[220px]">{req.oldPrincipal.toString()}</p>
                            <button onClick={() => copyToClipboard(req.oldPrincipal.toString())}
                              className="text-surface-500 hover:text-surface-300">
                              {copiedPrincipal === req.oldPrincipal.toString() ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 mb-1">New Principal (requesting)</p>
                          <div className="flex items-center gap-1">
                            <p className="text-brand-300 font-mono text-xs truncate max-w-[220px]">{req.newPrincipal.toString()}</p>
                            <button onClick={() => copyToClipboard(req.newPrincipal.toString())}
                              className="text-surface-500 hover:text-surface-300">
                              {copiedPrincipal === req.newPrincipal.toString() ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => handleReviewRecovery(req.id, true)} disabled={recoveryLoading}
                          className="btn btn-sm bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">
                          <CheckCircle2 size={14} /> Approve Transfer
                        </button>
                        <button onClick={() => handleReviewRecovery(req.id, false)} disabled={recoveryLoading}
                          className="btn btn-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'admins' ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-brand-400" /> Admin / Election Officer Setup
              </h3>

              {/* Current Admins */}
              <div className="rounded-xl border border-surface-700/30 bg-surface-800/20 p-5">
                <h4 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">
                  Current Election Officers ({adminList.length})
                </h4>
                {adminList.length > 0 ? (
                  <div className="space-y-2">
                    {adminList.map((admin, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-surface-800/40 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <ShieldCheck size={16} className="text-brand-400" />
                          </div>
                          <div>
                            <p className="text-sm font-mono text-surface-300 truncate max-w-[300px]">{admin.toString()}</p>
                            {idx === 0 && <span className="text-xs text-brand-400">Super Admin (Deployer)</span>}
                          </div>
                        </div>
                        <button onClick={() => copyToClipboard(admin.toString())}
                          className="btn btn-sm btn-ghost">
                          {copiedPrincipal === admin.toString() ? <><CheckCircle2 size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-surface-500 text-sm">No admins found.</p>
                )}
              </div>

              {/* Add New Admin */}
              <div className="rounded-xl border border-surface-700/30 bg-surface-800/20 p-5">
                <h4 className="text-white font-semibold mb-1">Add New Election Officer</h4>
                <p className="text-surface-500 text-sm mb-4">
                  Only the Super Admin (first admin / deployer) can add new officers.
                  The new officer must log in with Internet Identity first and share their Principal ID.
                </p>
                <form onSubmit={handleAddAdmin} className="space-y-3">
                  <div>
                    <label className="label">New Admin's Principal ID</label>
                    <input type="text" value={newAdminPrincipal}
                      onChange={e => setNewAdminPrincipal(e.target.value)}
                      placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-..."
                      className="input font-mono text-sm" required />
                  </div>
                  <button type="submit" disabled={adminLoading || !newAdminPrincipal.trim()}
                    className="btn btn-primary">
                    {adminLoading ? 'Adding...' : <><UserPlus size={16} /> Add Election Officer</>}
                  </button>
                </form>
              </div>

              {/* Help */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex gap-3">
                  <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-surface-300 space-y-1">
                    <p className="font-medium text-blue-300">How to add a new admin</p>
                    <p>1. The new officer opens this site and clicks <strong className="text-white">Get Started</strong> to log in with Internet Identity.</p>
                    <p>2. After logging in, they go to <strong className="text-white">Settings → Account</strong> and copy their Principal ID.</p>
                    <p>3. Paste that Principal ID above and click "Add Election Officer".</p>
                    <p>4. The new officer refreshes their page — they'll now see the Admin Dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'sms' ? (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="rounded-xl border border-surface-700/30 bg-surface-800/20 p-5">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare size={18} /> SMS Gateway Status
                </h3>
                {smsStatus ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${smsStatus.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-surface-300">
                        {smsStatus.enabled ? 'SMS Enabled' : 'SMS Disabled (Demo Mode)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${smsStatus.configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-surface-300">
                        {smsStatus.configured ? 'API Key Set' : 'No API Key'}
                      </span>
                    </div>
                    <div className="text-surface-400 text-sm truncate" title={smsStatus.gateway}>
                      Gateway: {smsStatus.gateway}
                    </div>
                  </div>
                ) : (
                  <p className="text-surface-500">Loading SMS status...</p>
                )}
                {smsStatus?.enabled && (
                  <button onClick={handleSmsDisable} disabled={smsLoading}
                    className="mt-4 btn btn-danger text-sm">
                    {smsLoading ? 'Updating...' : 'Disable SMS (Switch to Demo Mode)'}
                  </button>
                )}
              </div>

              {/* Configure Form */}
              <div className="rounded-xl border border-surface-700/30 bg-surface-800/20 p-5">
                <h3 className="text-white font-semibold mb-1">Configure SMS Gateway</h3>
                <p className="text-surface-500 text-sm mb-4">
                  Enter your Fast2SMS API key to enable real OTP delivery to mobile phones.
                  Get your API key from <span className="text-brand-400">fast2sms.com</span>
                </p>
                <form onSubmit={handleSmsConfig} className="space-y-4">
                  <div>
                    <label className="label">API Key *</label>
                    <input type="password" required value={smsApiKey}
                      onChange={e => setSmsApiKey(e.target.value)}
                      placeholder="Enter your Fast2SMS API key"
                      className="input" autoComplete="off" />
                  </div>
                  <div>
                    <label className="label">Gateway URL (optional)</label>
                    <input type="url" value={smsGatewayUrl}
                      onChange={e => setSmsGatewayUrl(e.target.value)}
                      placeholder="https://www.fast2sms.com/dev/bulkV2"
                      className="input" />
                    <p className="text-xs text-surface-500 mt-1">
                      Leave default for Fast2SMS. Change only if using a different SMS provider.
                    </p>
                  </div>
                  <button type="submit" disabled={smsLoading || !smsApiKey}
                    className="btn btn-primary">
                    {smsLoading ? 'Saving...' : 'Enable SMS & Save'}
                  </button>
                </form>
              </div>

              {/* Info */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex gap-3">
                  <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-surface-300 space-y-1">
                    <p className="font-medium text-amber-300">How it works</p>
                    <p>When SMS is enabled, OTPs are sent to the voter's mobile via Fast2SMS using IC HTTPS outcalls (on-chain HTTP requests).</p>
                    <p>When SMS is disabled (demo mode), OTPs are shown directly on screen for testing.</p>
                  </div>
                </div>
              </div>
            </div>
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