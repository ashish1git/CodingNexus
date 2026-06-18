import React from 'react';
import { Code, Users, Rocket, Target, Award, ArrowLeft, Sparkles, Brain, Trophy, Swords, Shield, Monitor, Cpu, Zap, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black relative">
      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ top:'5%', left:'5%' }} />
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ bottom:'5%', right:'5%', animationDelay:'1s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.3) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <style>{`
        @keyframes textGlow {
          0%,100%{ text-shadow:0 0 10px rgba(168,85,247,.5); }
          50%    { text-shadow:0 0 20px rgba(168,85,247,1),0 0 30px rgba(168,85,247,.8); }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .animate-text-glow { animation: textGlow 3s ease-in-out infinite; }
        .animate-spin-slow  { animation: spin 10s linear infinite; }
        .glass       { background:rgba(17,24,39,.4); backdrop-filter:blur(20px); border:1px solid rgba(168,85,247,.2); }
        .glass-hover { border:1px solid rgba(168,85,247,.15); background:rgba(17,24,39,.25); transition:background .3s,border-color .3s; }
        .glass-hover:hover { background:rgba(17,24,39,.6); border-color:rgba(168,85,247,.5); }
      `}</style>

      <div className="relative z-10">
        {/* Header */}
        <div className="glass border-b border-purple-500/30 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-all hover:-translate-x-1 mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <img src="/favicon.svg" alt="Coding Nexus" className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                  About{' '}
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text animate-text-glow">Coding Nexus</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">APSIT's Premier Coding Competition Platform • Academic Year 2025-26</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10 md:space-y-16">

          {/* ── Who We Are ── */}
          <div className="glass-hover rounded-2xl md:rounded-3xl p-8 md:p-12 border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Who We Are</h2>
            </div>
            <div className="space-y-4 text-base md:text-lg leading-relaxed text-gray-200">
              <p>
                <span className="text-purple-400 font-bold text-xl">Coding Nexus</span> is the official technical club of{' '}
                <span className="text-cyan-300 font-bold">APSIT (A.P. Shah Institute of Technology)</span> —{' '}
                <span className="text-yellow-300 font-semibold">built entirely by students, for students.</span> We are a passionate group of
                developers, competitive programmers, and tech enthusiasts who came together with one goal: to create the best coding competition
                platform on campus.
              </p>
              <p>
                We didn't find a platform that met our needs — so we built one. Coding Nexus is the result of countless hours of student effort,
                combining real competitive programming experience with modern web technology to deliver a platform that actually understands
                what student coders need.
              </p>
            </div>
          </div>

          {/* ── Mission & Vision ── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Mission */}
            <div className="glass-hover rounded-2xl p-8 border-purple-500/30 hover:border-purple-500/60 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">Our Mission</h3>
              </div>
              <p className="text-gray-300 text-base leading-relaxed">
                To provide APSIT students with a <span className="text-purple-400 font-semibold">fair, proctored, and professional-grade</span> competitive
                programming platform. We aim to bridge the gap between academic coding and real-world competitive programming — all while
                keeping it completely free for every APSIT student.
              </p>
            </div>

            {/* Vision */}
            <div className="glass-hover rounded-2xl p-8 border-cyan-500/30 hover:border-cyan-500/60 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">Our Vision</h3>
              </div>
              <p className="text-gray-300 text-base leading-relaxed">
                To become the <span className="text-cyan-400 font-semibold">go-to coding competition platform</span> for engineering colleges,
                setting the standard for student-built technical infrastructure. We envision a future where every college has a Coding Nexus —
                empowering students to compete, learn, and grow together.
              </p>
            </div>
          </div>

          {/* ── What Makes Us Different ── */}
          <div>
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-4">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-semibold text-sm">Student-Led & Student-Built</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                What Makes Us{' '}
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">Different</span>
              </h2>
              <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                We're not a generic coding platform. We're a club that built our own infrastructure because we care about the coding culture at APSIT.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: <Swords className="w-5 h-5" />,
                  title: 'Live Competitions',
                  desc: 'Real-time coding contests with instant leaderboards and multi-language support — compete like the pros do.',
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: 'Cheating Prevention',
                  desc: 'Tab-switch detection, full-screen lock, anti-copy protection — every competition is fair and proctored automatically.',
                  color: 'from-red-500 to-rose-500'
                },
                {
                  icon: <Cpu className="w-5 h-5" />,
                  title: 'Multi-Language Support',
                  desc: 'Write code in Python, JavaScript, Java, C++ and more — with instant execution and hidden test cases.',
                  color: 'from-cyan-500 to-blue-500'
                },
                {
                  icon: <Brain className="w-5 h-5" />,
                  title: 'DSA Practice Sets',
                  desc: 'Curated problem sets across all difficulty levels with automated evaluation and detailed results.',
                  color: 'from-yellow-500 to-orange-500'
                },
                {
                  icon: <Monitor className="w-5 h-5" />,
                  title: 'Built-in Code Editor',
                  desc: 'Write, run, and debug your code directly in the browser — no setup needed, just start coding.',
                  color: 'from-green-500 to-emerald-500'
                },
                {
                  icon: <Award className="w-5 h-5" />,
                  title: 'Verifiable Certificates',
                  desc: 'Competition winners receive certificates with unique verification codes — share them on LinkedIn with pride.',
                  color: 'from-indigo-500 to-violet-500'
                },
              ].map((item, idx) => (
                <div key={idx} className="group glass-hover rounded-xl p-6 hover:scale-[1.02] transition-all">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${item.color} rounded-lg mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    {item.icon}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── The Team Behind It ── */}
          <div className="glass-hover rounded-2xl md:rounded-3xl p-8 md:p-12 border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">The Team Behind It</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-gray-200 mb-6">
              Coding Nexus is <span className="text-purple-400 font-semibold">entirely built and managed by CSE AIML Department students</span> — from the frontend to the backend, from the competition engine to the cheating prevention system. Every line of code was written by students who use this platform themselves.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { stat: '3+', label: 'Core Contributors' },
                { stat: '100%', label: 'Student Built' },
                { stat: '∞', label: 'Lines of Code' },
                { stat: '200+', label: 'Active Users' },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 glass-hover rounded-xl">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text mb-1">{s.stat}</div>
                  <div className="text-gray-400 text-xs md:text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Join Us CTA ── */}
          <div className="relative glass rounded-2xl md:rounded-3xl p-8 md:p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay:'1s' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="relative">
                  <GraduationCap className="w-12 h-12 text-yellow-400" />
                  <Zap className="w-6 h-6 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Be Part of Something Bigger</h2>
              <p className="text-base md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Whether you want to compete, contribute to the platform, or help organize events —{' '}
                <span className="text-purple-400 font-semibold">Coding Nexus has a place for you.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 transition-all hover:scale-105 shadow-xl shadow-purple-500/30"
                >
                  Sign Up & Start Competing
                </button>
                <button
                  onClick={() => navigate('/apply-team')}
                  className="px-8 py-4 bg-transparent border-2 border-cyan-400 text-cyan-200 rounded-xl font-bold text-lg hover:bg-cyan-500/20 transition-all hover:scale-105 shadow-xl"
                >
                  Apply to the Team
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AboutPage;
