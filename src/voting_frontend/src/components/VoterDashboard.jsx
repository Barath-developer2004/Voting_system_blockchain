import React, { useState, useEffect } from 'react';
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
    return <div className="text-center text-slate-300">Loading your profile...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto card">
        <h2 className="text-3xl font-bold gradient-text mb-4">Citizen Profile Not Found</h2>
        <p className="text-slate-300 mb-6 text-lg">
          You need to register as a citizen first to participate in voting.
        </p>
        <button 
          onClick={() => setCurrentView('register')}
          className="btn btn-primary"
        >
          📝 Register Now
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Verified: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Suspended: 'bg-gray-100 text-gray-800'
    };
    const statusText = Object.keys(status)[0];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[statusText] || ''}`}>
        {statusText}
      </span>
    );
  };

  const getGenderText = (gender) => {
    return Object.keys(gender)[0];
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadProfile}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            {getStatusBadge(profile.status)}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-gray-700 mb-2">Personal Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Name:</span> <span className="font-medium">{profile.fullName}</span></p>
              <p><span className="text-gray-600">Date of Birth:</span> <span className="font-medium">{profile.dateOfBirth}</span></p>
              <p><span className="text-gray-600">Age:</span> <span className="font-medium">{profile.age} years</span></p>
              <p><span className="text-gray-600">Gender:</span> <span className="font-medium">{getGenderText(profile.gender)}</span></p>
              <p><span className="text-gray-600">Aadhaar:</span> <span className="font-medium font-mono">
                {profile.aadhaarNumber.substring(0, 4)} **** ****
              </span></p>
              {profile.voterIdNumber && profile.voterIdNumber[0] && (
                <p><span className="text-gray-600">Voter ID:</span> <span className="font-medium font-mono">{profile.voterIdNumber[0]}</span></p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-700 mb-2">Contact & Address</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Mobile:</span> <span className="font-medium">{profile.mobileNumber}</span></p>
              <p><span className="text-gray-600">Address:</span> <span className="font-medium">
                {profile.addressLine1}, {profile.city}
              </span></p>
              <p><span className="text-gray-600">District:</span> <span className="font-medium">{profile.district}</span></p>
              <p><span className="text-gray-600">State:</span> <span className="font-medium">{profile.state}</span></p>
              <p><span className="text-gray-600">Pincode:</span> <span className="font-medium">{profile.pincode}</span></p>
              <p><span className="text-gray-600">Constituency:</span> <span className="font-medium font-bold text-primary">
                {profile.constituency}
              </span></p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-bold text-gray-700 mb-2">Registration Details</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-600">Registered:</span> <span className="font-medium">{formatDate(profile.registrationTime)}</span></p>
            {profile.verifiedAt && profile.verifiedAt[0] && (
              <p><span className="text-gray-600">Verified:</span> <span className="font-medium">{formatDate(profile.verifiedAt[0])}</span></p>
            )}
            <p><span className="text-gray-600">Eligible to Vote:</span> <span className="font-medium">
              {profile.isEligible ? '✅ Yes' : '❌ Not yet'}
            </span></p>
          </div>
        </div>

        {!profile.isEligible && Object.keys(profile.status)[0] === 'Pending' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ⏳ Your registration is pending verification by an Election Officer. You will be able to vote once verified.
            </p>
          </div>
        )}

        {Object.keys(profile.status)[0] === 'Rejected' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              ❌ Your registration was rejected. Please contact the Election Commission for more information.
            </p>
          </div>
        )}

        {profile.isEligible && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ You are verified and eligible to vote! Check the Elections page to participate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoterDashboard;
