import React from 'react';

const MaintenancePage = () => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">CN</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Coding Nexus</h1>
            <p className="text-xs text-gray-500">APSIT</p>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full">
          {/* Status Code */}
          <div className="mb-12">
            <h2 className="text-8xl font-light text-gray-300 mb-4">503</h2>
            <div className="w-16 h-0.5 bg-gray-200"></div>
          </div>

          {/* Message */}
          <div className="mb-12">
            <h3 className="text-3xl font-normal text-gray-900 mb-4">
              Service Temporarily Unavailable
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              The server is currently unable to handle your request due to scheduled maintenance. 
              We'll be back online shortly.
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Estimated Time</p>
                <p className="text-sm font-medium text-gray-900">10-15 minutes</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Start Time</p>
                <p className="text-sm font-medium text-gray-900">----</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500 mb-4">
              If you need immediate assistance, please contact our support team:
            </p>
            <a 
              href="mailto:ashishapsit@gmail.com"
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              codingnexus@apsit.edu.in
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-gray-400">
            © 2026 Coding Nexus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;