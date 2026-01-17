import React, { useState, useRef, useEffect } from 'react';
import { Users, Code, Palette, Briefcase, BookOpen, Sparkles, Award, Star, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Club Members Page - Static page for displaying appointed club members
 * Route: /club-members-2026
 * 
 * This page is NOT linked in navigation - share the direct URL with selected members only
 * Safe for deployment - no database changes, just a static display page
 */

const ClubMembers = () => {
  const [revealedCards, setRevealedCards] = useState({});
  const [showWelcome, setShowWelcome] = useState(true);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const animatedCards = useRef({}); // Track which cards have already been animated
  const navigate = useNavigate();

  // Welcome screen auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Generate confetti on mount
  useEffect(() => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]
    }));
    setConfettiPieces(pieces);
  }, []);

  // Function to reveal card on click
  const handleCardClick = (section, index) => {
    const key = `${section}-${index}`;
    if (!revealedCards[key]) {
      // Only trigger animation for newly revealed cards
      animatedCards.current[key] = true;
      setRevealedCards(prev => ({
        ...prev,
        [key]: true
      }));
    }
  };

  // ============================================
  // CONFIGURATION SECTION - EDIT NAMES HERE
  // ============================================
  
  const clubMembers = {
    // Learners - Members who are learning and participating
    learners: [
      { name: 'Maitreya bhatkhande', year: 'SE-A', branch: 'CSE-AIML' },
      { name: 'Siddhesh Kite', year: 'SE-B', branch: 'CSE-AIML' },
      { name: 'Siddhi Jedhge', year: 'SE-A', branch: 'CSE-AIML' },
      { name: 'Shruti Mishra', year: 'SE-B', branch: 'CSE-AIML' },
      { name: 'Yashwant injapuri ', year: 'SE-B', branch: 'CSE-AIML' },
      { name: 'Riya bachhar', year: 'SE-B', branch: 'CSE-AIML' },
      { name: 'Akshat Mukawwar ', year: 'SE-A', branch: 'CSE-AIML' },
      // Add more learners here following the same format
      // { name: 'Your Name', year: 'Year', branch: 'Branch' },
    ],

    // Design Team - Responsible for UI/UX, graphics, and visual content
    design: [
      { name: 'Akansha Kanojiya', role: 'Graphic Designer', specialization: 'Posters & Social Media' },
      // Add more design team members here
      // { name: 'Your Name', role: 'Your Role', specialization: 'Your Area' },
    ],

    // Technical Team - Responsible for development, maintenance, and technical tasks
    technical: [
      { name: 'Aarya Nischal', role: 'Technical Member', expertise: '-' },
      { name: 'Kavish jain', role: 'Technical Member', expertise: '-' },
      // { name: 'Developer Name 3', role: 'Frontend Developer', expertise: 'UI Development' },
      // Add more technical team members here
      // { name: 'Your Name', role: 'Your Role', expertise: 'Your Skills' },
    ],

    // Management Team - Responsible for coordination, events, and administration
    management: [
      { name: 'Yash Gupta',  responsibility: 'Overall Coordination' },
      { name: 'Rohit Nahar',  responsibility: 'Overall Coordination ' },
      // { name: 'Manager Name 3', role: 'Secretary', responsibility: 'Documentation' },
      // Add more management team members here
      // { name: 'Your Name', role: 'Your Role', responsibility: 'Your Area' },
    ],
  };

  // ============================================
  // END OF CONFIGURATION SECTION
  // ============================================

  // Render a member card with reveal animation
  const MemberCard = ({ member, section, index, colorClass, borderClass, gradient }) => {
    const key = `${section}-${index}`;
    const isRevealed = revealedCards[key];
    const shouldAnimate = animatedCards.current[key] && isRevealed;

    return (
      <div
        onClick={() => handleCardClick(section, index)}
        className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 border-2 ${borderClass} cursor-pointer transform hover:scale-105 active:scale-95 md:hover:-rotate-1 group overflow-hidden ${
          shouldAnimate ? 'animate-reveal' : ''
        }`}
        style={{
          animationDelay: `${index * 100}ms`,
          animationFillMode: 'both'
        }}
        onAnimationEnd={() => {
          // Remove animation class after animation completes to prevent re-triggering
          if (animatedCards.current[key]) {
            delete animatedCards.current[key];
          }
        }}
      >
        {/* Gradient background effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}></div>
        
        {/* Sparkle effect on hover - hidden on mobile for performance */}
        <div className="hidden md:block absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12">
          <Sparkles className={`w-6 h-6 ${colorClass} animate-pulse`} />
        </div>

        {/* Star decoration */}
        <div className="absolute top-3 left-3 opacity-20">
          <Star className={`w-5 h-5 ${colorClass}`} fill="currentColor" />
        </div>

        {/* Click hint for unrevealed cards */}
        {!isRevealed && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm flex items-center justify-center rounded-2xl transition-all duration-500 border-2 border-white/20">
            <div className="text-center px-4 animate-float">
              <Award className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
              <div className="text-white text-lg font-bold mb-2 tracking-wide">Tap to Reveal</div>
              <div className="text-gray-300 text-sm font-medium">✨ Member #{index + 1} ✨</div>
            </div>
          </div>
        )}

        {/* Card content - revealed */}
        <div className={`transition-all duration-500 ${isRevealed ? 'opacity-100' : 'opacity-0'} relative z-10`}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 break-words flex-1 leading-tight">{member.name}</h3>
            <Zap className={`w-5 h-5 ${colorClass} ml-2 flex-shrink-0`} />
          </div>
          <p className={`${colorClass} font-bold mb-2 text-base`}>
            {member.role || member.year}
          </p>
          <p className="text-gray-600 text-sm break-words leading-relaxed">
            {member.responsibility || member.expertise || member.specialization || member.branch}
          </p>
          
          {/* Bottom decorative line */}
          <div className={`mt-4 h-1 w-full bg-gradient-to-r ${gradient} rounded-full opacity-30`}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Confetti */}
      {showWelcome && confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-confetti-fall pointer-events-none"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`
          }}
        />
      ))}

      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-fade-out">
          <div className="text-center animate-scale-in px-4">
            <div className="mb-6">
              <Award className="w-24 h-24 text-yellow-300 mx-auto animate-bounce-slow mb-4" />
              <div className="flex justify-center gap-2 mb-4">
                <Star className="w-8 h-8 text-yellow-300 animate-spin-slow" fill="currentColor" />
                <Star className="w-10 h-10 text-yellow-200 animate-pulse" fill="currentColor" />
                <Star className="w-8 h-8 text-yellow-300 animate-spin-slow" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight animate-glow">
              🎉 Congratulations! 🎉
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 font-medium mb-2">
              Welcome to Coding Nexus
            </p>
            <p className="text-lg sm:text-xl text-white/80 font-light italic">
              You're part of something amazing ✨
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-8 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
            <span className="text-gray-700 font-semibold">Back to Home</span>
          </button>
          {/* Header Section with animation */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up">
            <div className="inline-block mb-6">
              <div className="flex items-center justify-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                <Award className="w-8 h-8 text-yellow-500 animate-bounce" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Official Members 2026-2027
                </span>
                <Award className="w-8 h-8 text-yellow-500 animate-bounce" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-4 animate-gradient-x leading-tight px-2">
              SE - Club Members
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-700 mb-4 px-4 font-medium">
              Meet the exceptional team behind <span className="font-bold text-purple-600">Coding Nexus</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-6 px-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg transform hover:scale-105 transition-transform">
                🚀 Innovation
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg transform hover:scale-105 transition-transform">
                💡 Creativity
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg transform hover:scale-105 transition-transform">
                ⭐ Excellence
              </div>
            </div>
            
            <p className="mt-6 text-gray-600 text-sm sm:text-base italic px-4 bg-white/60 backdrop-blur-sm inline-block py-2 px-6 rounded-full">
              💫 Tap on each card to reveal the member details
            </p>
          </div>

          {/* Learners Section - NOW FIRST! */}
          <section className="mb-10 sm:mb-16 animate-slide-up">
            <div className="flex items-center justify-center gap-3 mb-8 bg-white/70 backdrop-blur-sm py-4 px-6 rounded-2xl shadow-lg inline-flex mx-auto">
              <BookOpen className="w-10 h-10 text-green-600 animate-bounce" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                SE-Learners
              </h2>
              <Sparkles className="w-8 h-8 text-green-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {clubMembers.learners.map((member, index) => (
                <MemberCard
                  key={index}
                  member={member}
                  section="learners"
                  index={index}
                  colorClass="text-green-600"
                  borderClass="border-green-400 hover:border-green-600"
                  gradient="from-green-400 to-emerald-500"
                />
              ))}
            </div>
          </section>

          {/* Design Team Section */}
          <section className="mb-10 sm:mb-16 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-center gap-3 mb-8 bg-white/70 backdrop-blur-sm py-4 px-6 rounded-2xl shadow-lg inline-flex mx-auto">
              <Palette className="w-10 h-10 text-pink-600 animate-bounce" style={{ animationDelay: '100ms' }} />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                Design Team
              </h2>
              <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubMembers.design.map((member, index) => (
                <MemberCard
                  key={index}
                  member={member}
                  section="design"
                  index={index}
                  colorClass="text-pink-600"
                  borderClass="border-pink-400 hover:border-pink-600"
                  gradient="from-pink-400 to-rose-500"
                />
              ))}
            </div>
          </section>

          {/* Technical Team Section */}
          <section className="mb-10 sm:mb-16 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-center gap-3 mb-8 bg-white/70 backdrop-blur-sm py-4 px-6 rounded-2xl shadow-lg inline-flex mx-auto">
              <Code className="w-10 h-10 text-blue-600 animate-bounce" style={{ animationDelay: '200ms' }} />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                Technical Team
              </h2>
              <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubMembers.technical.map((member, index) => (
                <MemberCard
                  key={index}
                  member={member}
                  section="technical"
                  index={index}
                  colorClass="text-blue-600"
                  borderClass="border-blue-400 hover:border-blue-600"
                  gradient="from-blue-400 to-cyan-500"
                />
              ))}
            </div>
          </section>

          {/* Management Team Section */}
          <section className="mb-10 sm:mb-16 animate-slide-up" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-center gap-3 mb-8 bg-white/70 backdrop-blur-sm py-4 px-6 rounded-2xl shadow-lg inline-flex mx-auto">
              <Briefcase className="w-10 h-10 text-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Management Team
              </h2>
              <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubMembers.management.map((member, index) => (
                <MemberCard
                  key={index}
                  member={member}
                  section="management"
                  index={index}
                  colorClass="text-purple-600"
                  borderClass="border-purple-400 hover:border-purple-600"
                  gradient="from-purple-400 to-indigo-500"
                />
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="text-center mt-16 sm:mt-24 pt-8 border-t-2 border-gray-200 animate-fade-in px-4">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-8 px-6 rounded-3xl shadow-2xl max-w-3xl mx-auto">
              <Users className="w-16 h-16 mx-auto mb-4 animate-bounce-slow" />
              <p className="text-xl sm:text-2xl font-bold mb-2">
                Together, we're building a community of coders and innovators 🚀
              </p>
              <p className="text-sm sm:text-base opacity-90">
                Tap all cards to reveal the complete team!
              </p>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              Made with 💜 by Coding Nexus
            </p>
          </div>
        </div>
      </div>

      {/* Add custom animations via style tag */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes reveal {
          from {
            opacity: 0;
            transform: scale(0.8) rotateY(180deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -20px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 20px) scale(1.05);
          }
        }

        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
          50% {
            text-shadow: 0 0 40px rgba(255, 255, 255, 0.8);
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            pointer-events: none;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
          animation-fill-mode: both;
        }

        .animate-reveal {
          animation: reveal 0.6s ease-out;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.8s ease-out;
        }

        .animate-fade-out {
          animation: fade-out 0.5s ease-out 3s forwards;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ClubMembers;