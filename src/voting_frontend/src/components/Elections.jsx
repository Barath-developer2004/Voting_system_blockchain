import React, { useState, useEffect } from 'react';
import * as api from '../service';
import BiometricVerificationModal from './BiometricVerificationModal';

function Elections({ isAdmin }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showBiometricVerification, setShowBiometricVerification] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      loadElectionDetails();
    }
  }, [selectedElection]);

  const loadElections = async () => {
    try {
      const allElections = await api.getAllElections();
      setElections(allElections);
    } catch (error) {
      console.error('Error loading elections:', error);
    }
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
      if (electionResults.ok) {
        setResults(electionResults.ok);
      }
      setHasVoted(votedStatus);
    } catch (error) {
      console.error('Error loading election details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId) => {
    if (!confirm('Are you sure you want to vote for this candidate? This action cannot be undone!')) {
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is registered as citizen BEFORE biometric verification
      console.log('🔍 Checking citizen status...');
      const citizenProfile = await api.getMyCitizenProfile();
      
      if (citizenProfile.err) {
        alert('❌ ' + citizenProfile.err + '\n\nPlease go to Dashboard → Register as Citizen first');
        setLoading(false);
        return;
      }

      // Check if citizen is verified
      const status = citizenProfile.ok?.status;
      if (status) {
        const statusKey = Object.keys(status)[0];
        if (statusKey !== 'Verified') {
          alert('⏳ Your citizenship status: ' + statusKey + '\n\nPlease wait for "Verified" status by Election Officer before voting.');
          setLoading(false);
          return;
        }
      }

      // All checks passed - show biometric verification modal
      const candidate = candidates.find(c => c.id === candidateId);
      setPendingVote({
        candidateId: candidateId,
        candidateName: candidate?.name || 'Unknown'
      });
      
      setLoading(false);
      setShowBiometricVerification(true);
    } catch (error) {
      console.error('Error checking voting eligibility:', error);
      alert('❌ Error: ' + error.message + '\n\nPlease make sure you are registered as a citizen.');
      setLoading(false);
    }
  };

  const handleBiometricVerified = async () => {
    if (!pendingVote) return;

    try {
      console.log('🗳️ Biometric verified. Casting vote...');
      const result = await api.castVote(selectedElection.id, pendingVote.candidateId);
      
      setShowBiometricVerification(false);
      setPendingVote(null);
      
      if (result.ok) {
        alert('✅ Vote Cast Successfully!\n\n' + result.ok + '\n\nYour vote is now immutably recorded on the blockchain.');
        await loadElectionDetails();
      } else if (result.err) {
        alert('❌ Voting Failed!\n\n' + result.err);
      } else {
        alert('❌ Unexpected error while casting vote');
      }
    } catch (error) {
      console.error('Voting error:', error);
      setShowBiometricVerification(false);
      setPendingVote(null);
      alert('❌ Error Casting Vote:\n\n' + error.message);
    }
  };

  const handleBiometricCancelled = () => {
    setShowBiometricVerification(false);
    setPendingVote(null);
  };

  const handleStartVoting = async (electionId) => {
    try {
      const result = await api.startVoting(electionId);
      if (result.ok) {
        alert(result.ok);
        await loadElections();
        if (selectedElection?.id === electionId) {
          await loadElectionDetails();
        }
      } else {
        alert('Error: ' + result.err);
      }
    } catch (error) {
      console.error('Error starting voting:', error);
    }
  };

  const handleEndVoting = async (electionId) => {
    if (!confirm('Are you sure you want to end voting for this election?')) return;
    
    try {
      const result = await api.endVoting(electionId);
      if (result.ok) {
        alert(result.ok);
        await loadElections();
        if (selectedElection?.id === electionId) {
          await loadElectionDetails();
        }
      } else {
        alert('Error: ' + result.err);
      }
    } catch (error) {
      console.error('Error ending voting:', error);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const candidateData = {
        name: formData.get('name'),
        age: Number(formData.get('age')),
        party: formData.get('party'),
        partySymbol: formData.get('symbol'),
        photoUrl: formData.get('photo') || 'https://via.placeholder.com/150',
        education: formData.get('education'),
        occupation: formData.get('occupation'),
        manifesto: formData.get('manifesto'),
        electionId: selectedElection.id,
        constituency: selectedElection.constituency
      };

      const result = await api.addCandidate(candidateData);
      if (result.ok) {
        alert('Candidate added successfully! ID: ' + result.ok);
        setShowAddCandidate(false);
        await loadElectionDetails();
        e.target.reset();
      } else {
        alert('Error: ' + result.err);
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Failed to add candidate');
    }
  };

  const getStatusBadge = (status) => {
    const statusKey = Object.keys(status)[0];
    const badges = {
      Upcoming: 'bg-gray-100 text-gray-800',
      RegistrationOpen: 'bg-blue-100 text-blue-800',
      VotingOpen: 'bg-green-100 text-green-800',
      VotingClosed: 'bg-yellow-100 text-yellow-800',
      ResultsDeclared: 'bg-purple-100 text-purple-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[statusKey] || ''}`}>
        {statusKey}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
  };

  const getElectionType = (type) => Object.keys(type)[0];
  const getElectionLevel = (level) => Object.keys(level)[0];

  if (!selectedElection) {
    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Elections</h2>

        {elections.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-600">No elections available yet.</p>
            {isAdmin && (
              <p className="mt-4 text-sm text-gray-500">
                Create an election from the Dashboard to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <div key={election.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedElection(election)}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{election.title}</h3>
                  {getStatusBadge(election.status)}
                </div>
                <p className="text-gray-600 text-sm mb-4">{election.description}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">Type:</span> <span className="font-medium">{getElectionType(election.electionType)}</span></p>
                  <p><span className="text-gray-600">Level:</span> <span className="font-medium">{getElectionLevel(election.level)}</span></p>
                  <p><span className="text-gray-600">Constituency:</span> <span className="font-medium">{election.constituency}</span></p>
                  <p><span className="text-gray-600">Voting:</span> <span className="font-medium">
                    {formatDate(election.votingStartDate)} to {formatDate(election.votingEndDate)}
                  </span></p>
                  <p><span className="text-gray-600">Total Votes:</span> <span className="font-bold text-primary">{election.totalVotes}</span></p>
                </div>
                <button className="btn btn-primary w-full mt-4">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Election details view
  const isVotingOpen = Object.keys(selectedElection.status)[0] === 'VotingOpen';
  const isVotingClosed = Object.keys(selectedElection.status)[0] === 'VotingClosed' || 
                         Object.keys(selectedElection.status)[0] === 'ResultsDeclared';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Biometric Verification Modal */}
      {showBiometricVerification && pendingVote && (
        <BiometricVerificationModal
          onVerified={handleBiometricVerified}
          onCancel={handleBiometricCancelled}
          candidateName={pendingVote.candidateName}
          electionTitle={selectedElection?.title || 'Election'}
        />
      )}

      <button
        onClick={() => {
          setSelectedElection(null);
          setCandidates([]);
          setResults(null);
          setHasVoted(false);
        }}
        className="mb-4 text-primary hover:underline"
      >
        ← Back to Elections
      </button>

      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{selectedElection.title}</h2>
            <p className="text-gray-600 mt-2">{selectedElection.description}</p>
          </div>
          {getStatusBadge(selectedElection.status)}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-medium">{getElectionType(selectedElection.electionType)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Level</p>
            <p className="font-medium">{getElectionLevel(selectedElection.level)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Constituency</p>
            <p className="font-medium">{selectedElection.constituency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Voting Period</p>
            <p className="font-medium text-xs">{formatDate(selectedElection.votingStartDate)}</p>
            <p className="font-medium text-xs">to {formatDate(selectedElection.votingEndDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Votes Cast</p>
            <p className="font-bold text-2xl text-primary">{selectedElection.totalVotes}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Candidates</p>
            <p className="font-bold text-2xl text-primary">{candidates.length}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6 pt-6 border-t flex gap-4">
            <button
              onClick={() => setShowAddCandidate(!showAddCandidate)}
              className="btn btn-primary"
            >
              {showAddCandidate ? '✕ Cancel' : '+ Add Candidate'}
            </button>
            {Object.keys(selectedElection.status)[0] === 'Upcoming' && (
              <button onClick={() => handleStartVoting(selectedElection.id)} className="btn btn-secondary">
                ▶ Start Voting
              </button>
            )}
            {isVotingOpen && (
              <button onClick={() => handleEndVoting(selectedElection.id)} className="btn btn-outline text-red-600 border-red-600">
                ⏹ End Voting
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Candidate Form */}
      {showAddCandidate && isAdmin && (
        <div className="card mb-6 bg-blue-50">
          <h3 className="text-xl font-bold mb-4">Add New Candidate</h3>
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input name="name" required className="input" />
              </div>
              <div>
                <label className="label">Age *</label>
                <input name="age" type="number" required className="input" />
              </div>
              <div>
                <label className="label">Party *</label>
                <input name="party" required className="input" placeholder="BJP / Congress / AAP / Independent" />
              </div>
              <div>
                <label className="label">Party Symbol *</label>
                <input name="symbol" required className="input" placeholder="Lotus / Hand / Broom" />
              </div>
              <div>
                <label className="label">Education *</label>
                <input name="education" required className="input" />
              </div>
              <div>
                <label className="label">Occupation *</label>
                <input name="occupation" required className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Photo URL</label>
                <input name="photo" className="input" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="label">Manifesto *</label>
                <textarea name="manifesto" required className="input" rows="3"></textarea>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Candidate</button>
          </form>
        </div>
      )}

      {/* Candidates */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Candidates</h3>
        
        {loading ? (
          <div className="text-center py-8">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-600">No candidates added yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="card border-2 border-gray-200 hover:border-primary transition-all">
                <div className="flex items-start gap-4">
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.age} years • {candidate.occupation}</p>
                    <p className="text-sm font-medium text-primary mt-1">{candidate.party} • {candidate.partySymbol}</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  <p><span className="text-gray-600">Education:</span> <span className="font-medium">{candidate.education}</span></p>
                  <p><span className="text-gray-600">Manifesto:</span> <span className="text-gray-700">{candidate.manifesto}</span></p>
                </div>

                {isVotingClosed && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-center">
                      <span className="text-gray-600">Votes Received:</span>
                      <span className="ml-2 text-2xl font-bold text-primary">{candidate.votesReceived}</span>
                    </p>
                  </div>
                )}

                {isVotingOpen && !hasVoted && !isAdmin && (
                  <button
                    onClick={() => handleVote(candidate.id)}
                    className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
                  >
                    <span>👆</span>
                    <span>Vote (Fingerprint Required)</span>
                  </button>
                )}

                {hasVoted && isVotingOpen && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-medium">✓ You have already voted</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {isVotingClosed && results && (
        <div className="card">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Election Results</h3>
          
          {results.winner && results.winner[0] && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-6 mb-6">
              <p className="text-center text-yellow-800 font-medium mb-2">🏆 WINNER</p>
              <h4 className="text-3xl font-bold text-center text-gray-900">{results.winner[0][1]}</h4>
              <p className="text-center text-lg text-gray-700 mt-2">{results.winner[0][2]}</p>
              <p className="text-center text-4xl font-bold text-primary mt-4">{results.winner[0][3]} votes</p>
            </div>
          )}

          <div className="space-y-3">
            {results.candidates
              .sort((a, b) => Number(b[3]) - Number(a[3]))
              .map((candidate, index) => (
                <div key={candidate[0]} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-bold text-lg">{candidate[1]}</p>
                      <p className="text-sm text-gray-600">{candidate[2]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{Number(candidate[3])}</p>
                    <p className="text-sm text-gray-600">votes</p>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-lg"><span className="text-gray-600">Total Votes Cast:</span> <span className="font-bold text-2xl text-primary">{results.totalVotes}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Elections;
