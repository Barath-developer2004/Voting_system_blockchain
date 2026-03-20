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
import AccountRecovery from './components/AccountRecovery';

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

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      await api.initAuth();
      const authenticated = await api.isAuthenticated();
      
      if (authenticated) {
        setIsAuthenticated(true);
        const principalId = await api.getPrincipal();
        setPrincipal(principalId);
        
        // Check if user is admin
        try {
          const adminStatus = await api.amIAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          setIsAdmin(false);
        }
        
        // Check if user has citizen profile
        try {
          const profileResult = await api.getMyCitizenProfile();
          setHasCitizenProfile(profileResult.ok ? true : false);
        } catch (error) {
          setHasCitizenProfile(false);
        }
      }
      
      // Get system info - this should work even without authentication
      try {
        const info = await api.getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        // Set default system info if call fails
        setSystemInfo({ initialized: false, version: '1.0.0', totalAdmins: 0 });
      }
    } catch (error) {
      // Initialization failed silently
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await api.login();
      
      await initApp();
    } catch (error) {
      // Better error messages
      if (error.toString().includes('popup')) {
        alert('Popup blocked! Please allow popups for this site and try again.');
      } else if (error.toString().includes('timeout')) {
        alert('Login timed out. Please try again.');
      } else {
        alert('Login failed. Please try again.');
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
      // Logout error - silently handle
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
        {/* SYSTEM NOT INITIALIZED — shown when logged in but no admin exists yet */}
        {isAuthenticated && !isAdmin && systemInfo && systemInfo.totalAdmins === 0 && (
          <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-600/20 border border-amber-500/30 mb-6">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">System Not Initialized</h2>
            <p className="text-surface-400 mb-2">
              This voting system has been deployed but the <strong className="text-white">Election Officer (Admin)</strong> has not been set up yet.
            </p>
            <p className="text-surface-500 text-sm mb-8">
              For security, only the canister deployer can initialize the admin from the command line.
            </p>

            <div className="bg-surface-900/60 border border-surface-700/40 rounded-xl p-5 mb-6 text-left space-y-4">
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-2">Your Browser Principal</p>
                <code className="text-sm font-mono text-brand-300 break-all select-all">{principal}</code>
              </div>
              <hr className="border-surface-700/40" />
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-2">Deployer Instructions</p>
                <p className="text-surface-400 text-sm mb-2">Run these commands in your terminal:</p>
                <div className="bg-surface-950 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-surface-500"># Step 1: Initialize (if not auto-done by start.sh)</p>
                  <code className="text-xs font-mono text-green-400 block">dfx canister call voting_backend initialize</code>
                  <p className="text-xs text-surface-500 mt-3"># Step 2: Add your browser identity as admin</p>
                  <code className="text-xs font-mono text-green-400 block break-all">dfx canister call voting_backend addAdminByInitializer '(principal "{principal}")'</code>
                </div>
              </div>
            </div>

            <p className="text-xs text-surface-600">
              After running Step 2 above, refresh this page to access the Admin Dashboard.
            </p>
          </div>
        )}

        {!isAuthenticated && currentView === 'home' && (
          <>
            <Home 
              onLogin={handleLogin}
              systemInfo={systemInfo}
              onRecoverAccount={() => {
                handleLogin().then(() => setCurrentView('recovery')).catch(() => {});
              }}
            />
            
            {api.isBiometricEnrolled() && (
              <div className="mt-12 max-w-md mx-auto">
                <h3 className="text-center text-slate-300 mb-4 font-semibold">Or continue with:</h3>
                <BiometricAuth
                  onSuccess={() => {
                    initApp();
                  }}
                  onError={() => {}}
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

        {isAuthenticated && currentView === 'recovery' && (
          <AccountRecovery
            onBack={() => setCurrentView('home')}
            onRecoveryComplete={() => {
              initApp();
              setCurrentView('dashboard');
            }}
          />
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
