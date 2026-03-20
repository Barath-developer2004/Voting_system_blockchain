import React from 'react';
import { ShieldCheck, Blocks, Fingerprint, ArrowRight, Zap, Eye, Lock, CheckCircle2, Server, Users, Vote } from 'lucide-react';

function Home({ onLogin, systemInfo, onRecoverAccount }) {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Cryptographic Security',
      desc: 'Internet Identity + Aadhaar OTP + Biometric — three-factor authentication for every vote.',
      color: 'brand',
    },
    {
      icon: Blocks,
      title: 'Immutable Records',
      desc: 'Every vote is permanently recorded on the ICP blockchain. No one can alter or delete it.',
      color: 'purple',
    },
    {
      icon: Fingerprint,
      title: 'Biometric Verification',
      desc: 'WebAuthn fingerprint verification ensures only the registered person can cast their vote.',
      color: 'emerald',
    },
  ];

  const steps = [
    { num: '01', title: 'Verify Identity', desc: 'Authenticate with Internet Identity and verify your Aadhaar via OTP', icon: Lock },
    { num: '02', title: 'Register as Citizen', desc: 'Provide your details and get verified by an Election Officer', icon: Users },
    { num: '03', title: 'Cast Your Vote', desc: 'Choose your candidate and confirm with a fingerprint scan', icon: Vote },
    { num: '04', title: 'View Results', desc: 'Track real-time, transparent, blockchain-verified election results', icon: Eye },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative text-center pt-16 pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-in-up">
            <Zap size={14} />
            Powered by Internet Computer Protocol
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Democracy,{' '}
            <span className="gradient-text">Secured on Chain</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            A tamper-proof, transparent voting platform with three-factor authentication — 
            powered by blockchain, verified by biometrics.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button onClick={onLogin} className="btn btn-primary btn-lg group">
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              How It Works
            </a>
          </div>

          {/* Login help card */}
          <div className="max-w-lg mx-auto mt-10 rounded-2xl border border-surface-700/40 bg-surface-800/30 backdrop-blur p-5 text-left animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-2 mb-3">
              <Lock size={14} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">How Login Works</span>
            </div>
            <div className="space-y-2.5 text-sm text-surface-400">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/15 text-brand-400 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <p><span className="text-surface-200 font-medium">New user?</span> Click "Get Started" → A popup opens → Click <span className="text-brand-300">"Create New"</span> → Set up a passkey (fingerprint/PIN) → You get a unique <span className="font-mono text-xs text-surface-300">Anchor Number</span> — save it!</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <p><span className="text-surface-200 font-medium">Returning user?</span> Click "Get Started" → Enter your <span className="font-mono text-xs text-surface-300">Anchor Number</span> → Verify with your passkey → You're in!</p>
              </div>
            </div>
            <p className="text-xs text-surface-500 mt-3 border-t border-surface-700/30 pt-3">Each person gets their own unique identity number. No passwords — your device's biometric (fingerprint/face/PIN) IS your password.</p>
          </div>

          {/* Recovery link */}
          <div className="mt-4 text-center animate-fade-in-up" style={{ animationDelay: '0.38s' }}>
            <button onClick={onRecoverAccount}
              className="text-sm text-amber-400/80 hover:text-amber-300 transition-colors underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500/60">
              Lost your account? Recover it here
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 mt-10 text-surface-500 text-xs font-medium uppercase tracking-widest animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-success-400" /> Zero Gas Fees</span>
            <span className="hidden sm:inline text-surface-700">|</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-success-400" /> E2E Encrypted</span>
            <span className="hidden sm:inline text-surface-700">|</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-success-400" /> Open Source</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto mb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="card-interactive group p-8"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 transition-all duration-300 ${
                f.color === 'brand' ? 'bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20 group-hover:shadow-glow-sm' :
                f.color === 'purple' ? 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20' :
                'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'
              }`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-surface-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-4xl mx-auto mb-24 scroll-mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-surface-400 text-lg">Four simple steps to secure democratic participation</p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/40 via-purple-500/40 to-emerald-500/40 hidden sm:block" />

          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="relative flex items-start gap-6 group">
                {/* Step indicator */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-surface-800 border border-surface-700/50 flex items-center justify-center group-hover:border-brand-500/50 group-hover:bg-brand-500/10 transition-all duration-300">
                  <s.icon size={18} className="text-surface-400 group-hover:text-brand-400 transition-colors" />
                </div>
                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-xs font-mono text-brand-500/60">{s.num}</span>
                    <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                  </div>
                  <p className="text-sm text-surface-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Status */}
      {systemInfo && (
        <section className="max-w-4xl mx-auto mb-16">
          <div className="card p-8 bg-surface-800/40">
            <div className="flex items-center gap-3 mb-6">
              <Server size={18} className="text-surface-400" />
              <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">System Status</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="stat-card">
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Network</p>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-success" />
                  <span className="text-sm font-semibold text-white">{systemInfo.initialized ? 'Active' : 'Not Initialized'}</span>
                </div>
              </div>
              <div className="stat-card">
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Version</p>
                <span className="text-sm font-semibold text-white font-mono">{systemInfo.version}</span>
              </div>
              <div className="stat-card">
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Officers</p>
                <span className="text-sm font-semibold text-white">{Number(systemInfo.totalAdmins)}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
