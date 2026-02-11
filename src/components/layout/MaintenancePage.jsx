import React, { useEffect, useState } from 'react';
import { Zap, AlertCircle, Clock } from 'lucide-react';

const MaintenancePage = () => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-8 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Status Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-4 animate-pulse">
            503
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-orange-400 to-red-500 mx-auto"></div>
        </div>

        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative bg-slate-800 rounded-full p-6 border border-orange-400/30">
              <Zap className="w-16 h-16 text-orange-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Main Message */}
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          We're Under Maintenance
        </h2>
        
        <p className="text-xl text-slate-300 mb-8">
          We're temporarily offline for scheduled maintenance and improvements.
        </p>

        {/* Loading indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Clock className="w-5 h-5" />
            <span>Coming back soon</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`transition-opacity ${
                    i < dotCount ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  •
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white mb-2">What's happening?</h3>
              <p className="text-slate-300">
                We're performing critical updates and enhancements to provide you with an even better experience. We'll be back online shortly.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">Status</div>
              <div className="text-orange-400 font-semibold">Maintenance in Progress</div>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">Expected Duration</div>
              <div className="text-blue-400 font-semibold">24-48 hours</div>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="text-slate-400 text-sm">
          <p className="mb-3">Have questions? Please contact us at:</p>
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 inline-block">
            <a href="mailto:support@codingnexus.com" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
              codingnexus@apsit.edu.in
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700 text-slate-500 text-xs">
          <p>Coding Nexus © 2026 | Service Status: Maintenance Mode</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
