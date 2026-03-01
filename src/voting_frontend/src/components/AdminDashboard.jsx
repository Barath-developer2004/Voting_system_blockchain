import React, { useState, useEffect } from 'react';
import * as api from '../service';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingCitizens, setPendingCitizens] = useState([]);
  const [allCitizens, setAllCitizens] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showElectionForm, setShowElectionForm] = useState(false);

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
      console.log('🔍 Verifying citizen:', principal.toText(), 'Approve:', approve);
      
      const result = await api.verifyCitizen(
        principal,
        approve,
        [],  // Auto-generate voter ID when approving
        approve ? [] : ['Documents incomplete']  // Rejection reason only when rejecting
      );

      console.log('✅ Verification result:', result);

      if (result.ok) {
        alert('✅ ' + result.ok);
        await loadData();
      } else {
        alert('❌ Error: ' + result.err);
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
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

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
  };

  const getGenderText = (gender) => Object.keys(gender)[0];
  const getStatusText = (status) => Object.keys(status)[0];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Election Officer Dashboard</h2>
        <p className="text-gray-600">Manage citizens, elections, and candidates</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-gray-600">Total Citizens</p>
            <p className="text-2xl font-bold text-primary">{statistics.totalCitizens}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Verified</p>
            <p className="text-2xl font-bold text-green-600">{statistics.verifiedCitizens}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics.pendingVerifications}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Elections</p>
            <p className="text-2xl font-bold text-primary">{statistics.totalElections}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">{statistics.activeElections}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Votes Cast</p>
            <p className="text-2xl font-bold text-primary">{statistics.totalVotesCast}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card mb-8">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowElectionForm(!showElectionForm)}
            className="btn btn-primary"
          >
            {showElectionForm ? '✕ Cancel' : '+ Create Election'}
          </button>
          <button onClick={() => setActiveTab('pending')} className="btn btn-outline">
            View Pending ({pendingCitizens.length})
          </button>
          <button onClick={loadData} className="btn btn-outline">
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Create Election Form */}
      {showElectionForm && (
        <div className="card mb-8 bg-blue-50">
          <h3 className="text-xl font-bold mb-4">Create New Election</h3>
          <form onSubmit={handleCreateElection} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Election Title *</label>
                <input name="title" required className="input" placeholder="2026 Parliament Elections" />
              </div>
              <div>
                <label className="label">Constituency *</label>
                <input name="constituency" required className="input" placeholder="e.g., Tiruvallur or Tiruvallur-600019 or ALL" />
                <p className="text-xs text-gray-500 mt-1">
                  Use district name (e.g., "Tiruvallur") for district-wide elections, 
                  "District-Pincode" for specific areas, or "ALL" for national elections
                </p>
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
                <input name="state" className="input" placeholder="Maharashtra" />
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
              <textarea name="description" className="input" rows="3" placeholder="Election description..."></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Create Election</button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium ${activeTab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
          >
            Pending Verification ({pendingCitizens.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
          >
            All Citizens ({allCitizens.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'pending' && pendingCitizens.length === 0 && (
              <p className="text-gray-600 text-center py-8">No pending verifications</p>
            )}

            {activeTab === 'pending' && pendingCitizens.map((citizen, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-bold text-lg">{citizen.fullName}</p>
                      <p className="text-sm text-gray-600">{getGenderText(citizen.gender)}, {citizen.age} years</p>
                      <p className="text-sm text-gray-600">📱 {citizen.mobileNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm"><span className="text-gray-600">Aadhaar:</span> {citizen.aadhaarNumber.substring(0,4)} **** ****</p>
                      <p className="text-sm"><span className="text-gray-600">DOB:</span> {citizen.dateOfBirth}</p>
                      <p className="text-sm"><span className="text-gray-600">Registered:</span> {formatDate(citizen.registrationTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm"><span className="text-gray-600">Constituency:</span> <span className="font-medium">{citizen.constituency}</span></p>
                      <p className="text-sm"><span className="text-gray-600">District:</span> {citizen.district}</p>
                      <p className="text-sm"><span className="text-gray-600">State:</span> {citizen.state}</p>
                    </div>
                  </div>
                  <div className="ml-4 space-y-2">
                    <button
                      onClick={() => handleVerify(citizen.principal, true)}
                      className="btn btn-secondary w-full"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleVerify(citizen.principal, false)}
                      className="btn btn-outline w-full text-red-600 border-red-600"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'all' && allCitizens.map((citizen, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-bold">{citizen.fullName}</p>
                    <p className="text-sm text-gray-600">{citizen.age} years, {getGenderText(citizen.gender)}</p>
                  </div>
                  <div>
                    <p className="text-sm">{citizen.constituency}</p>
                    <p className="text-sm text-gray-600">{citizen.district}, {citizen.state}</p>
                  </div>
                  <div>
                    <p className="text-sm">📱 {citizen.mobileNumber}</p>
                    {citizen.voterIdNumber && citizen.voterIdNumber[0] && (
                      <p className="text-sm text-gray-600">EPIC: {citizen.voterIdNumber[0]}</p>
                    )}
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      getStatusText(citizen.status) === 'Verified' ? 'bg-green-100 text-green-800' :
                      getStatusText(citizen.status) === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(citizen.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
