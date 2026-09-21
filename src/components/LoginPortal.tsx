import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { DiamondWorldLogo } from './DiamondWorldLogo';
import { AuthUser } from '../types';
import { authenticateUser, getStoredUsers } from '../utils/authEngine';

interface LoginPortalProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginSuccess }) => {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [firstName, setFirstName] = useState('Shahadat');
  const [lastName, setLastName] = useState('Hossen');
  const [username, setUsername] = useState('shahadat');
  const [password, setPassword] = useState('dwl');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const availableUsers = getStoredUsers();

  const slides = [
    {
      title: "Capturing Brilliance, Creating Value",
      subtitle: "Diamond World LTD • Stock Operations ERP"
    },
    {
      title: "Real-time Solitaire & Carat Intelligence",
      subtitle: "Dynamic 0.02ct & Multi-Branch Allocation"
    },
    {
      title: "Automated Refill & Factory Consignment",
      subtitle: "Zero stockouts across all retail showrooms"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMessage('Please accept the Terms & Conditions to proceed.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      // In sign-up or sign-in, allow entry using username / password
      const result = authenticateUser(username, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        // Fallback for demo sign up
        if (isSignUpMode) {
          const newUser: AuthUser = {
            id: String(Date.now()),
            username: username.toLowerCase(),
            name: `${firstName} ${lastName}`.trim() || 'Operations User',
            role: 'manager',
            createdAt: new Date().toISOString()
          };
          onLoginSuccess(newUser);
        } else {
          setErrorMessage(result.error || 'Invalid credentials. Please verify your login.');
        }
      }
      setIsLoading(false);
    }, 250);
  };

