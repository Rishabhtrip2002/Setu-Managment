import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  UserCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Building2,
  Briefcase
} from 'lucide-react';
import Logo from '../components/layout/Logo';

const Login = () => {
  const { login, authError, setAuthError, verifyEmployeeForSetup, completeEmployeePasswordSetup } = useCRM();

  // Mode: 'signin' | 'setup'
  const [mode, setMode] = useState('signin');

  // Sign In States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  // First-Time Setup States
  const [setupStep, setSetupStep] = useState(1); // 1: Verify Email, 2: Create Password, 3: Success
  const [setupEmail, setSetupEmail] = useState('');
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccessMessage, setSetupSuccessMessage] = useState('');

  // Handle standard Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (setAuthError) setAuthError('');

    if (!email.trim() || !password) {
      setLocalError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        let msg = res.error || 'Authentication failed. Please verify credentials.';
        if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
          msg = 'Invalid email or password. Please verify your credentials or check if first-time setup is completed.';
        } else if (msg.includes('auth/too-many-requests')) {
          msg = 'Too many failed login attempts. Please wait a few moments and try again.';
        } else if (msg.includes('auth/network-request-failed')) {
          msg = 'Network connection issue. Please check your internet connection.';
        }
        setLocalError(msg);
      }
    } catch (err) {
      setLocalError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify Email for First-Time Setup
  const handleVerifyEmailSubmit = async (e) => {
    e.preventDefault();
    setSetupError('');

    if (!setupEmail.trim()) {
      setSetupError('Please enter your registered employee email address.');
      return;
    }

    setSetupLoading(true);
    try {
      const result = await verifyEmployeeForSetup(setupEmail.trim());
      if (!result.eligible) {
        setSetupError(result.error);
        return;
      }

      setVerifiedEmployee(result.employee);
      setSetupStep(2);
    } catch (err) {
      setSetupError(err.message || 'Failed to verify employee account eligibility.');
    } finally {
      setSetupLoading(false);
    }
  };

  // Step 2: Set New Password
  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    setSetupError('');

    if (!newPassword || newPassword.length < 6) {
      setSetupError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSetupError('Passwords do not match. Please re-enter both password fields identically.');
      return;
    }

    setSetupLoading(true);
    try {
      const result = await completeEmployeePasswordSetup(setupEmail.trim(), newPassword);
      if (!result.success) {
        setSetupError(result.error || 'Failed to complete initial password setup.');
        return;
      }

      setSetupSuccessMessage(`Account activated for ${result.employee.name}! Redirecting to your workspace...`);
      setSetupStep(3);
    } catch (err) {
      setSetupError(err.message || 'An error occurred while saving your initial password.');
    } finally {
      setSetupLoading(false);
    }
  };

  const switchToSetup = (prefillEmail = '') => {
    setLocalError('');
    if (setAuthError) setAuthError('');
    setSetupError('');
    if (prefillEmail) setSetupEmail(prefillEmail);
    setSetupStep(1);
    setMode('setup');
  };

  const switchToSignIn = () => {
    setLocalError('');
    if (setAuthError) setAuthError('');
    setSetupError('');
    setMode('signin');
  };

  const displayError = localError || authError;
  const isPendingSetupError = displayError && displayError.toLowerCase().includes('pending');

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 text-slate-900 relative overflow-hidden">
      {/* Decorative ambient gradient glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md bg-white/95 border border-slate-200/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/60 relative z-10 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-md ring-2 ring-orange-500/15">
              <Logo className="h-10" showText={true} isDark={false} />
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="inline-flex p-1 bg-slate-100 border border-slate-200/80 rounded-2xl mb-4">
            <button
              type="button"
              onClick={switchToSignIn}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => switchToSetup()}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'setup'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>First-Time Setup</span>
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
            {mode === 'signin' ? 'Sign In to SETU CRM' : 'Employee Account Activation'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            {mode === 'signin' 
              ? 'Enter your registered credentials to access your workspace.'
              : 'Complete your first-time password setup for registered team members.'}
          </p>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: NORMAL SIGN IN (Super Admin & Active Employees)        */}
        {/* ============================================================== */}
        {mode === 'signin' && (
          <>
            {/* Error Alert */}
            {displayError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{displayError}</p>
                    {isPendingSetupError && (
                      <button
                        type="button"
                        onClick={() => switchToSetup(email)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Activate Password Now →</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in to SETU CRM...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick First-Time Setup helper */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                New employee registered by Super Admin?{' '}
                <button
                  type="button"
                  onClick={() => switchToSetup()}
                  className="text-orange-600 hover:text-orange-700 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Set up password</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </p>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: FIRST-TIME ACCOUNT SETUP WORKFLOW                       */}
        {/* ============================================================== */}
        {mode === 'setup' && (
          <div className="space-y-4">
            {/* Setup Error Alert */}
            {setupError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{setupError}</p>
                    {setupError.toLowerCase().includes('already') && (
                      <button
                        type="button"
                        onClick={switchToSignIn}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-300 transition-all cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Go to Sign In →</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Verify Registered Email */}
            {setupStep === 1 && (
              <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registered Employee Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      placeholder="e.g. employee@setusolution.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all shadow-xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Enter the exact email address registered for you in the Employee Management panel.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {setupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Registration...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Create Password for Verified Employee */}
            {setupStep === 2 && verifiedEmployee && (
              <form onSubmit={handleSetPasswordSubmit} className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                {/* Employee Info Card */}
                <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 font-black text-sm flex items-center justify-center shrink-0 border border-orange-400/30">
                    {verifiedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm truncate">{verifiedEmployee.name}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-xs">
                        {verifiedEmployee.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="truncate">{verifiedEmployee.position}</span>
                      <span>•</span>
                      <span className="text-orange-600 font-semibold">{verifiedEmployee.department}</span>
                    </div>
                  </div>
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Create New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {newPassword === confirmPassword ? (
                      <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
                    title="Change email"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={setupLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {setupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Securing Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Activate Account & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success State */}
            {setupStep === 3 && (
              <div className="text-center py-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Setup Completed!</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
                  {setupSuccessMessage || 'Your account is active. Loading your dashboard...'}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-orange-600 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entering SETU CRM...</span>
                </div>
              </div>
            )}

            {/* Back to Sign In Link */}
            {setupStep !== 3 && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={switchToSignIn}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Already set up? Back to Sign In</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security Notice Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Secured by Firebase Authentication & Cloud Firestore Rules.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
