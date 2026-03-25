import { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  Code, BookOpen, Users, Award, ArrowRight, CheckCircle,
  Zap, Trophy, Sparkles, Rocket, Star, Terminal, Cpu,
  Github, Linkedin, Twitter, Brain, Calendar,
  Users as UsersIcon, TrendingUp,
} from 'lucide-react';
import VideoTestimonials from '../chetan/VideoTestimonials';

// ── static data outside component so it never re-creates ──────────────────
const FEATURES = [
  { icon: <BookOpen className="w-8 h-8 text-white" />, title: 'Learning Resources',  description: 'Access comprehensive notes and materials', color: 'from-purple-500 to-pink-500',   bg: 'bg-purple-500/20' },
  { icon: <Code     className="w-8 h-8 text-white" />, title: 'Code Editor',          description: 'Built-in compiler and IDE',              color: 'from-cyan-500 to-blue-500',     bg: 'bg-cyan-500/20'   },
  { icon: <Award    className="w-8 h-8 text-white" />, title: 'Quiz System',           description: 'Interactive quizzes and assessments',    color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/20' },
  { icon: <Users    className="w-8 h-8 text-white" />, title: 'Attendance',            description: 'Track participation records',             color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/20'  },
];

const BENEFITS = [
  'Real-time progress tracking', 'Course-specific content',
  'Instant admin support',       'Peer competition quizzes',
  'Online compiler practice',    'Important announcements',
];

const TECH_STACK = ['Python', 'JavaScript', 'Java', 'C++', 'React', 'Node.js', 'TensorFlow', 'SQL'];

// fixed positions so random() doesn't re-run on every render
const SYMBOL_POSITIONS = [
  { top:'8%',  left:'6%',  dur:8,  delay:0   },
  { top:'18%', left:'88%', dur:11, delay:1.2 },
  { top:'34%', left:'3%',  dur:7,  delay:0.5 },
  { top:'52%', left:'92%', dur:13, delay:2   },
  { top:'65%', left:'15%', dur:9,  delay:0.8 },
  { top:'75%', left:'78%', dur:6,  delay:1.7 },
  { top:'88%', left:'40%', dur:10, delay:0.3 },
  { top:'12%', left:'55%', dur:12, delay:2.5 },
  { top:'44%', left:'62%', dur:8,  delay:1   },
  { top:'92%', left:'22%', dur:7,  delay:1.5 },
];
const SYMBOLS = ['<>', '{;}', '[]', '()', '/>', '==', '=>', '&&', '||', '!='];

const FULL_TEXT = "const welcome = 'Coding Nexus';";

// ── memoised feature card ──────────────────────────────────────────────────
const FeatureCard = memo(({ feature, index, visible }) => (
  <div
    className={`group relative glass-hover rounded-xl md:rounded-2xl p-6 md:p-8 transition-all duration-500 hover:scale-105 hover:z-10 ${visible ? 'animate-slide-in-up' : 'opacity-0'}`}
    style={{ animationDelay: `${0.9 + index * 0.1}s` }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:to-cyan-600/10 rounded-xl md:rounded-2xl transition-all duration-500" />
    <div className="relative">
      <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r ${feature.color} rounded-xl md:rounded-2xl mb-4 md:mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500`}>
        {feature.icon}
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300">
        {feature.title}
      </h3>
      <p className="text-sm md:text-base text-gray-300 group-hover:text-white transition-colors duration-300">{feature.description}</p>
      <div className="mt-4 md:mt-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex items-center text-purple-400 text-sm font-semibold">
          Learn more <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </div>
    <div className={`absolute -inset-px ${feature.bg} rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
  </div>
));

// ── main page ──────────────────────────────────────────────────────────────
const LandingPage = () => {
  const [scrollY,      setScrollY]      = useState(0);
  const [mousePos,     setMousePos]     = useState({ x: 0, y: 0 });
  const [visible,      setVisible]      = useState(false);
  const [typedText,    setTypedText]    = useState('');
  const [cursorOn,     setCursorOn]     = useState(true);
  const [clubFocus,    setClubFocus]    = useState({ dsa: 0, events: 0, workshops: 0, members: 0 });

  // cursor tracking with RAF throttle
  const mouseMoveRaf = useRef(null);
  const mouseHandler = useCallback((e) => {
    if (mouseMoveRaf.current) return;
    mouseMoveRaf.current = requestAnimationFrame(() => {
      setMousePos({ x: e.clientX, y: e.clientY });
      mouseMoveRaf.current = null;
    });
  }, []);

  useEffect(() => {
    // reveal
    const t0 = setTimeout(() => setVisible(true), 100);

    // typing
    let idx = 0;
    const typing = setInterval(() => {
      if (idx <= FULL_TEXT.length) { setTypedText(FULL_TEXT.slice(0, idx)); idx++; }
      else clearInterval(typing);
    }, 80);

    // cursor blink
    const cursor = setInterval(() => setCursorOn(p => !p), 530);

    // counters
    const steps = 50, interval = 2000 / steps;
    let step = 0;
    const counter = setInterval(() => {
      step++;
      const e = 1 - Math.pow(1 - step / steps, 3);
      setClubFocus({ dsa: Math.floor(e * 100), events: Math.floor(e * 5), workshops: Math.floor(e * 5), members: Math.floor(e * 20) });
      if (step >= steps) clearInterval(counter);
    }, interval);

    // scroll (passive, RAF-throttled)
    let scrollRaf = null;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => { setScrollY(window.scrollY); scrollRaf = null; });
    };

    window.addEventListener('scroll',    onScroll,     { passive: true });
    window.addEventListener('mousemove', mouseHandler, { passive: true });

    return () => {
      clearTimeout(t0); clearInterval(typing); clearInterval(cursor); clearInterval(counter);
      window.removeEventListener('scroll',    onScroll);
      window.removeEventListener('mousemove', mouseHandler);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
    };
  }, [mouseHandler]);

  const nav = (path) => { window.location.href = path; };

  return (
    <div className="min-h-screen bg-black relative">

      {/* ── Custom cursor ── */}
      <div
        className="hidden md:block fixed w-7 h-7 rounded-full border-2 border-purple-500 pointer-events-none z-[9999] mix-blend-screen"
        style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%,-50%)', willChange: 'left,top' }}
      >
        <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-40" />
        <div className="absolute inset-0 rounded-full bg-cyan-500 opacity-50" />
      </div>
      <div
        className="hidden md:block fixed w-1 h-1 rounded-full bg-purple-400 pointer-events-none z-[9999]"
        style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%,-50%)', willChange: 'left,top' }}
      />

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/30" />
        <div className="absolute w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ top:'10%', left:'10%' }} />
        <div className="absolute w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ bottom:'10%', right:'10%', animationDelay:'1s' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.3) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
        {SYMBOL_POSITIONS.map((p, i) => (
          <div key={i} className="absolute text-purple-500/10 font-mono font-bold text-2xl select-none"
            style={{ top: p.top, left: p.left, animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite` }}>
            {SYMBOLS[i]}
          </div>
        ))}
      </div>

      {/* ── Global styles ── */}
      <style>{`
        @keyframes float {
          0%,100%{ transform:translate(0,0) rotate(0deg); opacity:.6; }
          25%     { transform:translate(10px,-15px) rotate(5deg); opacity:.8; }
          50%     { transform:translate(-5px,-30px) rotate(-5deg); opacity:1; }
          75%     { transform:translate(-15px,-15px) rotate(3deg); opacity:.8; }
        }
        @keyframes slideInUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(.8)}        to{opacity:1;transform:scale(1)}   }
        @keyframes glow {
          0%,100%{ box-shadow:0 0 20px rgba(168,85,247,.5),0 0 40px rgba(168,85,247,.3); }
          50%    { box-shadow:0 0 40px rgba(168,85,247,.8),0 0 80px rgba(168,85,247,.5); }
        }
        @keyframes textGlow {
          0%,100%{ text-shadow:0 0 10px rgba(168,85,247,.5); }
          50%    { text-shadow:0 0 20px rgba(168,85,247,1),0 0 30px rgba(168,85,247,.8); }
        }
        @keyframes spin   { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

        .animate-slide-in-up  { animation: slideInUp .8s cubic-bezier(.16,1,.3,1) forwards; }
        .animate-scale-in     { animation: scaleIn   .6s cubic-bezier(.16,1,.3,1) forwards; }
        .animate-glow         { animation: glow      3s ease-in-out infinite; }
        .animate-text-glow    { animation: textGlow  3s ease-in-out infinite; }
        .animate-spin-slow    { animation: spin      10s linear infinite; }
        .animate-bounce-slow  { animation: bounce    3s ease-in-out infinite; }
        .animate-scroll       { animation: scroll    28s linear infinite; display:flex; width:max-content; }

        .glass       { background:rgba(17,24,39,.4); backdrop-filter:blur(20px); border:1px solid rgba(168,85,247,.2); }
        .glass-hover { border:1px solid rgba(168,85,247,.15); background:rgba(17,24,39,.25); transition:background .3s,border-color .3s; }
        .glass-hover:hover { background:rgba(17,24,39,.6); border-color:rgba(168,85,247,.5); }
      `}</style>

      {/* ════════════════ NAVBAR ════════════════ */}
      <nav className="glass fixed top-0 left-0 right-0 w-full z-50 shadow-lg shadow-purple-500/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 hover:scale-105 transition-transform cursor-pointer group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center animate-glow shrink-0">
                <img src="/favicon.svg" alt="Coding Nexus" className="w-full h-full object-contain" />
              </div>
              <span className="text-white text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent animate-text-glow truncate">
                Coding Nexus
              </span>
            </div>
            <div className="flex gap-1.5 sm:gap-2 md:gap-4 items-center">
              <button onClick={() => nav('/events')} className="px-3 py-2 sm:px-4 md:px-5 md:py-2.5 text-sm md:text-base text-white bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-all font-semibold border border-purple-500/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/30 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /><span>Events</span>
              </button>
              <button onClick={() => nav('/login')}  className="px-2 py-1.5 sm:px-3 md:px-6 md:py-2.5 text-xs sm:text-sm md:text-base text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-purple-500/50">Login</button>
              <button onClick={() => nav('/signup')} className="px-2 py-1.5 sm:px-3 md:px-6 md:py-2.5 text-xs sm:text-sm md:text-base bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all shadow-lg shadow-purple-500/50 hover:scale-105">Sign Up</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ════════════════ HERO ════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="text-center mb-12 md:mb-20">

          {/* Terminal window */}
          <div className={`max-w-3xl mx-auto mb-8 md:mb-12 ${visible ? 'animate-scale-in' : 'opacity-0'}`}>
            <div className="glass-hover rounded-lg md:rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-gray-900/80 px-3 py-2 md:px-4 md:py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-400 text-xs md:text-sm font-mono ml-2">terminal.js</span>
              </div>
              <div className="bg-gray-950/90 p-4 md:p-6 font-mono text-left">
                <div className="text-green-400 text-xs md:text-sm mb-2"><span className="text-purple-400">$</span> npm start coding-nexus</div>
                <div className="text-cyan-400 text-sm md:text-lg">
                  {typedText}
                  <span className={`inline-block w-2 h-4 md:h-5 bg-cyan-400 ml-1 transition-opacity ${cursorOn ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* sparkle icon */}
          <div className={`flex justify-center mb-6 md:mb-8 ${visible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay:'.2s' }}>
            <div className="relative">
              <Sparkles className="w-10 h-10 md:w-16 md:h-16 text-yellow-400 animate-bounce-slow" />
              <div className="absolute inset-0 animate-spin-slow"><Zap className="w-10 h-10 md:w-16 md:h-16 text-purple-400 opacity-50" /></div>
            </div>
          </div>

          <h1 className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 md:mb-8 leading-tight ${visible ? 'animate-slide-in-up' : 'opacity-0'}`} style={{ animationDelay:'.3s' }}>
            Welcome to{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text animate-text-glow">Coding Nexus</span>
              <span className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 blur-2xl opacity-30 -z-10 animate-pulse" />
            </span>
          </h1>

          <p className={`text-base md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-10 max-w-4xl mx-auto leading-relaxed px-4 ${visible ? 'animate-slide-in-up' : 'opacity-0'}`} style={{ animationDelay:'.4s' }}>
            Transform your coding journey with our cutting-edge platform. Learn, practice, and excel with tools designed for{' '}
            <span className="text-purple-400 font-semibold">next-generation developers</span>.
          </p>

          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 md:gap-6 justify-center mb-8 md:mb-12 ${visible ? 'animate-slide-in-up' : 'opacity-0'}`} style={{ animationDelay:'.5s' }}>
            <button onClick={() => nav('/signup')} className="group relative inline-flex items-center justify-center px-6 py-3 md:px-10 md:py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-lg md:rounded-xl font-bold text-base md:text-xl overflow-hidden shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/80 transition-all hover:scale-105">
              <span className="relative z-10 flex items-center gap-2 md:gap-3">
                <Rocket className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
                Launch Your Journey
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={() => nav('/login')} className="group inline-flex items-center justify-center px-6 py-3 md:px-10 md:py-5 bg-transparent border-2 border-purple-500 text-white rounded-lg md:rounded-xl font-bold text-base md:text-xl hover:bg-purple-500/10 transition-all hover:border-cyan-500 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105">
              <Terminal className="w-5 h-5 md:w-6 md:h-6 mr-2 group-hover:rotate-12 transition-transform" />
              Student Portal
            </button>
            <button onClick={() => nav('/apply-team')} className="group inline-flex items-center justify-center px-6 py-3 md:px-10 md:py-5 bg-white/10 border-2 border-cyan-400 text-cyan-200 rounded-lg md:rounded-xl font-bold text-base md:text-xl hover:bg-cyan-500/20 transition-all hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105">
              Apply to Team
            </button>
          </div>
  <div style={{ position: 'relative', zIndex: 10 }}>
        <VideoTestimonials />
      </div>
          {/* Stats grid */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto ${visible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay:'.6s' }}>
            {[
              { value:`${clubFocus.dsa}%`,       label:'DSA Focus',       icon:<Brain className="w-5 h-5 md:w-6 md:h-6"/>,    color:'from-purple-500 to-pink-500',   desc:'Master Data Structures & Algorithms' },
              { value:`${clubFocus.events}+`,     label:'Events',          icon:<Calendar className="w-5 h-5 md:w-6 md:h-6"/>, color:'from-cyan-500 to-blue-500',     desc:'Hackathons & Coding Contests' },
              { value:`${clubFocus.workshops}+`,  label:'Workshops',       icon:<TrendingUp className="w-5 h-5 md:w-6 md:h-6"/>,color:'from-yellow-500 to-orange-500',desc:'Tech Learning Sessions' },
              { value:`${clubFocus.members}+`,    label:'Active Members',  icon:<UsersIcon className="w-5 h-5 md:w-6 md:h-6"/>,color:'from-green-500 to-emerald-500', desc:'Passionate Learners' },
            ].map((f,i) => (
              <div key={i} className="glass-hover rounded-lg md:rounded-xl p-4 md:p-6 hover:scale-105 transition-all group">
                <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${f.color} rounded-lg md:rounded-xl mb-2 md:mb-3 shadow-lg group-hover:scale-110 transition-transform`}>{f.icon}</div>
                <div className={`text-2xl md:text-4xl font-bold bg-gradient-to-r ${f.color} bg-clip-text text-transparent mb-1`}>{f.value}</div>
                <div className="text-xs md:text-sm font-medium text-white mb-1">{f.label}</div>
                <div className="text-xs text-gray-400">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Carousel */}
        <div className={`mb-12 md:mb-20 overflow-hidden ${visible ? 'animate-slide-in-up' : 'opacity-0'}`} style={{ animationDelay:'.7s' }}>
          <div className="text-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Master Popular Technologies</h3>
            <p className="text-sm md:text-base text-gray-400">Learn industry-standard languages and frameworks</p>
          </div>
          <div className="relative">
            <div className="flex animate-scroll">
              {[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
                <div key={i} className="flex-shrink-0 mx-2 md:mx-4 px-4 py-2 md:px-6 md:py-3 glass-hover rounded-lg md:rounded-xl font-mono font-bold text-sm md:text-base text-purple-400 hover:text-cyan-400 transition-colors hover:scale-105">
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4 ${visible ? 'animate-slide-in-up' : 'opacity-0'}`} style={{ animationDelay:'.8s' }}>
              Powerful <span className="bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">Features</span>
            </h2>
            <p className={`text-base md:text-xl text-gray-400 max-w-2xl mx-auto ${visible ? 'animate-slide-in-up' : 'opacity-0'}`} style={{ animationDelay:'.9s' }}>
              Everything you need to accelerate your learning
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {FEATURES.map((f, i) => <FeatureCard key={i} feature={f} index={i} visible={visible} />)}
          </div>
        </div>

        {/* Benefits */}
        <div className={`relative glass rounded-2xl md:rounded-3xl p-8 md:p-16 mb-0 overflow-hidden ${visible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay:'1.3s' }}>
          <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-96 md:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay:'1s' }} />
          <div className="relative text-center mb-8 md:mb-12">
            <div className="inline-block relative mb-4 md:mb-6">
              <div className="absolute inset-0 animate-spin-slow"><Cpu className="w-16 h-16 md:w-20 md:h-20 text-purple-500/30" /></div>
              <Zap className="w-16 h-16 md:w-20 md:h-20 text-yellow-400 relative animate-pulse" />
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text animate-text-glow">Coding Nexus?</span>
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to succeed in your coding journey, powered by cutting-edge technology
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {BENEFITS.map((b, i) => (
              <div key={i} className="group flex items-start gap-3 md:gap-4 text-white p-4 md:p-6 rounded-lg md:rounded-xl glass-hover transition-all hover:scale-105">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 rounded-full group-hover:scale-125 group-hover:rotate-12 transition-all shadow-lg">
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span className="text-sm md:text-lg font-medium group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════ VIDEO TESTIMONIALS ════════════════ */}
      {/* Isolated block — no overflow, no transforms — so position:sticky works */}


      {/* ════════════════ CTA ════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
        <div className={`text-center relative ${visible ? 'animate-slide-in-up' : 'opacity-0'}`} style={{ animationDelay:'1.5s' }}>
          <div className="inline-block mb-6 md:mb-8 relative">
            <Trophy className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 animate-bounce-slow" />
            <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
            <Star className="w-4 h-4 md:w-6 md:h-6 text-yellow-300 absolute -bottom-1 -left-1 animate-pulse" style={{ animationDelay:'.5s' }} />
            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" />
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight px-4">
            Ready to{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text animate-text-glow">Transform Your Future?</span>
              <span className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 blur-2xl opacity-30 -z-10 animate-pulse" />
            </span>
          </h2>
          <p className="text-base md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Join <span className="text-purple-400 font-bold">{clubFocus.members}+</span> students already learning and growing with Coding Nexus
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <button onClick={() => nav('/signup')} className="group relative inline-flex items-center justify-center gap-2 md:gap-3 px-8 py-4 md:px-12 md:py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 text-white rounded-xl md:rounded-2xl font-bold text-lg md:text-2xl overflow-hidden shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/80 transition-all hover:scale-110">
              <span className="relative z-10 flex items-center gap-2 md:gap-3">
                <Rocket className="w-6 h-6 md:w-7 md:h-7 group-hover:-translate-y-1 transition-transform" />
                Create Free Account
                <ArrowRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={() => nav('/login')} className="group inline-flex items-center justify-center gap-2 md:gap-3 px-8 py-4 md:px-12 md:py-6 bg-transparent border-2 border-purple-500 text-white rounded-xl md:rounded-2xl font-bold text-lg md:text-2xl hover:bg-purple-500/10 transition-all hover:border-cyan-500 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105">
              <Terminal className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform" />
              Explore Platform
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="relative z-10 glass border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4 md:mb-6 group">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all group-hover:scale-110">
                  <Code className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <span className="text-white font-bold text-xl md:text-2xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Coding Nexus</span>
              </div>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4 md:mb-6 max-w-md">
                Empowering the next generation of developers with comprehensive learning tools and resources for success in coding education.
              </p>
              <div className="flex gap-3 md:gap-4">
                {[
                  { icon: <Github className="w-5 h-5" />,   color: 'hover:text-purple-400' },
                  { icon: <Twitter className="w-5 h-5" />,  color: 'hover:text-cyan-400'   },
                  { icon: <Linkedin className="w-5 h-5" />, color: 'hover:text-blue-400'   },
                ].map((s,i) => (
                  <button key={i} className={`w-10 h-10 md:w-12 md:h-12 glass-hover rounded-lg md:rounded-xl flex items-center justify-center text-gray-400 ${s.color} transition-all hover:scale-110`}>{s.icon}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 md:mb-6 text-base md:text-lg flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" /> Quick Links
              </h3>
              <div className="space-y-2 md:space-y-3">
                {[{ label:'📚 Documentation', path:'/api/docs' },{ label:'About Us', path:'/about' },{ label:'Contact', path:'/contact' },{ label:'Apply to Team', path:'/apply-team' }].map((l,i) => (
                  <button key={i} onClick={() => nav(l.path)} className="block text-gray-400 hover:text-purple-400 transition-all text-sm md:text-base hover:translate-x-2 transform">→ {l.label}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 md:mb-6 text-base md:text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> Features
              </h3>
              <div className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-400">
                {['• Learning Resources','• Code Editor & Compiler','• Interactive Quizzes','• Attendance Tracking','• Progress Analytics','• Community Support'].map((item,i) => (
                  <p key={i} className="hover:text-purple-400 transition-colors cursor-pointer">{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-purple-500/20 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs md:text-sm text-center md:text-left">
              © 2026 Coding Nexus. All rights reserved. Built with <span className="text-red-500 animate-pulse">❤️</span> for developers.
            </p>
            <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-gray-500">
              <button className="hover:text-purple-400 transition-colors">Privacy Policy</button>
              <button className="hover:text-purple-400 transition-colors">Terms of Service</button>
              <button className="hover:text-purple-400 transition-colors">Cookies</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      {scrollY > 500 && (
        <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/80 transition-all hover:scale-110 animate-bounce-slow">
          <ArrowRight className="w-6 h-6 md:w-7 md:h-7 text-white -rotate-90" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
