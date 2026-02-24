import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function EventLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/events/event-login`,
        formData
      );

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        toast.success('Login successful!');
        
        // Redirect to event dashboard
        navigate('/event-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="mb-6 px-5 py-2.5 bg-gray-800/80 backdrop-blur-sm text-white rounded-xl hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl border border-gray-700 hover:border-gray-600"
        >
          ← Back to Events
        </button>

        {/* Login Card */}
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-gray-700/50">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full mb-4 shadow-xl">
              <svg
                className="w-10 sm:w-12 h-10 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Event Login</h2>
            <p className="text-gray-400 text-sm sm:text-base">Access your registered events</p>
          </div>

          {/* Info Box */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-gradient-to-r from-blue-600/90 to-blue-700/90 border-2 border-blue-500/50 rounded-xl shadow-lg backdrop-blur-sm">
            <p className="text-white text-sm sm:text-base leading-relaxed flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">ℹ️</span>
              <span>Use your <strong className="font-bold">email and phone number</strong> to login. <strong className="font-bold">No password needed!</strong></span>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email */}
            <div>
              <label className="block text-gray-200 mb-2.5 text-sm font-bold">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-xl bg-gray-700/80 text-white border-2 border-gray-600 hover:border-purple-500/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-base disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-500"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-gray-200 mb-2.5 text-sm font-bold">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-xl bg-gray-700/80 text-white border-2 border-gray-600 hover:border-purple-500/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-base disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-500"
                placeholder="10-digit number"
                pattern="[0-9]{10}"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:via-purple-600 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-bold py-3.5 sm:py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base sm:text-lg shadow-xl hover:shadow-2xl mt-6 sm:mt-8"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Login to Event</span>
                </span>
              )}
            </button>

            {/* Don't have an account link */}
            <p className="text-sm sm:text-base text-gray-300 text-center mt-4 sm:mt-6 pt-4 border-t border-gray-700">
              Not registered yet?{' '}
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors duration-200"
              >
                Register now →
              </button>
            </p>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-300 text-sm sm:text-base bg-gray-800/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-700/50 inline-block">
            <span className="text-xl mr-2">💡</span>
            Use the same email & phone you registered with
          </p>
        </div>
      </div>
    </div>
  );
}
