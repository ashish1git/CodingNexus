import React from 'react';
import { Code, Users, Rocket, Target, Award, ArrowLeft, Sparkles, Brain, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-white hover:text-indigo-100 transition-all hover:translate-x-1 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <div className="flex items-center gap-6">
            <img src="/favicon.svg" alt="Coding Nexus Logo" className="w-20 h-20 rounded-2xl shadow-lg" />
            <div>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">About Coding Nexus</h1>
              <p className="text-indigo-100 mt-2 text-lg">Learn. Code. Excel.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 mb-8 border-2 border-indigo-500/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
            <h2 className="text-4xl font-bold text-white">Who We Are</h2>
          </div>
          <p className="text-xl text-white leading-relaxed mb-6 font-medium">
            <span className="text-yellow-300 font-bold text-2xl">Coding Nexus</span> is a vibrant student-driven coding club at{' '}
            <span className="text-cyan-300 font-bold">APSIT (A.P. Shah Institute of Technology)</span>, dedicated to fostering 
            a community of passionate developers and problem solvers. We believe in learning by doing, and our mission is to 
            empower students with the skills, knowledge, and confidence to excel in the ever-evolving world of technology.
          </p>
          <p className="text-xl text-gray-100 leading-relaxed font-medium">
            Through hands-on workshops, competitive coding events, collaborative projects, and mentorship programs, we create 
            an environment where students can explore various domains of computer science, from data structures and algorithms 
            to web development, machine learning, and beyond.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 border-2 border-purple-400/50 shadow-2xl transform hover:scale-105 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-10 h-10 text-yellow-300" />
              <h3 className="text-3xl font-bold text-white">Our Mission</h3>
            </div>
            <p className="text-white text-lg leading-relaxed font-medium">
              To create a supportive learning ecosystem where students can enhance their programming skills, 
              participate in competitive coding, collaborate on real-world projects, and prepare for successful 
              careers in the tech industry.
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-600 to-blue-800 rounded-2xl p-8 border-2 border-cyan-400/50 shadow-2xl transform hover:scale-105 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-10 h-10 text-yellow-300" />
              <h3 className="text-3xl font-bold text-white">Our Vision</h3>
            </div>
            <p className="text-white text-lg leading-relaxed font-medium">
              To be the leading student coding community that bridges the gap between academic learning and 
              industry requirements, producing skilled developers who can tackle real-world challenges with 
              confidence and innovation.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 mb-8 border-2 border-indigo-500/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-10 h-10 text-yellow-400" />
            <h2 className="text-4xl font-bold text-white">What We Offer</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: 'DSA Mastery',
                description: 'In-depth training on Data Structures & Algorithms with 100% focus on problem-solving',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: 'Coding Contests',
                description: '5+ competitive programming events and hackathons throughout the year',
                color: 'from-cyan-500 to-blue-500'
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Tech Workshops',
                description: '5+ hands-on workshops covering latest technologies and industry trends',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: <Code className="w-6 h-6" />,
                title: 'Code Editor & Compiler',
                description: 'Built-in online IDE supporting multiple programming languages',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: 'Quiz System',
                description: 'Interactive quizzes to test and improve your programming knowledge',
                color: 'from-red-500 to-rose-500'
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: 'Active Community',
                description: '20+ passionate members learning and growing together',
                color: 'from-indigo-500 to-purple-500'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group bg-gradient-to-br from-indigo-800/60 to-purple-800/60 backdrop-blur-sm rounded-xl p-6 border-2 border-indigo-500/40 hover:border-yellow-400 transition-all hover:scale-105 shadow-lg">
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${feature.color} rounded-lg mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                <p className="text-base text-gray-100 font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Join Us CTA */}
        <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-center shadow-2xl border-2 border-pink-400/50">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Join Our Community?</h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto font-medium">
            Be part of a thriving community of developers, participate in exciting events, and accelerate your coding journey!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-10 py-4 bg-white text-purple-600 rounded-xl font-bold text-xl hover:bg-yellow-300 hover:text-purple-900 transition-all hover:scale-110 shadow-2xl"
            >
              Sign Up Now
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-10 py-4 bg-transparent border-4 border-white text-white rounded-xl font-bold text-xl hover:bg-white hover:text-purple-600 transition-all hover:scale-110 shadow-2xl"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
