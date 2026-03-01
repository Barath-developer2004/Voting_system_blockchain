import React from 'react';

function Header({ isAuthenticated, isAdmin, hasCitizenProfile, viewAs, setViewAs, principal, onLogin, onLogout, currentView, setCurrentView }) {
  return (
    <header className="bg-slate-800/80 backdrop-blur-md shadow-2xl border-b border-slate-700/50">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 cursor-pointer hover:scale-105 transition-transform duration-300 drop-shadow-lg" onClick={() => setCurrentView('home')}>
              🗳️ Blockchain Voting
            </h1>
            {isAuthenticated && (
              <nav className="flex space-x-3 ml-8">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    currentView === 'dashboard'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                      : 'text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('elections')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    currentView === 'elections'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                      : 'text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                  }`}
                >
                  🎯 Elections
                </button>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                {isAdmin && hasCitizenProfile && currentView === 'dashboard' && (
                  <div className="flex items-center space-x-2 bg-slate-700/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-600">
                    <span className="text-xs text-slate-400">View as:</span>
                    <button
                      onClick={() => setViewAs('admin')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewAs !== 'voter'
                          ? 'bg-amber-500 text-white'
                          : 'text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      ⭐ Officer
                    </button>
                    <button
                      onClick={() => setViewAs('voter')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewAs === 'voter'
                          ? 'bg-blue-500 text-white'
                          : 'text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      👤 Voter
                    </button>
                  </div>
                )}
                {isAdmin && (
                  <span className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full text-sm font-bold shadow-lg">
                    ⭐ Election Officer
                  </span>
                )}
                <div className="text-sm bg-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-600">
                  <p className="font-mono text-blue-400 font-semibold">{principal.substring(0, 10)}...</p>
                </div>
                <button 
                  onClick={() => setCurrentView('settings')}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 transition-all"
                  title="Settings"
                >
                  ⚙️
                </button>
              </>
            )}
            
            {isAuthenticated ? (
              <button onClick={onLogout} className="btn btn-outline">
                🚪 Logout
              </button>
            ) : (
              <div className="flex space-x-2">
                <button onClick={onLogin} className="btn btn-primary">
                  🔐 Login with Internet Identity
                </button>
                <button 
                  onClick={() => setCurrentView('register')} 
                  className="btn btn-outline"
                >
                  📝 Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
