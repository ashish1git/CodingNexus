import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function EventRegistration() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  const yearOptions = ['FE', 'SE', 'TE', 'BE'];
  const divisionOptions = Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)); // A-J
  const branchOptions = ['CSE AIML', 'COMPS', 'IT', 'CSE DS', 'MECH', 'CIVIL'];
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    moodleId: '',
    year: '',
    division: '',
    branch: '',
    college: 'APSIT'
  });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  // Countdown timer for registration start
  useEffect(() => {
    if (!event?.registrationStartTime) return;

    const isRegistrationNotStarted = new Date() < new Date(event.registrationStartTime);
    if (!isRegistrationNotStarted) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const startTime = new Date(event.registrationStartTime);
      const diffMs = startTime - now;

      if (diffMs <= 0) {
        setCountdown(null);
        // Refresh event details to update registration status
        fetchEventDetails();
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [event?.registrationStartTime]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/events/public/events/${eventId}`);
      setEvent(response.data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone number must be 10 digits');
      return false;
    }

    if (!formData.moodleId || formData.moodleId.trim().length < 3) {
      toast.error('Moodle ID is required (minimum 3 characters)');
      return false;
    }

    if (!formData.year || !formData.division || !formData.branch) {
      toast.error('Please select year, division, and branch');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/events/public/events/${eventId}/register`,
        {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          moodleId: formData.moodleId.trim(),
          year: formData.year,
          division: formData.division,
          branch: formData.branch
        }
      );

      toast.success(response.data.message || 'Registration successful!');
      setTimeout(() => {
        navigate('/event-login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.error === 'You have already registered for this event') {
        toast.error('You have already registered for this event. Please login to continue.');
      } else {
        toast.error(error.response?.data?.error || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center px-4">
        <div className="text-white text-lg">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  // Check if registration is closed
  const isDeadlineOver = new Date() > new Date(event.registrationDeadline);
  const isEventFull = event.spotsLeft <= 0;
  const isRegistrationNotStarted = event.registrationStartTime && new Date() < new Date(event.registrationStartTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black py-6 px-4 sm:py-12 event-dark-theme">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="mb-6 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base"
        >
          ← Back to Events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Event Details - Sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 h-fit lg:sticky lg:top-4">
              {/* Event Poster */}
              {event.posterUrl && (
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="w-full h-40 sm:h-48 object-cover rounded-lg mb-4 sm:mb-6"
                />
              )}
              
              {/* Event Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">{event.title}</h1>
              
              {/* Event Description */}
              {event.description && (
                <div className="mb-4 sm:mb-6">
                  <p className={`text-gray-300 text-sm sm:text-base leading-relaxed ${descExpanded ? '' : 'line-clamp-4'}`}>{event.description}</p>
                  {event.description.length > 200 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="text-purple-400 hover:text-purple-300 text-xs font-medium mt-1.5 transition"
                    >
                      {descExpanded ? '▲ Show less' : '▼ Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* Event Details */}
              <div className="space-y-3 sm:space-y-4 text-sm">
                {/* Date */}
                <div className="flex items-start text-gray-300">
                  <span className="mr-3 mt-0.5 text-lg">📅</span>
                  <div>
                    <div className="font-semibold text-white text-xs sm:text-sm">Event Date</div>
                    <div className="text-xs sm:text-sm">{new Date(event.eventDate).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}</div>
                  </div>
                </div>

                {/* Venue */}
                {event.venue && (
                  <div className="flex items-start text-gray-300">
                    <span className="mr-3 mt-0.5 text-lg">📍</span>
                    <div>
                      <div className="font-semibold text-white text-xs sm:text-sm">Venue</div>
                      <div className="text-xs sm:text-sm">{event.venue}</div>
                    </div>
                  </div>
                )}

                {/* Type */}
                <div className="flex items-start text-gray-300">
                  <span className="mr-3 mt-0.5 text-lg">🎯</span>
                  <div>
                    <div className="font-semibold text-white text-xs sm:text-sm">Event Type</div>
                    <div className="capitalize text-xs sm:text-sm">{event.eventType}</div>
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-start text-gray-300">
                  <span className="mr-3 mt-0.5 text-lg">👥</span>
                  <div>
                    <div className="font-semibold text-white text-xs sm:text-sm">Availability</div>
                    <div className="text-xs sm:text-sm">
                      {event.registeredCount}/{event.maxParticipants} registered
                      {event.spotsLeft > 0 && (
                        <span className="text-green-400 ml-2">
                          ({event.spotsLeft} left)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex items-start">
                  <span className="mr-3 mt-0.5 text-lg">⏰</span>
                  <div>
                    <div className="font-semibold text-white text-xs sm:text-sm">Registration Deadline</div>
                    <div className={`text-xs sm:text-sm ${isDeadlineOver ? 'text-red-400' : 'text-gray-300'}`}>
                      {new Date(event.registrationDeadline).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Register for Event</h2>

              {isRegistrationNotStarted && countdown && (
                <div className="mb-4 p-3 sm:p-6 bg-gradient-to-br from-orange-900 to-yellow-900 border border-orange-500 rounded-lg">
                  <div className="text-center space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-center gap-2 text-orange-200">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-bold text-sm sm:text-base md:text-lg">Registration Not Started</p>
                    </div>
                    <p className="text-white text-xs sm:text-sm">Registration opens in:</p>
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-4 text-white font-bold flex-wrap">
                      {countdown.days > 0 && (
                        <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-[50px] sm:min-w-[60px]">
                          <span className="text-xl sm:text-2xl md:text-3xl">{countdown.days}</span>
                          <span className="text-[10px] sm:text-xs text-gray-300">days</span>
                        </div>
                      )}
                      {(countdown.days > 0 || countdown.hours > 0) && (
                        <>
                          {countdown.days > 0 && <span className="text-xl sm:text-2xl md:text-3xl text-orange-400 px-1">:</span>}
                          <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-[50px] sm:min-w-[60px]">
                            <span className="text-xl sm:text-2xl md:text-3xl">{String(countdown.hours).padStart(2, '0')}</span>
                            <span className="text-[10px] sm:text-xs text-gray-300">hrs</span>
                          </div>
                        </>
                      )}
                      <span className="text-xl sm:text-2xl md:text-3xl text-orange-400 px-1">:</span>
                      <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-[50px] sm:min-w-[60px]">
                        <span className="text-xl sm:text-2xl md:text-3xl">{String(countdown.minutes).padStart(2, '0')}</span>
                        <span className="text-[10px] sm:text-xs text-gray-300">min</span>
                      </div>
                      <span className="text-xl sm:text-2xl md:text-3xl text-orange-400 px-1">:</span>
                      <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-[50px] sm:min-w-[60px]">
                        <span className="text-xl sm:text-2xl md:text-3xl">{String(countdown.seconds).padStart(2, '0')}</span>
                        <span className="text-[10px] sm:text-xs text-gray-300">sec</span>
                      </div>
                    </div>
                    <p className="text-gray-200 text-xs sm:text-sm mt-2 sm:mt-3 px-2">
                      Opens at {new Date(event.registrationStartTime).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              )}

              {isDeadlineOver && (
                <div className="mb-4 p-3 sm:p-4 bg-red-900 border border-red-700 rounded-lg text-red-200 text-xs sm:text-sm">
                  ⏱️ Registration deadline has passed. No new registrations are being accepted.
                </div>
              )}

              {isEventFull && (
                <div className="mb-4 p-3 sm:p-4 bg-yellow-900 border border-yellow-700 rounded-lg text-yellow-200 text-xs sm:text-sm">
                  🚫 This event is full. No more spots available.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-200 mb-2 text-sm font-semibold">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isRegistrationNotStarted || isDeadlineOver || isEventFull}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 hover:border-purple-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition text-base disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-200 mb-2 text-sm font-semibold">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isRegistrationNotStarted || isDeadlineOver || isEventFull}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 hover:border-purple-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition text-base disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-400 mt-2">✉️ We'll send confirmation here</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-gray-200 mb-2 text-sm font-semibold">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isRegistrationNotStarted || isDeadlineOver || isEventFull}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 hover:border-purple-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition text-base disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400"
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                  />
                  <p className="text-xs text-gray-300 mt-2">📱 Expected format: 9876543210</p>
                </div>

                {/* Moodle ID */}
                <div>
                  <label className="block text-gray-200 mb-2 text-sm font-semibold">
                    Moodle ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="moodleId"
                    value={formData.moodleId}
                    onChange={handleChange}
                    disabled={isRegistrationNotStarted || isDeadlineOver || isEventFull}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 hover:border-purple-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition text-base disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400"
                    placeholder="Enter your Moodle ID"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">🆔 Your student Moodle login ID</p>
                </div>

                {/* Year, Division, Branch - Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  {/* Year */}
                  <div>
                    <label className="block text-gray-200 mb-2 text-sm font-semibold">
                      Year <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      disabled={isRegistrationNotStarted || isDeadlineOver || isEventFull}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 hover:border-purple-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition text-base disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer [&>option]:bg-gray-700 [&>option]:text-white [&>option]:p-2"
                      required
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Division */}
                  <div>
                    <label className="block text-gray-200 mb-2 text-sm font-semibold">
                      Division <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="division"
                      value={formData.division}
                      onChange={handleChange}
                      disabled={isRegistrationNotStarted || isDeadlineOver || isEventFull}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 hover:border-purple-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition text-base disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer [&>option]:bg-gray-800 [&>option]:text-white [&>option]:py-2"
                      required
                    >
                      <option value="" className="text-gray-400">Select Division</option>
                      {divisionOptions.map(div => (
                        <option key={div} value={div} className="text-white">{div}</option>
                      ))}
                    </select>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-gray-200 mb-2 text-sm font-semibold">
                      Branch <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      disabled={isRegistrationNotStarted || isDeadlineOver || isEventFull}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 hover:border-purple-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition text-base disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer [&>option]:bg-gray-800 [&>option]:text-white [&>option]:py-2"
                      required
                    >
                      <option value="" className="text-gray-400">Select Branch</option>
                      {branchOptions.map(branch => (
                        <option key={branch} value={branch} className="text-white">{branch}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* College - Read only */}
                <div>
                  <label className="block text-gray-200 mb-2 text-sm font-semibold">
                    College
                  </label>
                  <input
                    type="text"
                    value="APSIT - A.P. Shah Institute of Technology"
                    disabled
                    className="w-full px-4 py-3 rounded-lg bg-gray-600 text-gray-100 border-2 border-gray-500 text-base cursor-not-allowed"
                  />
                </div>

                {/* Info Box */}
                <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-blue-800 border-2 border-blue-700 rounded-lg shadow-lg">
                  <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                    <span className="text-lg mr-2">ℹ️</span>
                    <strong className="block sm:inline">No password needed!</strong> You'll login using your email, phone number, division, and branch during the event.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || isRegistrationNotStarted || isDeadlineOver || isEventFull}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-bold py-3 sm:py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base sm:text-lg shadow-lg mt-6 sm:mt-8"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>Registering...
                    </span>
                  ) : (
                    '✓ Register for Event'
                  )}
                </button>

                {/* Already registered link */}
                <p className="text-sm sm:text-base text-gray-300 text-center mt-4 sm:mt-6">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/event-login')}
                    className="text-purple-400 hover:text-purple-300 font-bold underline transition"
                  >
                    Login here →
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
