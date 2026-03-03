import React, { useState, useEffect } from 'react';
import * as api from './service';
import Header from './components/Header';
import Home from './components/Home';
import BiometricAuth from './components/BiometricAuth';
import CitizenRegistration from './components/CitizenRegistration';
import VoterDashboard from './components/VoterDashboard';
import AdminDashboard from './components/AdminDashboard';
import Elections from './components/Elections';
import Settings from './components/Settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCitizenProfile, setHasCitizenProfile] = useState(false);
  const [viewAs, setViewAs] = useState('auto'); // 'auto', 'admin', 'voter'
  const [principal, setPrincipal] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [systemInfo, setSystemInfo] = useState(null);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [claimingAdmin, setClaimingAdmin] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      console.log('🔄 Initializing app...');
      await api.initAuth();
      const authenticated = await api.isAuthenticated();
      
      console.log('🔐 Authenticated:', authenticated);
      
      if (authenticated) {
        setIsAuthenticated(true);
        const principalId = await api.getPrincipal();
        setPrincipal(principalId);
        console.log('👤 Principal:', principalId);
        
        // Check if user is admin
        try {
          const adminStatus = await api.amIAdmin();
          setIsAdmin(adminStatus);
          console.log('⭐ Is Admin:', adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
        
        // Check if user has citizen profile
        try {
          const profileResult = await api.getMyCitizenProfile();
          setHasCitizenProfile(profileResult.ok ? true : false);
          console.log('👤 Has Citizen Profile:', profileResult.ok ? true : false);
        } catch (error) {
          console.error('Error checking citizen profile:', error);
          setHasCitizenProfile(false);
        }
      }
      
      // Get system info - this should work even without authentication
      try {
        console.log('📊 Fetching system info...');
        const info = await api.getSystemInfo();
        console.log('✅ System info:', info);
        setSystemInfo(info);
      } catch (error) {
        console.error('❌ Error getting system info:', error);
        // Set default system info if call fails
        setSystemInfo({ initialized: false, version: '1.0.0', totalAdmins: 0 });
      }
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      console.log('🚀 Login button clicked');
      setLoading(true);
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await api.login();
      
      console.log('🔄 Reinitializing app...');
      await initApp();
      
      console.log('✅ Login complete!');
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Better error messages
      if (error.toString().includes('popup')) {
        alert('⚠️ Popup blocked! Please allow popups for this site and try again.');
      } else if (error.toString().includes('timeout')) {
        alert('⏱️ Login timed out. Please try again.');
      } else {
        alert('❌ Login failed: ' + error.message + '\n\nPlease check the browser console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setIsAdmin(false);
      setPrincipal('');
      setCurrentView('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Self-service admin claim — first logged-in user becomes admin
  const handleClaimAdmin = async () => {
    try {
      setClaimingAdmin(true);
      console.log('🔧 Claiming admin role...');
      const result = await api.claimAdmin();
      console.log('✅ Claim result:', result);

      if (result.ok) {
        setIsAdmin(true);
        setCurrentView('dashboard');
        // Refresh system info
        const info = await api.getSystemInfo();
        setSystemInfo(info);
      } else if (result.err) {
        alert('Could not claim admin: ' + result.err);
      }
    } catch (error) {
      console.error('❌ Error claiming admin:', error);
      alert('Error claiming admin: ' + error.message);
    } finally {
      setClaimingAdmin(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center bg-radial-glow">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
            <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-lg font-semibold text-white">Loading Voting System</p>
          <p className="text-sm text-surface-500 mt-1">Connecting to blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header 
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        hasCitizenProfile={hasCitizenProfile}
        viewAs={viewAs}
        setViewAs={setViewAs}
        principal={principal}
        onLogin={handleLogin}
        onLogout={handleLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <main className="container mx-auto px-6 py-12">
        {/* ADMIN SETUP SCREEN — shown when logged in but no admin exists yet */}
        {isAuthenticated && !isAdmin && systemInfo && systemInfo.totalAdmins === 0 && (
          <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-6">
              <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">System Setup</h2>
            <p className="text-surface-400 mb-2">
              This voting system has just been deployed and needs an <strong className="text-white">Election Officer (Admin)</strong>.
            </p>
            <p className="text-surface-500 text-sm mb-8">
              You are the first person to log in. Click below to become the admin. Only one person can claim this role.
            </p>

            <div className="bg-surface-900/60 border border-surface-700/40 rounded-xl p-4 mb-8 text-left">
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-2">Your Identity</p>
              <code className="text-sm font-mono text-brand-300 break-all">{principal}</code>
            </div>

            <button
              onClick={handleClaimAdmin}
              disabled={claimingAdmin}
              className="btn btn-primary px-8 py-3 text-base font-semibold disabled:opacity-50"
            >
              {claimingAdmin ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Setting up...
                </>
              ) : (
                '🛡️ Claim Admin Role'
              )}
            </button>

            <p className="text-xs text-surface-600 mt-6">
              This is recorded on the blockchain as an immutable audit event.
            </p>
          </div>
        )}

        {!isAuthenticated && currentView === 'home' && (
          <>
            <Home 
              onLogin={handleLogin}
              systemInfo={systemInfo}
            />
            
            {api.isBiometricEnrolled() && (
              <div className="mt-12 max-w-md mx-auto">
                <h3 className="text-center text-slate-300 mb-4 font-semibold">Or continue with:</h3>
                <BiometricAuth
                  onSuccess={() => {
                    console.log('✅ Biometric login successful');
                    initApp();
                  }}
                  onError={(error) => {
                    console.error('❌ Biometric auth error:', error);
                  }}
                />
              </div>
            )}
          </>
        )}
        
        {!isAuthenticated && currentView === 'register' && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setCurrentView('home')}
              className="mb-6 text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-300 border border-blue-500/30 hover:border-blue-500"
            >
              ← Back to Home
            </button>
            <CitizenRegistration />
          </div>
        )}
        
        {isAuthenticated && currentView === 'register' && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="mb-6 text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-300 border border-blue-500/30 hover:border-blue-500"
            >
              ← Back to Dashboard
            </button>
            <CitizenRegistration />
          </div>
        )}
        

        
        {isAuthenticated && currentView === 'dashboard' && isAdmin && viewAs !== 'voter' && (
          <AdminDashboard />
        )}
        
        {isAuthenticated && currentView === 'dashboard' && (!isAdmin || viewAs === 'voter') && (
          <VoterDashboard setCurrentView={setCurrentView} onProfileUpdate={() => setHasCitizenProfile(true)} />
        )}
        
        {isAuthenticated && currentView === 'elections' && (
          <Elections isAdmin={isAdmin} />
        )}

        {isAuthenticated && currentView === 'settings' && (
          <Settings />
        )}
      </main>
      
      <footer className="border-t border-surface-800/60 mt-16 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-medium text-surface-400">Blockchain Voting System <span className="text-surface-600 mx-2">·</span> Built on Internet Computer</p>
          <p className="text-xs text-surface-600 mt-1.5">Secure · Transparent · Tamper-Proof · Zero Gas Fees</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
