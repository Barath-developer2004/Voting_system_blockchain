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

  const initializeSystem = async () => {
    try {
      console.log('🚀 Attempting to initialize system...');
      setLoading(true);
      
      const result = await api.initializeSystem();
      console.log('📊 Initialization result:', result);
      
      if (result.ok) {
        console.log('✅ System initialized successfully!');
        alert('✅ ' + result.ok);
        // Refresh the app state
        await initApp();
      } else if (result.err) {
        console.error('❌ Initialization error:', result.err);
        alert('❌ Error: ' + result.err);
      } else {
        console.error('❌ Unexpected result format:', result);
        alert('❌ Unexpected response from server. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error initializing system:', error);
      alert('❌ Failed to initialize system: ' + error.message + '\n\nPlease check the browser console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500/30 border-t-blue-500 mx-auto shadow-glow"></div>
          <p className="mt-6 text-slate-300 text-xl font-semibold">Loading Voting System...</p>
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
        
        {isAuthenticated && !systemInfo?.initialized && !isAdmin && (
          <div className="max-w-2xl mx-auto text-center card animate-slide-up">
            <h2 className="text-3xl font-bold gradient-text mb-4">System Not Initialized</h2>
            <p className="text-slate-300 mb-6 text-lg">
              The voting system needs to be initialized. The first user to initialize becomes the Super Admin.
            </p>
            <button
              onClick={initializeSystem}
              className="btn btn-primary"
            >
              🚀 Initialize System & Become Admin
            </button>
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
      
      <footer className="bg-slate-800/50 backdrop-blur-md border-t border-slate-700/50 mt-16 py-8">
        <div className="container mx-auto px-6 text-center text-slate-400">
          <p className="text-lg font-semibold mb-2">🗳️ Blockchain Voting System | Built on Internet Computer</p>
          <p className="text-sm opacity-90">Secure • Transparent • Tamper-Proof • Zero Gas Fees</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
