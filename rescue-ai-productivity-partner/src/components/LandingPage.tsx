import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Zap, 
  ShieldAlert, 
  Brain, 
  Clock, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Info, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  Check, 
  BookOpen, 
  Briefcase, 
  Rocket, 
  Star, 
  HelpCircle, 
  X, 
  ChevronRight,
  CheckCircle2,
  ListTodo,
  Shield,
  MessageSquare,
  TrendingUp,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, signInGuest } = useAuth();
  
  // Auth state & controls
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDemoRoleOpen, setIsDemoRoleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Onboarding step role state
  const [onboardingRole, setOnboardingRole] = useState<'student' | 'professional' | 'entrepreneur' | null>(() => {
    return localStorage.getItem('onboarding_role') as any;
  });

  // Active solution tab preview
  const [activeSolution, setActiveSolution] = useState<'students' | 'professionals' | 'entrepreneurs'>('students');

  // Interactive task showcase tab
  const [activeTaskShowcase, setActiveTaskShowcase] = useState<number>(0);

  // Pricing Dynamic Currency State
  const [pricingCurrency, setPricingCurrency] = useState<'USD' | 'EUR' | 'INR'>('USD');

  const tasksAI = [
    {
      title: "Syllabus & Goal Breakdown",
      description: "Paste any course syllabus, project description, or chaotic study guide. The AI parses deadlines, weights, and milestones to generate an instant structured roadmap.",
      badge: "Syllabus Scan",
      icon: BookOpen,
      actionText: "Creates a step-by-step task flow with smart urgency weights.",
      example: "🚀 Upload 'CS101_Syllabus.pdf' → Instantly gets 12 weekly modules with checklist, resources, and automatic calendar calendar blocks."
    },
    {
      title: "Emergency Rescue Protocol",
      description: "Under high stress? Press 'Rescue Mode'. The AI silences low-priority noise, breaks high-stakes deliverables into 15-minute high-energy actions, and coaches you to start.",
      badge: "Procrastination Shield",
      icon: ShieldAlert,
      actionText: "Filters non-urgent tasks to prevent paralysis and overwhelm.",
      example: "⚠️ 'Exam tomorrow' → AI hides 15 minor items, extracts 3 core topics, launches focus blocks, and uses grounding techniques."
    },
    {
      title: "Custom Mindset Coaching Chat",
      description: "Struggling with focus, imposter syndrome, or fatigue? Talk with a proactive productivity coach that helps reframe limiting beliefs and gives tangible immediate actions.",
      badge: "AI Mindset Coach",
      icon: MessageSquare,
      actionText: "Real-time therapeutic and action-oriented framing.",
      example: "💬 'I feel too tired' → AI: 'That's completely valid. Let's do a 5-minute microscopic step. Just open the doc. No writing yet.'"
    },
    {
      title: "Optimized Focus Blocks",
      description: "Tired of generic Pomodoros? The AI calculates your energy profile and task difficulty to customize silent intervals, ambient modes, and motivational breaks.",
      badge: "Energy Tuning",
      icon: Clock,
      actionText: "Dynamically stretches focus blocks based on your real-time performance.",
      example: "⏱️ Hard Task + High Energy → AI schedules a focused 50-minute blocks with a 10-minute active recharge."
    }
  ];

  // Authentication error parsing
  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || err?.message || '';
    if (code.includes('auth/popup-closed-by-user') || code.includes('auth/popup-blocked')) {
      return "The Google login popup was closed or blocked. Since you are in a preview iframe, your browser might have blocked the pop-up. Please open the app in a new tab (using the button in the top right) to use Google Sign-In, or use the Email Login.";
    }
    if (code.includes('auth/network-request-failed')) {
      return "Network request failed. This can happen if your browser is blocking third-party cookies or if there is a network issue. Please ensure third-party cookies are enabled or try opening the app in a new tab.";
    }
    if (code.includes('auth/cancelled-popup-request')) {
      return "Google Sign-In request was cancelled. Please try again or use the Email Login below.";
    }
    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
      return "Incorrect email or password. Please verify your credentials and try again.";
    }
    if (code.includes('auth/email-already-in-use')) {
      return "This email address is already in use. Try signing in instead!";
    }
    if (code.includes('auth/operation-not-allowed')) {
      return "auth/operation-not-allowed-setup-required";
    }
    if (code.includes('auth/weak-password')) {
      return "Password should be at least 6 characters long.";
    }
    if (code.includes('auth/invalid-email')) {
      return "Please enter a valid email address.";
    }
    return err?.message || "An unexpected authentication error occurred. Please try again.";
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setInfoMessage("Tip: Standard Google popups are frequently blocked in sandboxed preview windows. Try standard Email Login or use the 'Quick Demo Pass' button!");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setInfoMessage("Tip: Standard popups are frequently blocked in sandboxed preview windows. Try standard Email Login or use the 'Quick Demo Pass' button!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all email and password fields.");
      return;
    }
    
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      if (activeTab === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      await signInGuest();
    } catch (err: any) {
      setError("Quick Demo Access is temporarily offline. Please create a custom Email account above!");
    } finally {
      setLoading(false);
    }
  };

  const triggerDemoRoleSelection = () => {
    setIsDemoRoleOpen(true);
  };

  const handleSelectDemoRole = async (selectedRole: 'student' | 'professional' | 'entrepreneur') => {
    setIsDemoRoleOpen(false);
    setIsAuthOpen(false);
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      await signInGuest(selectedRole);
    } catch (err: any) {
      setError("Quick Demo Access is temporarily offline. Please create a custom Email account above!");
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = (tab: 'login' | 'signup', role?: 'student' | 'professional' | 'entrepreneur') => {
    setActiveTab(tab);
    setError(null);
    setInfoMessage(null);
    if (role) {
      setOnboardingRole(role);
      localStorage.setItem('onboarding_role', role);
    } else {
      const saved = localStorage.getItem('onboarding_role');
      if (saved) {
        setOnboardingRole(saved as any);
      } else {
        setOnboardingRole(null);
      }
    }
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 selection:bg-blue-100 selection:text-blue-800 font-sans relative">
      {/* Decorative patterns */}
      <div className="absolute top-0 left-0 right-0 h-[650px] bg-gradient-to-b from-blue-50/40 via-indigo-50/20 to-transparent pointer-events-none" />
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-blue-300/10 to-indigo-300/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Sticky Navigation */}
      <header id="landing-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/10">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Rescue<span className="text-blue-600">AI</span>
            </span>
          </div>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Products</a>
            <a href="#solutions" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#what-ai-does" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">AI Capabilities</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
          </nav>

          {/* Access CTAs */}
          <div className="flex items-center gap-3">
            <button 
              id="btn-header-login"
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </button>
            <button 
              id="btn-header-signup"
              onClick={() => openAuthModal('signup')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 transition-all"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero-section" className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-xs font-bold shadow-sm tracking-wide uppercase animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Empowering students, professionals & entrepreneurs
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-slate-900 leading-[1.1] md:leading-[1.15]">
            Beat Paralysis. Achieve More. <br />
            Meet your <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Proactive AI Companion</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            The intelligent productivity mentor that doesn't just list tasks—it actively rescues you from stagnation. Dynamic prioritization, mindset framing, and high-energy sprint focus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              id="btn-hero-get-started"
              onClick={() => openAuthModal('signup')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-bold rounded-2xl shadow-xl shadow-slate-900/10 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              id="btn-hero-demo-pass"
              onClick={triggerDemoRoleSelection}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-base font-bold rounded-2xl shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              {loading ? "Launching Demo..." : "Try Quick Guest Pass"}
            </button>
          </div>

          {/* Social proof icons */}
          <div className="pt-10 flex flex-col items-center gap-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Optimized for ambitious creators</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all">
              <span className="font-extrabold text-sm tracking-wider text-slate-500">🎓 UNIVERSITY RESEARCHERS</span>
              <span className="font-extrabold text-sm tracking-wider text-slate-500">⚡ TECH INDIE HACKERS</span>
              <span className="font-extrabold text-sm tracking-wider text-slate-500">💼 PRODUCT LEADS</span>
              <span className="font-extrabold text-sm tracking-wider text-slate-500">🚀 STARTUP FOUNDERS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section: "Everything you need is here" Bento Grid */}
      <section id="features" className="py-20 px-6 bg-white border-y border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything you need is here.
            </h2>
            <p className="text-base text-slate-600">
              No more bouncing between calendar blockers, to-do lists, stress journals, and screen blockers. Rescue AI weaves them into a single cognitive flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bento Card 1 */}
            <div className="md:col-span-2 bg-gradient-to-br from-blue-50/70 to-indigo-50/30 border border-slate-200/60 rounded-3xl p-8 relative overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-4 z-10 max-w-lg">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold uppercase tracking-wider">01. Intelligent Priority Engine</span>
                <h3 className="text-2xl font-black text-slate-900">Dynamic Task Prioritization</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Most todo apps let your backlogs overflow until you quit. Rescue AI dynamically structures your day. It combines deadline mathematical weight, physical task size, and your declared energy reserves to calculate what to do *next*.
                </p>
              </div>
              <div className="mt-8 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between z-10 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Next Priority Recommendation</p>
                    <p className="text-[10px] text-slate-400 font-mono">Urgency Score: 98/100</p>
                  </div>
                </div>
                <span className="text-xs font-semibold bg-red-50 text-red-700 px-2.5 py-1 rounded-lg">High Impact</span>
              </div>
              {/* Abs decoration */}
              <div className="absolute right-0 bottom-0 w-44 h-44 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
            </div>

            {/* Bento Card 2 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition-all group">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold uppercase tracking-wider">02. Mindset Shift</span>
                <h3 className="text-xl font-black text-slate-900">Therapeutic Coaching</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Procrastination is an emotional regulation problem, not a time management one. Speak to the Coach when you feel anxious, overwhelmed, or tired, and get direct scientific mental reframing.
                </p>
              </div>
              <div className="mt-6 space-y-2 p-3 bg-white border border-slate-100 rounded-xl text-[11px] text-slate-500 italic">
                "I'm too anxious to start my project..."
                <div className="text-blue-600 font-semibold not-italic text-right mt-1">"Let's write just one sentence. That's all. Can we do that?"</div>
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition-all group">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wider">03. Focus Shield</span>
                <h3 className="text-xl font-black text-slate-900">Custom Flow States</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Adaptive focus blocks calibrated to your current fatigue levels. Dynamic timers extend when you're in deep flow, and prompt active restorative exercises on breaks.
                </p>
              </div>
              <div className="mt-6 flex gap-2 justify-center font-mono">
                <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">45:00 Focus</span>
                <span className="px-3 py-2 bg-slate-200/50 text-slate-600 text-xs rounded-lg">:</span>
                <span className="px-3 py-2 bg-slate-100 text-slate-600 text-xs rounded-lg">10:00 Recharge</span>
              </div>
            </div>

            {/* Bento Card 4 */}
            <div className="md:col-span-2 bg-gradient-to-br from-amber-50/60 to-orange-50/20 border border-slate-200/60 rounded-3xl p-8 relative overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-4 z-10 max-w-lg">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold uppercase tracking-wider">04. Procrastination Rescue</span>
                <h3 className="text-2xl font-black text-slate-900">Emergency Red-Zone Rescue</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When you have critical deadlines and your cognitive fatigue takes over, deploy Rescue Mode. It strips away all complexity, closes deep folders, and establishes a microscopic progression pathway designed to generate momentum.
                </p>
              </div>
              <div className="mt-8 bg-amber-50 border border-amber-200/50 p-4 rounded-2xl flex items-center gap-3.5 z-10">
                <ShieldAlert className="w-5 h-5 text-amber-600 animate-bounce" />
                <p className="text-xs font-bold text-amber-950">Panic Redirection Activated: Only showing 1 microtask.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: "What can this AI do?" (AI Task Showcase) */}
      <section id="what-ai-does" className="py-20 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              What can this AI do?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Unlike generic LLM chat windows, Rescue AI integrates directly into your operational environment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Task selector tabs (Left) */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {tasksAI.map((task, idx) => {
                const IconComp = task.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTaskShowcase(idx)}
                    className={`w-full p-4.5 rounded-2xl text-left border transition-all flex items-start gap-4 ${
                      activeTaskShowcase === idx
                        ? 'bg-white border-blue-200 shadow-md text-slate-900 ring-1 ring-blue-100'
                        : 'bg-transparent border-transparent hover:bg-white/50 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${
                      activeTaskShowcase === idx ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{task.title}</p>
                      <p className="text-xs opacity-80 line-clamp-1">{task.badge}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Showcase Display Panel (Right) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold tracking-wide">
                    {tasksAI[activeTaskShowcase].badge}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Rescue Engine v1.0</span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900">
                    {tasksAI[activeTaskShowcase].title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tasksAI[activeTaskShowcase].description}
                  </p>
                </div>

                <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-4.5 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    How it helps:
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5">
                    {tasksAI[activeTaskShowcase].actionText}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6 space-y-3">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Interactive Sample Execution</p>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
                  {tasksAI[activeTaskShowcase].example}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section: Students, Professionals, Entrepreneurs */}
      <section id="solutions" className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tailored for your cognitive load.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Whether you are juggling final exams, complex product delivery timelines, or building your first startup.
            </p>
          </div>

          {/* Solutions Tabs */}
          <div className="flex justify-center border-b border-slate-200 max-w-md mx-auto p-1.5 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveSolution('students')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeSolution === 'students'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              For Students
            </button>
            <button
              onClick={() => setActiveSolution('professionals')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeSolution === 'professionals'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              For Professionals
            </button>
            <button
              onClick={() => setActiveSolution('entrepreneurs')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeSolution === 'entrepreneurs'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              For Entrepreneurs
            </button>
          </div>

          {/* Solution Active Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto pt-4">
            {/* Left Content */}
            <div className="space-y-6">
              {activeSolution === 'students' && (
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Break Down Massive Syllabi</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Stop dreading midterms and course loads. Rescue AI turns dates and percentages into small, actionable study units.
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Automatic timeline creation from syllabus PDFs.
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Pre-exam panic focus blockers.
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Active recall scheduling with the AI.
                    </li>
                  </ul>
                </div>
              )}

              {activeSolution === 'professionals' && (
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Reclaim Deep Focus After Meetings</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tired of context-switching constantly between Slacks and emails? The AI schedules protective focus slots to let you get actual high-leverage work done.
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Dynamic priority updating based on business impact.
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      De-cluttering low urgency noise immediately.
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Mindset support for burnout or impostor syndrome.
                    </li>
                  </ul>
                </div>
              )}

              {activeSolution === 'entrepreneurs' && (
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Manage Massive Ambitions Safely</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Entrepreneurs face unlimited ambiguity. Rescue AI clarifies chaotic roadmaps, filters distractions, and acts as your non-judgmental accountability advisor.
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      AI Roadmap Builder for launching fast and iterating.
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Time-boxed sprints targeting critical milestones.
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Panic Mode support when shipping or pitches fail.
                    </li>
                  </ul>
                </div>
              )}

              <button
                id="btn-solution-cta"
                onClick={() => openAuthModal('signup')}
                className="mt-4 px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2"
              >
                Start Using Rescue AI Free <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right Interactive Mockup / Stats Graphic */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400 font-mono ml-auto">Rescue Engine Dashboard</span>
              </div>

              {activeSolution === 'students' && (
                <div className="space-y-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Physics 101: Midterm Preparation</p>
                      <p className="text-[10px] text-slate-500">Progress: 4 of 6 units done</p>
                    </div>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">Studying</span>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-indigo-900">🔥 Current Streak: 12 Days</p>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '66%' }} />
                    </div>
                  </div>
                </div>
              )}

              {activeSolution === 'professionals' && (
                <div className="space-y-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Quarterly Q3 Strategy Slide deck</p>
                      <p className="text-[10px] text-slate-500">Scheduled: 2 Hours block today</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">High Urgency</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-950">
                    ✅ Slack and email notifications silenced automatically to preserve deep focus blocks.
                  </div>
                </div>
              )}

              {activeSolution === 'entrepreneurs' && (
                <div className="space-y-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Launch Beta Product Hunt Listing</p>
                      <p className="text-[10px] text-slate-500">Step: Write copy & media setup</p>
                    </div>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded">Critical Path</span>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-purple-900">Roadmap Phase 2: User Validation</p>
                    <p className="text-[9px] text-purple-700">AI Mentor: "Let's launch even if it feels incomplete. Done is better than perfect."</p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-500" /> Focus Score: 94%</span>
                <span>Active Session: 120 mins</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Flexible pricing for every path.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Choose the perfect tier for your learning or building routine. No hidden fees.
            </p>

            {/* Currency Selector */}
            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 mt-4">
              <button
                onClick={() => setPricingCurrency('USD')}
                className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  pricingCurrency === 'USD'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setPricingCurrency('EUR')}
                className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  pricingCurrency === 'EUR'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EUR (€)
              </button>
              <button
                onClick={() => setPricingCurrency('INR')}
                className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  pricingCurrency === 'INR'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Plan 1: Student Priority */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-mono font-bold uppercase">
                    Student
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Student Plan</h3>
                  <p className="text-xs text-slate-500">Specially crafted for students, researchers, and learners to tackle semester stress.</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {pricingCurrency === 'USD' && '$3'}
                    {pricingCurrency === 'EUR' && '€2.50'}
                    {pricingCurrency === 'INR' && '₹199'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ month</span>
                </div>

                <ul className="space-y-3.5 border-t border-slate-100 pt-6">
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    Syllabus OCR Scan & Parse Engine
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    Course Milestone Auto-Checklists
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    Academic Stress Relief Coaching Chat
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    Standard Focus Timer (Pomodoro)
                  </li>
                </ul>
              </div>

              <button
                id="btn-pricing-student"
                onClick={() => openAuthModal('signup', 'student')}
                className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl active:scale-98 transition-all"
              >
                Start Student Plan
              </button>
            </div>

            {/* Plan 2: Professional Edge */}
            <div className="bg-white border-2 border-indigo-500 rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-indigo-500/5 relative overflow-hidden">
              {/* Popular Tag */}
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-2xl">
                Most Popular
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-mono font-bold uppercase">
                    Professional
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Professional Plan</h3>
                  <p className="text-xs text-slate-500">Perfect for full-time developers, managers, designers, and ambitious builders.</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {pricingCurrency === 'USD' && '$9'}
                    {pricingCurrency === 'EUR' && '€8'}
                    {pricingCurrency === 'INR' && '₹699'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ month</span>
                </div>

                <ul className="space-y-3.5 border-t border-slate-100 pt-6">
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    Everything in Student Plan
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    Real-time Calendar Conflict Resolution
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    Proactive Mindset & Anti-delay Coach
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    Panic Emergency Rescue Protocols
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    Advanced Cognitive Load Analytics
                  </li>
                </ul>
              </div>

              <button
                id="btn-pricing-pro"
                onClick={() => openAuthModal('signup', 'professional')}
                className="mt-8 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 transition-all"
              >
                Start Professional Plan
              </button>
            </div>

            {/* Plan 3: Entrepreneur Core */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-mono font-bold uppercase">
                    Entrepreneur
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Entrepreneur Plan</h3>
                  <p className="text-xs text-slate-500">Designed for sole proprietors, startup founders, and high-frequency creators.</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {pricingCurrency === 'USD' && '$19'}
                    {pricingCurrency === 'EUR' && '€18'}
                    {pricingCurrency === 'INR' && '₹1499'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ month</span>
                </div>

                <ul className="space-y-3.5 border-t border-slate-100 pt-6">
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    Everything in Professional Plan
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    High-Stakes Timeline Planner & Milestones
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    Custom Mindset AI Persona Training
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    Multi-Device Syncing & Priority Support
                  </li>
                </ul>
              </div>

              <button
                id="btn-pricing-entrepreneur"
                onClick={() => openAuthModal('signup', 'entrepreneur')}
                className="mt-8 w-full py-3 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl active:scale-98 transition-all"
              >
                Start Entrepreneur Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="landing-footer" className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & Description */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">
                Rescue<span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Proactive mental reframing and algorithmic scheduling to help students, tech builders, and entrepreneurs escape procrastination paralysis for good.
            </p>
          </div>

          {/* Column 2: Product info */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product Features</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Priority Engine</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Emergency Rescue</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Smart Focus Timer</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">AI Coaching chat</a></li>
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Target Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#solutions" className="hover:text-white transition-colors">Syllabus Breakdown</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Corporate Burnout</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Ambition Scaffolding</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Upgrade to Pro</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Rescue AI productivity suite. Built with high-contrast cognitive design principles.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support Contact</a>
          </div>
        </div>
      </footer>

      {/* FLOATING INTERACTIVE AUTH MODAL */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-left relative animate-scale-up">
            
            {/* Close Button */}
            <button
              id="btn-auth-close"
              onClick={() => setIsAuthOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {!onboardingRole ? (
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2 mt-4">
                  <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 font-display">Select Your Primary Focus</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Rescue AI personalizes your tasks, syllabus breakups, stress rescue plans, and AI coaching triggers to your specific workspace context.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <button
                    onClick={() => {
                      setOnboardingRole('student');
                      localStorage.setItem('onboarding_role', 'student');
                    }}
                    className="w-full p-4 text-left border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-none">🎓 Student / Learner</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">Syllabus OCR breakups, study schedules, and academic burnout prevention.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setOnboardingRole('professional');
                      localStorage.setItem('onboarding_role', 'professional');
                    }}
                    className="w-full p-4 text-left border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-none">💼 Professional / Builder</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">Protecting peak diurnal focus, meetings decompression, and flow metrics.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setOnboardingRole('entrepreneur');
                      localStorage.setItem('onboarding_role', 'entrepreneur');
                    }}
                    className="w-full p-4 text-left border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-none">🚀 Entrepreneur / Founder</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">Founder sprint prioritization, product timelines, and high-stress pivots.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setOnboardingRole('professional');
                      localStorage.setItem('onboarding_role', 'professional');
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                  >
                    Skip & configure as professional workspace
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 pr-12">
                  <button
                    id="btn-auth-tab-login"
                    onClick={() => { setActiveTab('login'); setError(null); }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'login'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                  <button
                    id="btn-auth-tab-signup"
                    onClick={() => { setActiveTab('signup'); setError(null); }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'signup'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full w-max mx-auto mb-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>{onboardingRole === 'student' ? '🎓 STUDENT' : onboardingRole === 'entrepreneur' ? '🚀 ENTREPRENEUR' : '💼 PROFESSIONAL'} WORKSPACE</span>
                      <button 
                        onClick={() => setOnboardingRole(null)}
                        className="ml-1 text-slate-400 hover:text-indigo-700 underline text-[9px]"
                      >
                        Change
                      </button>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      {activeTab === 'login' ? 'Welcome Back!' : 'Start Free Today'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeTab === 'login' ? 'Log in to sync your active AI schedule.' : 'Unlock syllabus breakdown and rescue logs.'}
                    </p>
                  </div>

                  {/* Show Friendly Auth Errors */}
                  {error && (
                    error === "auth/operation-not-allowed-setup-required" ? (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/90 to-blue-50 border border-indigo-200 text-indigo-950 text-xs space-y-3 shadow-xs animate-fadeIn">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">Firebase Authentication Configuration Needed</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Since this is your personal Firebase instance, you need to enable Email/Password Authentication in your console to create new accounts.
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/80 rounded-lg p-3 border border-indigo-100/60 space-y-2">
                          <p className="font-mono font-bold text-[10px] text-indigo-900 uppercase tracking-wider">Quick Setup (Takes 15 seconds):</p>
                          <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                            <li>
                              Open <a href="https://console.firebase.google.com/project/ultra-landing-zgbcx/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5">
                                Firebase Console Settings ↗
                              </a>
                            </li>
                            <li>Under <strong>Sign-in method</strong>, click <strong>Add provider</strong> (or edit <strong>Email/Password</strong> if already listed).</li>
                            <li>Turn on the <strong>Email/Password</strong> switch and click <strong>Save</strong>.</li>
                            <li>Refresh this app and sign up successfully!</li>
                          </ol>
                        </div>

                        <div className="p-2.5 bg-indigo-600/5 rounded-lg border border-indigo-600/10 text-[11px] text-indigo-900 flex items-start gap-2">
                          <span className="text-sm">💡</span>
                          <p>
                            <strong>Alternative:</strong> Click the <strong>Quick Demo Pass</strong> button below. It logs you into a fully functional sandbox session instantly, completely bypassing authentication configuration!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Authorization Notice</p>
                          <p className="mt-0.5 leading-relaxed">{error}</p>
                        </div>
                      </div>
                    )
                  )}

                  {/* Helper Tips if Error Occurred */}
                  {infoMessage && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Iframe Preview Notice</p>
                        <p className="mt-0.5 leading-relaxed">{infoMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Email & Password Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          id="input-auth-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          id="input-auth-password"
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      id="btn-auth-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Authenticating...' : activeTab === 'login' ? 'Sign In with Email' : 'Sign Up with Email'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Separator line */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <span className="relative bg-white px-3 text-slate-400 text-[10px] font-mono uppercase">OR CHOOSE AN INSTANT OPTION</span>
                  </div>

                  {/* Alternate Sign In Buttons */}
                  <div className="space-y-2.5">
                    {/* Apple Access */}
                    <button
                      id="btn-auth-apple"
                      onClick={handleAppleSignIn}
                      disabled={loading}
                      className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl transition-all active:scale-98 flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#000000" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.1-44.6-35.9-2.8-74.3 22.7-93.1 22.7-18.9 0-50.5-22.3-80.1-22.3-43.6 0-84.5 25.1-107.5 64.9-46.7 80.6-28.7 199.7 17.1 266 22.4 32.5 50.1 69.2 86.4 68.3 35.1-.9 48-22.3 90.7-22.3 42.6 0 54 22.3 90.7 22.3 37.4 0 61.2-33.6 83.1-66.3 25.8-38.3 36.4-75.4 36.9-77.2-.6-.3-69.5-26.6-69.9-96.8zM245.9 83.7c22.1-27.1 36.9-64.8 32.9-102.7-32.3 1.3-71.8 21.6-94.6 48.7-18.2 21.6-35.4 59.9-30.6 96.8 36.1 2.8 71.9-18.5 92.3-42.8z"/>
                      </svg>
                      {activeTab === 'login' ? 'Sign In with Apple' : 'Sign Up with Apple'}
                    </button>

                    {/* Google Access */}
                    <button
                      id="btn-auth-google"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl transition-all active:scale-98 flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.133C18.356 1.157 15.547 0 12.24 0 5.582 0 0 5.37 0 12s5.582 12 12.24 12c6.96 0 11.57-4.814 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"/>
                      </svg>
                      {activeTab === 'login' ? 'Sign In with Google' : 'Sign Up with Google'}
                    </button>

                    {/* Guest / Demo account Access */}
                    <button
                      id="btn-auth-guest"
                      onClick={triggerDemoRoleSelection}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 text-blue-700 font-bold rounded-xl transition-all active:scale-98 flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
                      Quick Demo Pass (Iframe Safe)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* DEMO ROLE SELECTION MODAL */}
      {isDemoRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-left relative animate-scale-up p-8 space-y-6">
            
            {/* Close Button */}
            <button
              onClick={() => setIsDemoRoleOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mt-2">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-slate-900 font-display">Personalize Your Demo</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Before launching the guest sandbox, choose a profile context to see how the AI engine customizes suggestions, focus intervals, and stress relief filters:
              </p>
            </div>

            <div className="space-y-3.5">
              <button
                onClick={() => handleSelectDemoRole('student')}
                className="w-full p-4 text-left border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-none">🎓 Student / Learner</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">Academic syllabus breakups, study schedules, and academic burnout prevention.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => handleSelectDemoRole('professional')}
                className="w-full p-4 text-left border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-none">💼 Professional / Builder</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">Deep diurnal focus blocks, meeting decompression, and ADHD flow metrics.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => handleSelectDemoRole('entrepreneur')}
                className="w-full p-4 text-left border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                  <Rocket className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-none">🚀 Entrepreneur / Founder</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">Founder sprint prioritization, high-stake pivots, and decision fatigue triaging.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
