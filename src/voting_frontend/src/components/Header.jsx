import React, { useState } from 'react';
import { Vote, LayoutDashboard, Landmark, Settings, LogOut, LogIn, UserPlus, Shield, User, ChevronDown, Menu, X, Copy, Check } from 'lucide-react';

function Header({ isAuthenticated, isAdmin, hasCitizenProfile, viewAs, setViewAs, principal, onLogin, onLogout, currentView, setCurrentView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullPrincipal, setShowFullPrincipal] = useState(false);

  const copyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = principal;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const NavButton = ({ view, icon: Icon, label, active }) => (
    <button
      onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-brand-600/15 text-brand-400'
          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
      }`}
    >
      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-500 rounded-full" />
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 glass border-b border-surface-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              <Vote size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold text-white tracking-tight">VoteChain</span>
              <span className="text-[10px] font-medium text-surface-500 block -mt-0.5 tracking-widest uppercase">on ICP</span>
            </div>
          </button>

          {/* Center Nav */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 bg-surface-900/40 rounded-xl px-1.5 py-1 border border-surface-700/30">
              <NavButton view="dashboard" icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} />
              <NavButton view="elections" icon={Landmark} label="Elections" active={currentView === 'elections'} />
              <NavButton view="settings" icon={Settings} label="Settings" active={currentView === 'settings'} />
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                {/* View-as toggle for admin with citizen profile */}
                {isAdmin && hasCitizenProfile && currentView === 'dashboard' && (
                  <div className="hidden lg:flex items-center gap-1 bg-surface-900/40 rounded-lg px-1 py-0.5 border border-surface-700/30">
                    <button
                      onClick={() => setViewAs('admin')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        viewAs !== 'voter'
                          ? 'bg-warning-500/15 text-warning-400'
                          : 'text-surface-500 hover:text-surface-300'
                      }`}
                    >
                      <Shield size={12} /> Officer
                    </button>
                    <button
                      onClick={() => setViewAs('voter')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        viewAs === 'voter'
                          ? 'bg-brand-500/15 text-brand-400'
                          : 'text-surface-500 hover:text-surface-300'
                      }`}
                    >
                      <User size={12} /> Voter
                    </button>
                  </div>
                )}

                {/* Admin badge */}
                {isAdmin && (
                  <span className="hidden sm:inline-flex badge bg-warning-500/10 text-warning-400 border-warning-500/20">
                    <Shield size={12} /> Officer
                  </span>
                )}

                {/* Principal chip - click to see full ID & copy */}
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowFullPrincipal(!showFullPrincipal)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-900/50 rounded-lg border border-surface-700/30 hover:border-brand-500/40 transition-colors cursor-pointer"
                    title="Click to see full Principal ID"
                  >
                    <span className="w-2 h-2 rounded-full bg-success-400 shadow-sm shadow-success-400/50" />
                    <span className="text-xs font-mono text-surface-400">{principal.substring(0, 8)}…</span>
                  </button>
                  
                  {showFullPrincipal && (
                    <div className="absolute right-0 top-full mt-2 p-3 bg-surface-900 rounded-xl border border-surface-700/50 shadow-xl z-50 min-w-[340px] animate-fade-in">
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-1.5">Your Principal ID</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-brand-300 bg-surface-800 px-2.5 py-1.5 rounded-lg break-all select-all">
                          {principal}
                        </code>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyPrincipal(); }}
                          className="flex-shrink-0 p-1.5 rounded-lg bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 transition-colors"
                          title="Copy Principal ID"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      {copied && (
                        <p className="text-[10px] text-success-400 mt-1.5">Copied to clipboard!</p>
                      )}
                      <p className="text-[10px] text-surface-500 mt-2">This is your unique blockchain identity from Internet Identity.</p>
                    </div>
                  )}
                </div>

                {/* Logout */}
                <button onClick={onLogout} className="btn-ghost btn-sm gap-1.5">
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex items-center gap-2">
                <button onClick={onLogin} className="btn btn-primary btn-sm">
                  <LogIn size={14} />
                  <span className="hidden sm:inline">Login</span>
                </button>
                <button onClick={() => setCurrentView('register')} className="btn btn-ghost btn-sm">
                  <UserPlus size={14} />
                  <span className="hidden sm:inline">Register</span>
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800/60 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-surface-700/30 animate-fade-in-down">
            <div className="flex flex-col gap-1">
              <NavButton view="dashboard" icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} />
              <NavButton view="elections" icon={Landmark} label="Elections" active={currentView === 'elections'} />
              <NavButton view="settings" icon={Settings} label="Settings" active={currentView === 'settings'} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
