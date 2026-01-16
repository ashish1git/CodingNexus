// src/components/shared/ClubMembers.jsx
import React, { useState, useRef } from 'react';
import { Users, Code, Palette, Briefcase, BookOpen, Sparkles } from 'lucide-react';

/**
 * Club Members Page - Static page for displaying appointed club members
 * Route: /club-members-2026
 * 
 * This page is NOT linked in navigation - share the direct URL with selected members only
 * Safe for deployment - no database changes, just a static display page
 */

const ClubMembers = () => {
  const [revealedCards, setRevealedCards] = useState({});
  const animatedCards = useRef({}); // Track which cards have already been animated

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
      // Add more learners here following the same format
      // { name: 'Your Name', year: 'Year', branch: 'Branch' },
    ],

    // Design Team - Responsible for UI/UX, graphics, and visual content
    design: [
      { name: 'Designer Name 1', role: 'UI/UX Lead', specialization: 'Web Design' },
      { name: 'Designer Name 2', role: 'Graphic Designer', specialization: 'Posters & Social Media' },
      // Add more design team members here
      // { name: 'Your Name', role: 'Your Role', specialization: 'Your Area' },
    ],

    // Technical Team - Responsible for development, maintenance, and technical tasks
    technical: [
      { name: 'Developer Name 1', role: 'Full Stack Developer', expertise: 'React & Node.js' },
      { name: 'Developer Name 2', role: 'Backend Developer', expertise: 'Database & APIs' },
      { name: 'Developer Name 3', role: 'Frontend Developer', expertise: 'UI Development' },
      // Add more technical team members here
      // { name: 'Your Name', role: 'Your Role', expertise: 'Your Skills' },
    ],

    // Management Team - Responsible for coordination, events, and administration
    management: [
      { name: 'Manager Name 1', role: 'President', responsibility: 'Overall Coordination' },
      { name: 'Manager Name 2', role: 'Vice President', responsibility: 'Event Planning' },
      { name: 'Manager Name 3', role: 'Secretary', responsibility: 'Documentation' },
      // Add more management team members here
      // { name: 'Your Name', role: 'Your Role', responsibility: 'Your Area' },
    ],
  };

  // ============================================
  // END OF CONFIGURATION SECTION
  // ============================================

  // Render a member card with reveal animation
  const MemberCard = ({ member, section, index, colorClass, borderClass }) => {
    const key = `${section}-${index}`;
    const isRevealed = revealedCards[key];
    const shouldAnimate = animatedCards.current[key] && isRevealed;

    return (
      <div
        onClick={() => handleCardClick(section, index)}
        className={`relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-4 sm:p-6 border-l-4 ${borderClass} cursor-pointer transform hover:scale-105 active:scale-95 md:hover:-rotate-1 group overflow-hidden ${
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
        {/* Sparkle effect on hover - hidden on mobile for performance */}
        <div className="hidden md:block absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className={`w-5 h-5 ${colorClass}`} />
        </div>

        {/* Click hint for unrevealed cards */}
        {!isRevealed && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl transition-all duration-500">
            <div className="text-center px-2">
              <div className="text-white text-sm sm:text-base font-medium mb-2">Tap to Reveal</div>
              <div className="text-gray-300 text-xs sm:text-sm">Member #{index + 1}</div>
            </div>
          </div>
        )}

        {/* Card content - revealed */}
        <div className={`transition-all duration-500 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words">{member.name}</h3>
          <p className={`${colorClass} font-semibold mb-2 text-sm sm:text-base`}>
            {member.role || member.year}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm break-words">
            {member.responsibility || member.expertise || member.specialization || member.branch}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with animation */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3 sm:mb-4 animate-pulse-slow px-2">
            Coding Nexus Club Members
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4 px-4">
            Meet the dedicated team behind Coding Nexus
          </p>
          <div className="mt-3 sm:mt-4 inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium shadow-md">
            Academic Year 2025-2026
          </div>
          <p className="mt-4 sm:mt-6 text-gray-500 text-xs sm:text-sm italic px-4">
            💡 Tap on each card to reveal the member details
          </p>
        </div>

        {/* Learners Section - NOW FIRST! */}
        <section className="mb-10 sm:mb-16 animate-slide-up">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              Learners
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {clubMembers.learners.map((member, index) => (
              <MemberCard
                key={index}
                member={member}
                section="learners"
                index={index}
                colorClass="text-green-600"
                borderClass="border-green-600"
              />
            ))}
          </div>
        </section>

        {/* Design Team Section */}
        <section className="mb-10 sm:mb-16 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Palette className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600 animate-bounce" style={{ animationDelay: '100ms' }} />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
              Design Team
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clubMembers.design.map((member, index) => (
              <MemberCard
                key={index}
                member={member}
                section="design"
                index={index}
                colorClass="text-pink-600"
                borderClass="border-pink-600"
              />
            ))}
          </div>
        </section>

        {/* Technical Team Section */}
        <section className="mb-10 sm:mb-16 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Code className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 animate-bounce" style={{ animationDelay: '200ms' }} />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              Technical Team
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clubMembers.technical.map((member, index) => (
              <MemberCard
                key={index}
                member={member}
                section="technical"
                index={index}
                colorClass="text-blue-600"
                borderClass="border-blue-600"
              />
            ))}
          </div>
        </section>

        {/* Management Team Section */}
        <section className="mb-10 sm:mb-16 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Management Team
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clubMembers.management.map((member, index) => (
              <MemberCard
                key={index}
                member={member}
                section="management"
                index={index}
                colorClass="text-purple-600"
                borderClass="border-purple-600"
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center mt-12 sm:mt-20 pt-6 sm:pt-8 border-t border-gray-200 animate-fade-in px-4">
          <p className="text-gray-600 text-base sm:text-lg font-medium">
            Together, we're building a community of coders and innovators 🚀
          </p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            Tap all cards to reveal the complete team!
          </p>
        </div>
      </div>

      {/* Add custom animations via style tag */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
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

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
          animation-fill-mode: both;
        }

        .animate-reveal {
          animation: reveal 0.6s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ClubMembers;