  const handleQuickFill = (user: typeof availableUsers[0]) => {
    setUsername(user.username);
    setPassword(user.password || 'dwl');
    const parts = user.name.split(' ');
    setFirstName(parts[0] || 'Shahadat');
    setLastName(parts.slice(1).join(' ') || 'Hossen');
    setErrorMessage('');
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess(user);
      setIsLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#110f1a] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#6c47eb] selection:text-white relative overflow-hidden">
      
      {/* Background ambient lighting effects matching the screenshot */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#432c81]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#261758]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Outer Auth Card (Replicating exact layout from uploaded screenshot) */}
      <div className="w-full max-w-5xl bg-[#1b1828] border border-[#2e2944] rounded-[28px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* ======================================================== */}
        {/* LEFT PANEL: Atmospheric Twilight Dunes Artwork & Branding */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden min-h-[480px] lg:min-h-[620px]">
          
          {/* Inner rounded container with desert twilight landscape */}
          <div className="absolute inset-4 sm:inset-5 rounded-[22px] overflow-hidden bg-gradient-to-b from-[#1b1435] via-[#221743] to-[#120b24] border border-[#3b325c]/50">
            
            {/* Dunes & Twilight SVG Artwork */}
            <svg
              viewBox="0 0 500 650"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2c1e56" />
                  <stop offset="45%" stopColor="#3d2a75" />
                  <stop offset="85%" stopColor="#1e1438" />
                  <stop offset="100%" stopColor="#0d081a" />
                </linearGradient>
                <linearGradient id="duneFar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#312258" />
                  <stop offset="100%" stopColor="#1b1233" />
                </linearGradient>
                <linearGradient id="duneMid" x1="0%" y1="0%" x2="100%" y2="80%">
                  <stop offset="0%" stopColor="#261746" />
                  <stop offset="100%" stopColor="#130b24" />
                </linearGradient>
                <linearGradient id="duneFront" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a0f30" />
                  <stop offset="100%" stopColor="#080410" />
                </linearGradient>
                <radialGradient id="twilightGlow" cx="60%" cy="35%" r="50%">
                  <stop offset="0%" stopColor="#6845c4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sky Background */}
              <rect width="500" height="650" fill="url(#skyGrad)" />
              <rect width="500" height="650" fill="url(#twilightGlow)" />

              {/* Subtle stars */}
              <circle cx="90" cy="120" r="1.2" fill="#ffffff" opacity="0.6" />
              <circle cx="210" cy="80" r="1.5" fill="#ffffff" opacity="0.8" />
              <circle cx="340" cy="140" r="1" fill="#ffffff" opacity="0.5" />
              <circle cx="430" cy="95" r="1.4" fill="#ffffff" opacity="0.7" />
              <circle cx="160" cy="180" r="1" fill="#ffffff" opacity="0.4" />
              <circle cx="380" cy="210" r="1.2" fill="#ffffff" opacity="0.6" />

              {/* Distant mountains / dunes */}
              <path
                d="M-50 380 Q 80 290, 260 320 T 550 280 V 650 H -50 Z"
                fill="url(#duneFar)"
                opacity="0.85"
              />

              {/* Mid ground sweeping sand dune ridge (exact shape like the uploaded image) */}
              <path
                d="M-50 440 Q 140 330, 310 380 Q 430 420, 550 360 V 650 H -50 Z"
                fill="url(#duneMid)"
              />

              {/* Ridge highlights */}
              <path
                d="M-50 440 Q 140 330, 310 380"
                stroke="#6448aa"
                strokeWidth="1.5"
                opacity="0.4"
                fill="none"
              />

              {/* Foreground dark dramatic dune sweep */}
              <path
                d="M-50 510 Q 120 420, 290 480 Q 420 520, 550 460 V 650 H -50 Z"
                fill="url(#duneFront)"
              />
            </svg>

            {/* Dark vignette gradient overlay at bottom for high legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a1b] via-transparent to-black/30 pointer-events-none" />

            {/* Top Bar inside Left Card: Diamond World Brand & Back to Website pill */}
            <div className="relative z-10 p-6 flex items-center justify-between">
              {/* Brand Logo matching reference */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1.5 shadow-sm">
                  <DiamondWorldLogo className="w-full h-full text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-wider text-white uppercase leading-tight font-mono">
                    DIAMOND WORLD
                  </span>
                  <span className="text-[9px] font-semibold text-purple-200/70 tracking-wider uppercase">
                    Stock Operations ERP
                  </span>
                </div>
              </div>

              {/* "Back to website →" pill button (matching screenshot) */}
              <button
                type="button"
                onClick={() => {
                  // Pre-fill demo credentials
                  setUsername('shahadat');
                  setPassword('dwl');
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Back to website</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Bottom Content inside Left Card: Headline & Pagination Dashes */}
            <div className="relative z-10 p-6 sm:p-8 mt-auto space-y-4">
              <div className="space-y-1 max-w-xs">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                  {slides[activeSlide].title}
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  {slides[activeSlide].subtitle}
                </p>
              </div>

              {/* Three Carousel Pagination Dashes (matching screenshot) */}
              <div className="flex items-center gap-1.5 pt-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1 rounded-full transition-all cursor-pointer ${
                      activeSlide === idx
                        ? 'w-7 bg-white'
                        : 'w-4 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: Sleek Dark Auth Form (matching reference)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6 bg-[#1b1828]">
          
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isSignUpMode ? 'Create an account' : 'Sign in to account'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>{isSignUpMode ? 'Already have an account?' : "Don't have an account?"}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setErrorMessage('');
                }}
                className="font-bold text-[#8d6eed] hover:text-[#a88ff3] transition-colors cursor-pointer underline"
              >
                {isSignUpMode ? 'Log in' : 'Create account'}
              </button>
            </div>
          </div>

          {/* Error notification if any */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Dual Inputs: First Name & Last Name (as seen in screenshot) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-3.5 py-3 rounded-lg bg-[#27233a] border border-[#3b3558] hover:border-[#4d4573] focus:border-[#7c5ce8] text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#7c5ce8]/40 transition-all font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-3.5 py-3 rounded-lg bg-[#27233a] border border-[#3b3558] hover:border-[#4d4573] focus:border-[#7c5ce8] text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#7c5ce8]/40 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email / Username field */}
            <div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="User ID / Email"
                className="w-full px-3.5 py-3 rounded-lg bg-[#27233a] border border-[#3b3558] hover:border-[#4d4573] focus:border-[#7c5ce8] text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#7c5ce8]/40 transition-all font-medium"
                autoComplete="username"
              />
            </div>

            {/* Password with Eye Toggle Icon */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-3.5 pr-10 py-3 rounded-lg bg-[#27233a] border border-[#3b3558] hover:border-[#4d4573] focus:border-[#7c5ce8] text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#7c5ce8]/40 transition-all font-medium"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checkbox: I agree to Terms & Conditions (matching screenshot) */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  agreedToTerms
                    ? 'bg-[#7c5ce8] text-white'
                    : 'bg-[#27233a] border border-[#3b3558] text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>
              <label
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className="text-xs text-slate-400 cursor-pointer select-none"
              >
                I agree to the{' '}
                <span className="text-[#a88ff3] hover:underline">
                  Terms &amp; Conditions
                </span>
              </label>
            </div>

            {/* Primary Solid Vibrant Purple Button (matching screenshot) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-[#6c47eb] hover:bg-[#5f3bdd] active:bg-[#512ecc] text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-[#6c47eb]/30 active:scale-[0.99] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Accessing Cockpit...</span>
                ) : (
                  <span>{isSignUpMode ? 'Create account' : 'Sign in to Stock Operations'}</span>
                )}
              </button>
            </div>

          </form>

          {/* "Or register with" divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#312b49] w-full" />
            <span className="bg-[#1b1828] px-3 text-[11px] text-slate-500 font-medium whitespace-nowrap">
              {isSignUpMode ? 'Or register with' : 'Or quick login with'}
            </span>
            <div className="border-t border-[#312b49] w-full" />
          </div>

          {/* Social Auth Buttons: Google & Apple (exact matching from screenshot) */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Google Button */}
            <button
              type="button"
              onClick={() => handleQuickFill(availableUsers[0])}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#27233a] hover:bg-[#312c49] border border-[#3b3558] hover:border-[#4f4675] text-xs font-semibold text-white transition-all cursor-pointer group shadow-2xs"
            >
              {/* Official Google 'G' icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Apple Button */}
            <button
              type="button"
              onClick={() => handleQuickFill(availableUsers[1] || availableUsers[0])}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#27233a] hover:bg-[#312c49] border border-[#3b3558] hover:border-[#4f4675] text-xs font-semibold text-white transition-all cursor-pointer group shadow-2xs"
            >
              {/* Apple Icon */}
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12-14.44-6.42-9.98-11.39-21.43-14.9-34.36-3.51-12.92-5.27-25.04-5.27-36.35 0-14.86 3.73-27.18 11.19-36.96 7.46-9.78 17.03-14.78 28.72-15 4.8 0 10.42 1.34 16.86 4.02 6.44 2.68 10.48 4.08 12.12 4.2 2.07 0 6.44-1.48 13.1-4.43 6.67-2.96 12.38-4.25 17.13-3.87 12.63.74 22.75 5.25 30.36 13.54-10.8 6.53-16.08 15.54-15.84 27.02.24 9.17 3.76 16.92 10.57 23.25 6.8 6.33 14.89 10.02 24.26 11.08-2.07 6.33-4.66 12.68-7.76 19.05zM119.22 33.64c0-7.39 2.65-14.54 7.95-21.44 5.3-6.9 12.14-11.4 20.52-13.5 0 1.25.09 2.5.27 3.75-.24 7.27-2.92 14.34-8.03 21.2-5.11 6.87-12.01 11.17-20.71 12.9z" />
              </svg>
              <span>Apple</span>
            </button>

          </div>

          {/* Fast One-Click Authorized Profiles */}
          <div className="pt-2 border-t border-[#2e2944] space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Authorized Stock Operations Profiles:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill(availableUsers[0])}
                className="p-2 rounded-lg bg-[#221e33] hover:bg-[#2c2642] border border-[#3b3558] text-left transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-6 h-6 rounded bg-[#6c47eb]/20 text-[#a88ff3] flex items-center justify-center font-bold text-[10px] border border-[#6c47eb]/30">
                  SH
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate">
                    MD Shahadat Hossen
                  </div>
                  <div className="text-[9px] text-[#a88ff3] font-medium">
                    Admin • 1-Click Entry
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill(availableUsers[1] || availableUsers[0])}
                className="p-2 rounded-lg bg-[#221e33] hover:bg-[#2c2642] border border-[#3b3558] text-left transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/30">
                  SM
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate">
                    Store Operations Manager
                  </div>
                  <div className="text-[9px] text-emerald-400 font-medium">
                    Showroom • 1-Click Entry
                  </div>
                </div>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Footer System Attribution */}
      <footer className="absolute bottom-3 text-center text-[11px] text-slate-500 font-medium">
        <span>Diamond World LTD • Stock Operations ERP • Developed by </span>
        <strong className="text-slate-300">MD Shahadat Hossen</strong>
      </footer>

    </div>
  );
};
