// src/components/student/QRCodeScanner.jsx - Mobile-Friendly QR Scanner with Geolocation
import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, MapPin, Shield, AlertCircle, CheckCircle, Loader2, Navigation } from 'lucide-react';

const QRCodeScanner = ({ onScan, onClose, isLoading }) => {
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported on this device');
      return;
    }

    setGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Location access denied';
        if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location unavailable';
        }
        setLocationError(errorMsg);
        setGettingLocation(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 0 
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!manualCode.trim()) {
      setError('Please enter the attendance code');
      return;
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint();

    // Call onScan with code, location, and device info
    onScan({
      qrCode: manualCode.trim(),
      latitude: location?.latitude,
      longitude: location?.longitude,
      deviceFingerprint
    });
  };

  const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = gl?.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || 0) || 'unknown';
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      renderer
    ].join('|');
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-white">Mark Attendance</h3>
              <p className="text-indigo-200 mt-1">Enter the code shown by your instructor</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition p-2 hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Security Status */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm ${
              location ? 'text-green-600' : gettingLocation ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {gettingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Getting location...</span>
                </>
              ) : location ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Location verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>{locationError || 'Location needed'}</span>
                </>
              )}
            </div>
            
            {!location && !gettingLocation && (
              <button
                onClick={getLocation}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
          
          {location && (
            <p className="text-xs text-gray-500 mt-1">
              Accuracy: ±{Math.round(location.accuracy)}m
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Security Note */}
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-800">Anti-Cheating Protection</p>
                <p className="text-xs text-indigo-600 mt-1">
                  Your location and device are verified to ensure you're physically present.
                  {!location && " Please enable location access."}
                </p>
              </div>
            </div>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Code
              </label>
              <input
                ref={inputRef}
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="e.g. NEXUS_1706..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-gray-900"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !manualCode.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Mark Attendance
                </>
              )}
            </button>
          </form>

          {/* Instructions */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 text-center">
              Ask your instructor for the attendance code displayed on their screen
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QRCodeScanner;
