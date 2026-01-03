import React from 'react';
import { Code, BookOpen, Users, Award, ArrowRight, CheckCircle, Zap, Trophy, Shield } from 'lucide-react';

const LandingPage = () => {
  const handleNavigation = (path) => {
    window.location.href = path;
  };
  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-white" />,
      title: 'Learning Resources',
      description: 'Access comprehensive notes and materials for your courses'
    },
    {
      icon: <Code className="w-8 h-8 text-white" />,
      title: 'Code Editor',
      description: 'Practice coding with our built-in compiler and IDE'
    },
    {
      icon: <Award className="w-8 h-8 text-white" />,
      title: 'Quiz System',
      description: 'Test your knowledge with interactive quizzes and assessments'
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: 'Attendance Tracking',
      description: 'Monitor your attendance and participation records'
    }
  ];

  const benefits = [
    'Track your learning progress in real-time',
    'Access course-specific content and materials',
    'Get instant support from administrators',
    'Compete with peers through interactive quizzes',
    'Practice coding with online compiler',
    'Stay updated with important announcements'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Navbar */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-white to-purple-200 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-indigo-900" />
              </div>
              <span className="text-white text-2xl font-bold">Coding Nexus</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => handleNavigation('/login')}
                className="px-5 py-2 text-white hover:bg-white/10 rounded-lg transition font-medium"
              >
                Login
              </button>
              <button 
                onClick={() => handleNavigation('/signup')}
                className="px-5 py-2 bg-white text-indigo-900 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-lg"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 text-transparent bg-clip-text">
              Coding Nexus
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Your ultimate platform for coding education. Learn, practice, and excel with our comprehensive learning management system designed for modern students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => handleNavigation('/signup')}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-900 rounded-lg font-bold text-lg hover:bg-opacity-90 transition shadow-xl gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleNavigation('/login')}
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition"
            >
              Student Login
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 hover:bg-white/20 transition transform hover:scale-105 duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mb-4 shadow-lg">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-200 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white/10 backdrop-blur-md p-8 md:p-12 rounded-2xl border border-white/20 mb-20">
          <div className="text-center mb-10">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Coding Nexus?</h2>
            <p className="text-gray-200 text-lg max-w-2xl mx-auto">
              Everything you need to succeed in your coding journey, all in one comprehensive platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 text-white">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <span className="text-base md:text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-bounce" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join hundreds of students already learning and growing with Coding Nexus
          </p>
          <button 
            onClick={() => handleNavigation('/signup')}
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-lg font-bold text-lg hover:from-pink-600 hover:to-yellow-600 transition shadow-2xl transform hover:scale-105"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-md border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">Coding Nexus</span>
              </div>
              <p className="text-gray-300 text-sm">
                Empowering students with comprehensive learning tools and resources for success in coding education.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleNavigation('/login')}
                  className="block text-gray-300 hover:text-white transition text-sm"
                >
                  Student Login
                </button>
                <button 
                  onClick={() => handleNavigation('/signup')}
                  className="block text-gray-300 hover:text-white transition text-sm"
                >
                  Sign Up
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className="flex items-center gap-1 text-gray-300 hover:text-white transition text-sm"
                >
                  <Shield className="w-4 h-4" />
                  Admin Login
                </button>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Learning Resources</p>
                <p>• Code Editor & Compiler</p>
                <p>• Interactive Quizzes</p>
                <p>• Attendance Tracking</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Coding Nexus. All rights reserved. Built with ❤️ for students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;