import React from 'react';

function Home({ onLogin, systemInfo }) {
  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Hero Section with SVG Image */}
      <div className="text-center mb-16 relative">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Voting Box SVG */}
            <svg className="w-48 h-48 animate-bounce-slow" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="60" width="120" height="100" rx="8" fill="url(#grad1)" stroke="#3B82F6" strokeWidth="3"/>
              <rect x="60" y="40" width="80" height="20" rx="4" fill="#8B5CF6"/>
              <rect x="70" y="20" width="60" height="30" rx="4" fill="url(#grad2)" stroke="#60A5FA" strokeWidth="2"/>
              <path d="M90 30 L95 40 L105 40 L98 46 L100 56 L90 50 L80 56 L82 46 L75 40 L85 40 Z" fill="#FCD34D"/>
              <circle cx="80" cy="100" r="8" fill="#10B981"/>
              <circle cx="120" cy="100" r="8" fill="#10B981"/>
              <rect x="70" y="120" width="60" height="4" rx="2" fill="#3B82F6"/>
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9"/>
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6"/>
                  <stop offset="100%" stopColor="#A78BFA"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 drop-shadow-2xl animate-slide-up">
          Democracy on Blockchain
        </h1>
        <p className="text-2xl text-slate-300 mb-10 font-light">
          Secure, transparent, and tamper-proof voting for citizens
        </p>
        <button onClick={onLogin} className="btn btn-primary text-xl px-12 py-4 shadow-2xl shadow-blue-500/50">
          ✨ Get Started with Internet Identity
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center group hover:shadow-glow">
          <div className="mb-6 flex justify-center">
            <svg className="w-24 h-24 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" fill="url(#secureGrad)" opacity="0.2"/>
              <path d="M50 20 L70 35 L70 55 C70 65 60 72 50 75 C40 72 30 65 30 55 L30 35 Z" fill="url(#secureGrad)" stroke="#3B82F6" strokeWidth="2"/>
              <path d="M42 50 L48 56 L62 42" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="secureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6"/>
                  <stop offset="100%" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3 gradient-text">Secure</h3>
          <p className="text-slate-400 text-lg">
            Cryptographic identity ensures one person, one vote
          </p>
        </div>
        
        <div className="card text-center group hover:shadow-glow">
          <div className="mb-6 flex justify-center">
            <svg className="w-24 h-24 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="35" width="25" height="25" rx="4" fill="#3B82F6" opacity="0.6"/>
              <rect x="37" y="35" width="25" height="25" rx="4" fill="#8B5CF6" opacity="0.6"/>
              <rect x="60" y="35" width="25" height="25" rx="4" fill="#A78BFA" opacity="0.6"/>
              <path d="M20 45 L35 45" stroke="#10B981" strokeWidth="2"/>
              <path d="M42 45 L57 45" stroke="#10B981" strokeWidth="2"/>
              <path d="M65 45 L80 45" stroke="#10B981" strokeWidth="2"/>
              <circle cx="27.5" cy="45" r="3" fill="#FCD34D"/>
              <circle cx="49.5" cy="45" r="3" fill="#FCD34D"/>
              <circle cx="72.5" cy="45" r="3" fill="#FCD34D"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3 gradient-text">Immutable</h3>
          <p className="text-slate-400 text-lg">
            Votes recorded on blockchain cannot be altered
          </p>
        </div>
        
        <div className="card text-center group hover:shadow-glow">
          <div className="mb-6 flex justify-center">
            <svg className="w-24 h-24 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="35" fill="url(#freeGrad)" opacity="0.3"/>
              <text x="50" y="60" fontSize="40" fill="url(#freeGrad)" textAnchor="middle" fontWeight="bold">₹0</text>
              <path d="M30 25 Q35 20 40 25 T50 25 T60 25 T70 25" stroke="#10B981" strokeWidth="2" fill="none"/>
              <defs>
                <linearGradient id="freeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981"/>
                  <stop offset="100%" stopColor="#3B82F6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3 gradient-text">Free</h3>
          <p className="text-slate-400 text-lg">
            Zero gas fees - voters pay nothing!
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="card mb-8">
        <h2 className="text-4xl font-bold mb-8 gradient-text text-center">How It Works</h2>
        <div className="space-y-6">
          <div className="flex items-start p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mr-6 shadow-lg shadow-blue-500/50">
              1
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2 text-blue-400">Register as Citizen</h3>
              <p className="text-slate-400 text-lg">
                Provide Aadhaar details and basic information to get started
              </p>
            </div>
          </div>
          
          <div className="flex items-start p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mr-6 shadow-lg shadow-purple-500/50">
              2
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2 text-purple-400">Get Verified</h3>
              <p className="text-slate-400 text-lg">
                Election Officer reviews and verifies your identity securely
              </p>
            </div>
          </div>
          
          <div className="flex items-start p-6 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mr-6 shadow-lg shadow-emerald-500/50">
              3
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2 text-emerald-400">Cast Your Vote</h3>
              <p className="text-slate-400 text-lg">
                Vote securely for candidates in your constituency
              </p>
            </div>
          </div>
          
          <div className="flex items-start p-6 bg-gradient-to-r from-blue-900/30 to-emerald-900/30 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mr-6 shadow-lg shadow-blue-500/50">
              4
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2 text-blue-400">View Results</h3>
              <p className="text-slate-400 text-lg">
                Real-time, transparent blockchain-verified results
              </p>
            </div>
          </div>
        </div>
      </div>

      {systemInfo && (
        <div className="card bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-2 border-blue-500/30">
          <h3 className="font-bold text-2xl mb-4 gradient-text">System Status</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700">
              <span className="text-slate-400">Status:</span>
              <span className="ml-2 font-bold text-lg">
                {systemInfo.initialized ? '✅ Active' : '⚠️ Not Initialized'}
              </span>
            </div>
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700">
              <span className="text-slate-400">Version:</span>
              <span className="ml-2 font-bold text-lg text-blue-400">{systemInfo.version}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
