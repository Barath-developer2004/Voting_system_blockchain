import React, { useState, useEffect } from 'react';
import { ArrowLeft, Landmark, Vote, Users, Clock, CalendarRange, MapPin, Plus, X, Play, Square, Award, TrendingUp, ChevronRight, Fingerprint, CheckCircle2, Trophy, BarChart3, GraduationCap, Briefcase, FileText, User, ShieldCheck } from 'lucide-react';
import * as api from '../service';
import BiometricVerificationModal from './BiometricVerificationModal';

function Elections({ isAdmin }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showBiometricVerification, setShowBiometricVerification] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);
  const [voteReceipt, setVoteReceipt] = useState(null);

  // Map backend errors to user-friendly messages
  const getUserFriendlyError = (err) => {
    if (!err) return 'An unexpected error occurred. Please try again.';
    const msg = typeof err === 'string' ? err : err.message || String(err);
    if (msg.includes('not registered')) return 'You need to register as a citizen first.';
    if (msg.includes('not verified')) return 'Your registration is pending verification by an Election Officer.';
    if (msg.includes('rejected')) return 'Your registration was rejected. Contact the Election Commission.';
    if (msg.includes('suspended')) return 'Your account is suspended. Contact the Election Commission.';
    if (msg.includes('not eligible')) return 'You are not eligible to vote.';
    if (msg.includes('already voted')) return 'You have already voted in this election.';
    if (msg.includes('not started')) return 'Voting has not started yet for this election.';
    if (msg.includes('ended') || msg.includes('closed')) return 'Voting has ended for this election.';
    if (msg.includes('constituency')) return 'You are not in the constituency for this election.';
    if (msg.includes('Biometric')) return msg; // Biometric messages are already user-friendly
    return msg;
  };

  const generateVoteRef = (electionId) => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(16).substr(2, 6).toUpperCase();
    return `VR-${Number(electionId)}-${dateStr}-${rand}`;
  };

  useEffect(() => { loadElections(); }, []);
  useEffect(() => { if (selectedElection) loadElectionDetails(); }, [selectedElection]);

  const loadElections = async () => {
    try { setElections(await api.getAllElections()); } catch (e) { console.error(e); }
  };

  const loadElectionDetails = async () => {
    setLoading(true);
    try {
      const [electionCandidates, electionResults, votedStatus] = await Promise.all([
        api.getCandidates(selectedElection.id),
        api.getElectionResults(selectedElection.id),
        api.hasVoted(selectedElection.id)
      ]);
      setCandidates(electionCandidates);
      if (electionResults.ok) setResults(electionResults.ok);
      setHasVoted(votedStatus);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleVote = async (candidateId) => {
    if (!confirm('Are you sure you want to vote for this candidate? This action cannot be undone!')) return;
    try {
      setLoading(true);
      const citizenProfile = await api.getMyCitizenProfile();
      if (citizenProfile.err) { alert(getUserFriendlyError(citizenProfile.err)); setLoading(false); return; }
      const statusKey = Object.keys(citizenProfile.ok?.status || {})[0];
      if (statusKey !== 'Verified') { alert('Your status: ' + statusKey + '\nPlease wait for verification.'); setLoading(false); return; }
      const candidate = candidates.find(c => c.id === candidateId);
      setPendingVote({ candidateId, candidateName: candidate?.name || 'Unknown' });
      setLoading(false);
      setShowBiometricVerification(true);
    } catch (error) { alert('Error: ' + error.message); setLoading(false); }
  };

  const handleBiometricVerified = async () => {
    if (!pendingVote) return;
    setSubmittingVote(true);
    try {
      console.log('🗳️ Submitting vote for election:', selectedElection.id, 'candidate:', pendingVote.candidateId);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vote submission timed out. Please try again.')), 30000)
      );
      
      const castVotePromise = api.castVote(selectedElection.id, pendingVote.candidateId);
      const result = await Promise.race([castVotePromise, timeoutPromise]);
      
      console.log('📦 Vote result:', result);
      
      if (result && result.ok) {
        console.log('✅ Vote submitted successfully:', result.ok);
        const candidate = candidates.find(c => c.id === pendingVote.candidateId);
        setVoteReceipt({
          electionTitle: selectedElection.title,
          electionId: Number(selectedElection.id),
          candidateName: pendingVote.candidateName,
          candidateParty: candidate?.party || '',
          timestamp: new Date().toLocaleString(),
          referenceId: generateVoteRef(selectedElection.id),
          message: result.ok
        });
        // Immediately mark that user has voted to prevent UI from showing vote button
        setHasVoted(true);
        // Keep biometric modal visible while showing receipt
        setSubmittingVote(false);
      } else if (result && result.err) {
        console.error('❌ Vote failed:', result.err);
        setPendingVote(null);
        setShowBiometricVerification(false);
        setSubmittingVote(false);
        alert(getUserFriendlyError(result.err));
      } else {
        console.error('❌ Unexpected result format:', result);
        setPendingVote(null);
        setShowBiometricVerification(false);
        setSubmittingVote(false);
        alert('Unexpected response from blockchain. Please try again.');
      }
    } catch (error) {
      console.error('❌ Vote submission error:', error);
      setPendingVote(null);
      setShowBiometricVerification(false);
      setSubmittingVote(false);
      alert(getUserFriendlyError(error));
    }
  };

  const handleBiometricCancelled = () => { setShowBiometricVerification(false); setPendingVote(null); };

  const handleStartVoting = async (electionId) => {
    try {
      const r = await api.startVoting(electionId);
      if (r.ok) { alert(r.ok); await loadElections(); if (selectedElection?.id === electionId) await loadElectionDetails(); } else alert('Error: ' + r.err);
    } catch (e) { console.error(e); }
  };

  const handleEndVoting = async (electionId) => {
    if (!confirm('End voting for this election?')) return;
    try {
      const r = await api.endVoting(electionId);
      if (r.ok) { alert(r.ok); await loadElections(); if (selectedElection?.id === electionId) await loadElectionDetails(); } else alert('Error: ' + r.err);
    } catch (e) { console.error(e); }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const r = await api.addCandidate({
        name: fd.get('name'), age: Number(fd.get('age')), party: fd.get('party'),
        partySymbol: fd.get('symbol'), photoUrl: fd.get('photo') || '', education: fd.get('education'),
        occupation: fd.get('occupation'), manifesto: fd.get('manifesto'),
        electionId: selectedElection.id, constituency: selectedElection.constituency
      });
      if (r.ok) { alert('Candidate added! ID: ' + r.ok); setShowAddCandidate(false); await loadElectionDetails(); e.target.reset(); }
      else alert('Error: ' + r.err);
    } catch (e) { alert('Failed to add candidate'); }
  };

  const formatDate = (ts) => new Date(Number(ts) / 1000000).toLocaleString();
  const getType = (t) => Object.keys(t)[0];
  const getLevel = (l) => Object.keys(l)[0];
  const getStatusKey = (s) => Object.keys(s)[0];

  const statusStyles = {
    Upcoming:         { badge: 'badge-neutral',  dot: 'bg-surface-400' },
    RegistrationOpen: { badge: 'badge-brand',    dot: 'bg-brand-400' },
    VotingOpen:       { badge: 'badge-success',  dot: 'bg-success-400 animate-pulse' },
    VotingClosed:     { badge: 'badge-warning',  dot: 'bg-warning-400' },
    ResultsDeclared:  { badge: 'badge-brand',    dot: 'bg-purple-400' },
    Cancelled:        { badge: 'badge-danger',   dot: 'bg-danger-400' },
  };

  // ──── ELECTION LIST VIEW ────
  if (!selectedElection) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-white">Elections</h2>
          <p className="text-sm text-surface-400 mt-0.5">Browse and participate in blockchain-secured elections</p>
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-500/10 mb-6">
              <Landmark size={36} className="text-brand-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Elections Yet</h3>
            <p className="text-surface-400 max-w-sm mx-auto">
              {isAdmin ? 'Create an election from the Dashboard to get started.' : 'Elections will appear here when they are created.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {elections.map((election) => {
              const sk = getStatusKey(election.status);
              const st = statusStyles[sk] || statusStyles.Upcoming;
              return (
                <div key={election.id} onClick={() => setSelectedElection(election)}
                  className="card-interactive group cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge ${st.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.dot}`} />
                      {sk.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <ChevronRight size={16} className="text-surface-500 group-hover:text-brand-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">{election.title}</h3>
                  <p className="text-sm text-surface-400 mb-4 line-clamp-2">{election.description}</p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-surface-300"><Landmark size={13} className="text-surface-500" />{getType(election.electionType)} · {getLevel(election.level)}</div>
                    <div className="flex items-center gap-2 text-surface-300"><MapPin size={13} className="text-surface-500" />{election.constituency}</div>
                    <div className="flex items-center gap-2 text-surface-300"><CalendarRange size={13} className="text-surface-500" /><span className="text-xs">{formatDate(election.votingStartDate)}</span></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-surface-700/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Vote size={14} className="text-brand-400" />
                      <span className="font-bold text-white">{Number(election.totalVotes)}</span>
                      <span className="text-surface-500">votes</span>
                    </div>
                    <span className="text-xs text-brand-400 font-medium group-hover:underline">View Details</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ──── ELECTION DETAIL VIEW ────
  const currentStatus = getStatusKey(selectedElection.status);
  const isVotingOpen = currentStatus === 'VotingOpen';
  const isVotingClosed = currentStatus === 'VotingClosed' || currentStatus === 'ResultsDeclared';
  const st = statusStyles[currentStatus] || statusStyles.Upcoming;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {showBiometricVerification && pendingVote && (
        <BiometricVerificationModal onVerified={handleBiometricVerified} onCancel={handleBiometricCancelled}
          candidateName={pendingVote.candidateName} electionTitle={selectedElection?.title || 'Election'} submittingVote={submittingVote} />
      )}

      {/* Vote Receipt Modal */}
      {voteReceipt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 border border-surface-700/60 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in-up overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-success-500/20 via-success-500/10 to-emerald-500/20 px-6 py-5 text-center border-b border-success-500/20">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-500/20 mb-3">
                <CheckCircle2 size={28} className="text-success-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Vote Confirmed!</h3>
              <p className="text-sm text-success-400 mt-1">Your vote has been securely recorded</p>
            </div>

            {/* Receipt Details */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-surface-500 uppercase tracking-wider">Election</span>
                  <span className="text-sm font-semibold text-white text-right max-w-[60%]">{voteReceipt.electionTitle}</span>
                </div>
                <div className="border-t border-surface-700/30" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-500 uppercase tracking-wider">Candidate</span>
                  <span className="text-sm font-semibold text-brand-400">{voteReceipt.candidateName}</span>
                </div>
                <div className="border-t border-surface-700/30" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-500 uppercase tracking-wider">Party</span>
                  <span className="text-sm text-surface-200">{voteReceipt.candidateParty}</span>
                </div>
                <div className="border-t border-surface-700/30" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-500 uppercase tracking-wider">Date & Time</span>
                  <span className="text-sm text-surface-300">{voteReceipt.timestamp}</span>
                </div>
                <div className="border-t border-surface-700/30" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-500 uppercase tracking-wider">Reference</span>
                  <span className="text-sm font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{voteReceipt.referenceId}</span>
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-800/50 border border-surface-700/30">
                <ShieldCheck size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-surface-400 leading-relaxed">
                  This vote is permanently recorded on the blockchain and cannot be modified or deleted. Your vote is anonymous and tamper-proof.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const text = `Vote Receipt\n${String.fromCharCode(9472).repeat(30)}\nElection: ${voteReceipt.electionTitle}\nCandidate: ${voteReceipt.candidateName}\nParty: ${voteReceipt.candidateParty}\nDate: ${voteReceipt.timestamp}\nReference: ${voteReceipt.referenceId}\n${String.fromCharCode(9472).repeat(30)}\nRecorded on ICP Blockchain`;
                    navigator.clipboard.writeText(text);
                  }}
                  className="btn btn-ghost btn-sm flex-1">
                  Copy Receipt
                </button>
                <button
                  onClick={async () => {
                    setVoteReceipt(null);
                    setShowBiometricVerification(false);
                    setPendingVote(null);
                    await loadElectionDetails();
                  }}
                  className="btn btn-primary btn-sm flex-1">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => { setSelectedElection(null); setCandidates([]); setResults(null); setHasVoted(false); setVoteReceipt(null); }}
        className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Elections
      </button>

      {/* Election Header Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`badge ${st.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.dot}`} />
                {currentStatus.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{selectedElection.title}</h2>
            <p className="text-sm text-surface-400 mt-1">{selectedElection.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Type', value: getType(selectedElection.electionType), icon: Landmark },
            { label: 'Level', value: getLevel(selectedElection.level), icon: TrendingUp },
            { label: 'Constituency', value: selectedElection.constituency, icon: MapPin },
            { label: 'Starts', value: formatDate(selectedElection.votingStartDate), icon: Clock, small: true },
            { label: 'Total Votes', value: Number(selectedElection.totalVotes), icon: Vote, highlight: true },
            { label: 'Candidates', value: candidates.length, icon: Users, highlight: true },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="stat-card">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={13} className="text-surface-500" />
                  <span className="text-xs text-surface-500">{item.label}</span>
                </div>
                <p className={`${item.highlight ? 'text-xl font-bold text-brand-400' : item.small ? 'text-xs font-medium text-surface-200' : 'text-sm font-semibold text-white'}`}>
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-surface-700/40 flex flex-wrap gap-3">
            <button onClick={() => setShowAddCandidate(!showAddCandidate)}
              className={showAddCandidate ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}>
              {showAddCandidate ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Candidate</>}
            </button>
            {currentStatus === 'Upcoming' && (
              <button onClick={() => handleStartVoting(selectedElection.id)} className="btn btn-sm bg-success-500/10 text-success-400 border border-success-500/20 hover:bg-success-500/20">
                <Play size={14} /> Start Voting
              </button>
            )}
            {isVotingOpen && (
              <button onClick={() => handleEndVoting(selectedElection.id)} className="btn btn-danger btn-sm">
                <Square size={14} /> End Voting
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Candidate Form */}
      {showAddCandidate && isAdmin && (
        <div className="card animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><User size={20} className="text-brand-400" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Add New Candidate</h3>
              <p className="text-xs text-surface-400">Fill in the candidate's details</p>
            </div>
          </div>
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="label">Name *</label><input name="name" required className="input" /></div>
              <div><label className="label">Age *</label><input name="age" type="number" required className="input" /></div>
              <div><label className="label">Party *</label><input name="party" required className="input" placeholder="BJP / Congress / AAP / Independent" /></div>
              <div><label className="label">Party Symbol *</label><input name="symbol" required className="input" placeholder="Lotus / Hand / Broom" /></div>
              <div><label className="label">Education *</label><input name="education" required className="input" /></div>
              <div><label className="label">Occupation *</label><input name="occupation" required className="input" /></div>
              <div className="md:col-span-2"><label className="label">Photo URL</label><input name="photo" className="input" placeholder="https://..." /></div>
              <div className="md:col-span-2"><label className="label">Manifesto *</label><textarea name="manifesto" required className="input" rows="3" /></div>
            </div>
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Candidate</button>
          </form>
        </div>
      )}

      {/* Candidates */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Users size={18} className="text-brand-400" /> Candidates</h3>
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">{[...Array(2)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12 card">
            <Users size={32} className="text-surface-500 mx-auto mb-3" />
            <p className="text-surface-400">No candidates added yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {candidates.map((candidate) => {
              const maxVotes = Math.max(...candidates.map(c => Number(c.votesReceived)), 1);
              const votePercent = isVotingClosed ? Math.round((Number(candidate.votesReceived) / maxVotes) * 100) : 0;
              const isWinner = results?.winner?.[0] && results.winner[0][0] === candidate.id;

              return (
                <div key={candidate.id} className={`card relative overflow-hidden ${isWinner ? 'ring-2 ring-warning-400/50' : ''}`}>
                  {isWinner && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-400 via-yellow-300 to-warning-400" />
                  )}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center border border-brand-500/20 flex-shrink-0 overflow-hidden">
                      {candidate.photoUrl ? (
                        <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <span className={`text-xl font-bold gradient-text ${candidate.photoUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>{candidate.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white truncate">{candidate.name}</h4>
                        {isWinner && <Trophy size={16} className="text-warning-400 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-surface-400">{Number(candidate.age)} yrs · {candidate.occupation}</p>
                      <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                        {candidate.party} · {candidate.partySymbol}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-surface-300"><GraduationCap size={13} className="text-surface-500" /> {candidate.education}</div>
                    <div className="flex items-start gap-2 text-surface-400"><FileText size={13} className="text-surface-500 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{candidate.manifesto}</span></div>
                  </div>

                  {isVotingClosed && (
                    <div className="pt-4 border-t border-surface-700/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-surface-500">Votes Received</span>
                        <span className="text-lg font-bold text-brand-400">{Number(candidate.votesReceived)}</span>
                      </div>
                      <div className="w-full h-2 bg-surface-700/40 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${isWinner ? 'bg-gradient-to-r from-warning-400 to-yellow-300' : 'bg-brand-500/60'}`} style={{ width: `${votePercent}%` }} />
                      </div>
                    </div>
                  )}

                  {isVotingOpen && !hasVoted && !isAdmin && (
                    <button onClick={() => handleVote(candidate.id)}
                      className="btn btn-primary w-full mt-4 group">
                      <Fingerprint size={16} className="group-hover:scale-110 transition-transform" />
                      Vote with Fingerprint
                    </button>
                  )}

                  {hasVoted && isVotingOpen && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-success-400 bg-success-500/5 border border-success-500/15 rounded-xl py-3">
                      <CheckCircle2 size={15} /> You have voted
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      {isVotingClosed && results && (
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-brand-400" /> Election Results</h3>

          {results.winner && results.winner[0] && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning-500/10 via-yellow-500/5 to-warning-500/10 border border-warning-500/20 p-6 mb-6 text-center">
              <Trophy size={32} className="text-warning-400 mx-auto mb-3" />
              <p className="text-xs font-semibold text-warning-400/70 uppercase tracking-widest mb-1">Winner</p>
              <h4 className="text-2xl font-bold text-white">{results.winner[0][1]}</h4>
              <p className="text-sm text-surface-300 mt-1">{results.winner[0][2]}</p>
              <p className="text-3xl font-bold text-warning-400 mt-3">{Number(results.winner[0][3])} <span className="text-base font-normal text-surface-400">votes</span></p>
            </div>
          )}

          <div className="space-y-3">
            {results.candidates
              .sort((a, b) => Number(b[3]) - Number(a[3]))
              .map((candidate, index) => {
                const maxV = Math.max(...results.candidates.map(c => Number(c[3])), 1);
                const pct = Math.round((Number(candidate[3]) / maxV) * 100);
                const isW = results.winner?.[0]?.[0] === candidate[0];
                return (
                  <div key={candidate[0]} className={`flex items-center gap-4 p-4 rounded-xl ${isW ? 'bg-warning-500/5 border border-warning-500/15' : 'bg-surface-800/30 border border-surface-700/30'}`}>
                    <span className={`text-lg font-bold w-8 text-center ${index === 0 ? 'text-warning-400' : 'text-surface-500'}`}>#{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white truncate">{candidate[1]}</p>
                        {isW && <Trophy size={14} className="text-warning-400" />}
                      </div>
                      <p className="text-xs text-surface-500">{candidate[2]}</p>
                      <div className="w-full h-1.5 bg-surface-700/40 rounded-full overflow-hidden mt-2">
                        <div className={`h-full rounded-full ${isW ? 'bg-warning-400' : 'bg-brand-500/50'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${isW ? 'text-warning-400' : 'text-white'}`}>{Number(candidate[3])}</p>
                      <p className="text-xs text-surface-500">votes</p>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 pt-6 border-t border-surface-700/40 text-center">
            <p className="text-sm text-surface-500">Total Votes Cast</p>
            <p className="text-3xl font-bold gradient-text">{Number(results.totalVotes)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Elections;