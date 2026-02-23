import React, { useState } from 'react';
import { Mail, Phone, User, ArrowLeft, MapPin, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactPage = () => {
  const navigate = useNavigate();
  const [copiedPhone, setCopiedPhone] = useState('');

  const teamMembers = [
    {
      name: 'Ashish Vishwakarma',
      class: 'TE-B',
      phone: '8104287477',
      role: 'Club Lead'
    },
    {
      name: 'Sumit Thakur',
      class: 'TE-B',
      phone: '7887647604',
      role: 'Technical Head'
    },
    {
      name: 'Chetan Shende',
      class: 'TE-B',
      phone: '9022729825',
      role: 'Events Coordinator'
    }
  ];

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(''), 2000);
  };

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
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">Contact Us</h1>
              <p className="text-indigo-100 mt-2 text-lg">Get in touch with Coding Nexus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div>
            {/* Email Section */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 mb-6 border-2 border-purple-400/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Email Us</h3>
                  <p className="text-base text-white">Send us your queries</p>
                </div>
              </div>
              <a
                href="mailto:codingnexus@apsit.edu.in"
                className="inline-flex items-center gap-2 text-xl text-white hover:text-yellow-300 transition-colors font-bold"
              >
                <Send className="w-6 h-6" />
                codingnexus@apsit.edu.in
              </a>
            </div>

            {/* Location */}
            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-8 border-2 border-cyan-400/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-8 h-8 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Our Location</h3>
                  <p className="text-base text-white">Visit us at</p>
                </div>
              </div>
              <p className="text-white text-lg leading-relaxed font-medium">
                A.P. Shah Institute of Technology (APSIT)<br />
                Thane, Maharashtra, India
              </p>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-xl rounded-2xl p-8 border-2 border-indigo-500/50 shadow-2xl">
              <h3 className="text-3xl font-bold text-white mb-6">Our Team</h3>
              <div className="space-y-4">
                {teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 border-2 border-purple-400/50 hover:border-yellow-400 transition-all hover:scale-105 shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">{member.name}</h4>
                        </div>
                      </div>
                      <span className="px-4 py-1.5 bg-yellow-400 text-purple-900 text-sm font-bold rounded-full shadow-lg">
                        {member.class}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyPhone(member.phone)}
                      className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors group w-full text-lg"
                    >
                      <Phone className="w-5 h-5 text-yellow-300" />
                      <span className="font-mono font-bold">{member.phone}</span>
                      {copiedPhone === member.phone ? (
                        <span className="ml-auto text-sm text-yellow-300 font-bold">Copied!</span>
                      ) : (
                        <span className="ml-auto text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                          Click to copy
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Contact CTA */}
            <div className="mt-6 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-center shadow-2xl border-2 border-pink-400/50">
              <h3 className="text-2xl font-bold text-white mb-3">Have Questions?</h3>
              <p className="text-white text-lg mb-6 font-medium">
                Feel free to reach out to any of our team members or send us an email. We're here to help!
              </p>
              <a
                href="mailto:codingnexus@apsit.edu.in"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-yellow-300 hover:text-purple-900 transition-all hover:scale-110 shadow-2xl"
              >
                <Mail className="w-6 h-6" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
