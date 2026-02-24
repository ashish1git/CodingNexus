import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, FileText, Send, Trash2, ArrowLeft, CheckCircle, AlertCircle, Code, Edit, Calendar } from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function HackathonRegistration() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    problemStatementNo: '',
    teamMember1Name: '',
    teamMember1Email: '',
    teamMember1Phone: '',
    teamMember2Name: '',
    teamMember2Email: '',
    teamMember2Phone: '',
    additionalInfo: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      toast.error('Please login to continue');
      navigate('/event-login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.role !== 'event_guest') {
      toast.error('This is for event participants only');
      navigate('/login');
      return;
    }

    setUser(parsedUser);
    await loadData(parsedUser);
    setLoading(false);
  };

  const loadData = async (userData) => {
    try {
      // Filter only hackathon events from user's REGISTERED events
      const hackathonEvents = (userData.activeEvents || []).filter(event => event.eventType === 'hackathon');
      setActiveEvents(hackathonEvents);

      // Load hackathon registrations
      const res = await eventService.getHackathonRegistrations();
      if (res.success) {
        setRegistrations(res.registrations || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load hackathon data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterClick = async (event) => {
    setSelectedEvent(event);
    
    // Check if registration already exists for this event
    const existingReg = registrations.find(r => r.eventId === event.id);
    
    if (existingReg) {
      // Pre-fill form with existing data
      setFormData({
        problemStatementNo: existingReg.problemStatementNo.toString(),
        teamMember1Name: existingReg.teamMember1Name,
        teamMember1Email: existingReg.teamMember1Email,
        teamMember1Phone: existingReg.teamMember1Phone,
        teamMember2Name: existingReg.teamMember2Name || '',
        teamMember2Email: existingReg.teamMember2Email || '',
        teamMember2Phone: existingReg.teamMember2Phone || '',
        additionalInfo: existingReg.additionalInfo || ''
      });
      toast.info('Editing existing registration');
    } else {
      // Reset form for new registration
      setFormData({
        problemStatementNo: '',
        teamMember1Name: '',
        teamMember1Email: '',
        teamMember1Phone: '',
        teamMember2Name: '',
        teamMember2Email: '',
        teamMember2Phone: '',
        additionalInfo: ''
      });
    }
    
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.problemStatementNo || !formData.teamMember1Name || !formData.teamMember1Email || !formData.teamMember1Phone) {
      toast.error('Please fill all required fields for Team Member 1');
      return;
    }

    // If any team member 2 field is filled, all must be filled
    const hasTeamMember2 = formData.teamMember2Name || formData.teamMember2Email || formData.teamMember2Phone;
    if (hasTeamMember2 && (!formData.teamMember2Name || !formData.teamMember2Email || !formData.teamMember2Phone)) {
      toast.error('Please fill all fields for Team Member 2 or leave all blank for individual participation');
      return;
    }

    setSubmitting(true);

    try {
      const res = await eventService.submitHackathonRegistration(selectedEvent.id, formData);
      
      if (res.success) {
        toast.success(res.message || 'Hackathon registration submitted successfully');
        
        // Reload registrations
        const regsRes = await eventService.getHackathonRegistrations();
        if (regsRes.success) {
          setRegistrations(regsRes.registrations || []);
        }
        
        setShowForm(false);
        setSelectedEvent(null);
        setFormData({
          problemStatementNo: '',
          teamMember1Name: '',
          teamMember1Email: '',
          teamMember1Phone: '',
          teamMember2Name: '',
          teamMember2Email: '',
          teamMember2Phone: '',
          additionalInfo: ''
        });
      } else {
        toast.error(res.error || 'Failed to submit registration');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this hackathon registration?')) {
      return;
    }

    try {
      const res = await eventService.deleteHackathonRegistration(eventId);
      
      if (res.success) {
        toast.success('Registration deleted successfully');
        
        // Reload registrations
        const regsRes = await eventService.getHackathonRegistrations();
        if (regsRes.success) {
          setRegistrations(regsRes.registrations || []);
        }
      } else {
        toast.error(res.error || 'Failed to delete registration');
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Failed to delete registration');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl border border-purple-400/20">
          <button
            onClick={() => navigate('/event-dashboard')}
            className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-all duration-200 text-sm sm:text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-sm shadow-lg">
              <img src="/favicon.svg" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Hackathon Registrations</h1>
              <p className="text-white/90 text-sm sm:text-base">Register your team for hackathon problem statements</p>
            </div>
          </div>
        </div>

        {/* Form Dialog */}
        {showForm && selectedEvent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    Register for {selectedEvent.title}
                  </h2>
                  <p className="text-sm text-gray-400">Fill in your hackathon details</p>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Problem Statement Selection */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
                  <label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>Problem Statement Number <span className="text-red-400">*</span></span>
                  </label>
                  <select
                    name="problemStatementNo"
                    value={formData.problemStatementNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-500/50 text-base"
                  >
                    <option value="" className="bg-gray-800">Select Problem Statement</option>
                    <option value="1" className="bg-gray-800">Problem Statement 1</option>
                    <option value="2" className="bg-gray-800">Problem Statement 2</option>
                    <option value="3" className="bg-gray-800">Problem Statement 3</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">Choose one problem statement to work on</p>
                </div>

                {/* Team Member 1 (Required) */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-2 border-purple-500/30 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-bold text-purple-300 mb-1 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Member 1 <span className="text-red-400 text-sm">(Required)</span>
                  </h3>
                  <p className="text-xs text-purple-400/70 mb-4">Primary team member details</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="teamMember1Name"
                        value={formData.teamMember1Name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter full name"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="teamMember1Email"
                        value={formData.teamMember1Email}
                        onChange={handleInputChange}
                        required
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Phone Number <span className="text-red-400">*</span> <span className="text-xs text-gray-500">(10 digits)</span>
                      </label>
                      <input
                        type="tel"
                        name="teamMember1Phone"
                        value={formData.teamMember1Phone}
                        onChange={handleInputChange}
                        required
                        placeholder="9876543210"
                        pattern="\d{10}"
                        maxLength="10"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Member 2 (Optional) */}
                <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-2 border-pink-500/30 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-bold text-pink-300 mb-1 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Team Member 2 <span className="text-gray-400 text-sm">(Optional)</span>
                  </h3>
                  <p className="text-xs text-pink-400/70 mb-4">Leave blank for individual participation, or add partner for team mode</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="teamMember2Name"
                        value={formData.teamMember2Name}
                        onChange={handleInputChange}
                        placeholder="Enter full name (optional)"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:border-pink-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="teamMember2Email"
                        value={formData.teamMember2Email}
                        onChange={handleInputChange}
                        placeholder="email@example.com (optional)"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:border-pink-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Phone Number <span className="text-xs text-gray-500">(10 digits)</span>
                      </label>
                      <input
                        type="tel"
                        name="teamMember2Phone"
                        value={formData.teamMember2Phone}
                        onChange={handleInputChange}
                        placeholder="9876543210 (optional)"
                        pattern="\d{10}"
                        maxLength="10"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:border-pink-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Additional Information <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any additional notes, requirements, or special requests..."
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none hover:border-purple-500/50"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Registration
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedEvent(null);
                    }}
                    className="px-6 py-3.5 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* My Registrations */}
        {registrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle className="w-7 h-7 text-green-400" />
              <span>My Hackathon Registrations</span>
            </h2>
            <div className="space-y-5">
              {registrations.map((reg) => (
                <div key={reg.id} className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-6 border-2 border-gray-700 hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        {reg.event.title}
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full font-semibold">REGISTERED</span>
                      </h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Registered on {new Date(reg.registrationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleRegisterClick(reg.event)}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-600 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(reg.eventId)}
                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/5 border-2 border-purple-500/30 rounded-xl p-4 shadow-md">
                      <p className="text-purple-300 text-sm font-bold mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Problem Statement
                      </p>
                      <p className="text-white text-3xl font-bold">#{reg.problemStatementNo}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/5 border-2 border-blue-500/30 rounded-xl p-4 shadow-md">
                      <p className="text-blue-300 text-sm font-bold mb-2 flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Team Type
                      </p>
                      <p className="text-white text-xl font-bold capitalize">{reg.teamType}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/15 to-green-600/5 border-2 border-green-500/30 rounded-xl p-4 shadow-md">
                      <p className="text-green-300 text-sm font-bold mb-2 flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4" />
                        Team Members
                      </p>
                      <p className="text-white text-xl font-bold">{reg.teamType === 'team' ? '2' : '1'} Member{reg.teamType === 'team' ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-4 shadow-sm">
                      <p className="text-purple-300 text-xs font-bold mb-3 flex items-center gap-1.5  tracking-wider">
                        <Users className="w-4 h-4" />
                        TEAM MEMBER 1
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-900/30 rounded-lg p-2.5">
                          <span className="text-gray-400 text-xs block mb-1">Name</span>
                          <span className="text-white font-semibold">{reg.teamMember1Name}</span>
                        </div>
                        <div className="bg-gray-900/30 rounded-lg p-2.5">
                          <span className="text-gray-400 text-xs block mb-1">Email</span>
                          <span className="text-white font-semibold break-all">{reg.teamMember1Email}</span>
                        </div>
                        <div className="bg-gray-900/30 rounded-lg p-2.5">
                          <span className="text-gray-400 text-xs block mb-1">Phone</span>
                          <span className="text-white font-semibold">{reg.teamMember1Phone}</span>
                        </div>
                      </div>
                    </div>

                    {reg.teamType === 'team' && reg.teamMember2Name && (
                      <div className="bg-gradient-to-r from-pink-500/10 to-pink-600/5 border border-pink-500/30 rounded-xl p-4 shadow-sm">
                        <p className="text-pink-300 text-xs font-bold mb-3 flex items-center gap-1.5 tracking-wider">
                          <UserPlus className="w-4 h-4" />
                          TEAM MEMBER 2
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="bg-gray-900/30 rounded-lg p-2.5">
                            <span className="text-gray-400 text-xs block mb-1">Name</span>
                            <span className="text-white font-semibold">{reg.teamMember2Name}</span>
                          </div>
                          <div className="bg-gray-900/30 rounded-lg p-2.5">
                            <span className="text-gray-400 text-xs block mb-1">Email</span>
                            <span className="text-white font-semibold break-all">{reg.teamMember2Email}</span>
                          </div>
                          <div className="bg-gray-900/30 rounded-lg p-2.5">
                            <span className="text-gray-400 text-xs block mb-1">Phone</span>
                            <span className="text-white font-semibold">{reg.teamMember2Phone}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {reg.additionalInfo && (
                      <div className="bg-gradient-to-r from-gray-700/30 to-gray-600/10 border border-gray-600 rounded-xl p-4 shadow-sm">
                        <p className="text-gray-300 text-xs font-bold mb-2 flex items-center gap-1.5 tracking-wider">
                          <FileText className="w-4 h-4" />
                          ADDITIONAL INFORMATION
                        </p>
                        <p className="text-white text-sm leading-relaxed">{reg.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Hackathons */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-yellow-400" />
            <span>Available Hackathons</span>
          </h2>

          {activeEvents.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-12 border-2 border-gray-700 text-center shadow-lg">
              <Code className="w-20 h-20 text-gray-600 mx-auto mb-6" />
              <p className="text-gray-300 text-xl font-semibold mb-2">No hackathon events available</p>
              <p className="text-gray-500 text-sm">Check back later for upcoming hackathons</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeEvents.map((event) => {
                const hasRegistration = registrations.some(r => r.eventId === event.id);
                return (
                  <div key={event.id} className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl overflow-hidden border-2 border-gray-700 hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02]">
                    {event.posterUrl && (
                      <div className="aspect-video bg-gradient-to-br from-black to-gray-900 relative overflow-hidden">
                        <img
                          src={event.posterUrl}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3">{event.title}</h3>
                      {event.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-5 pb-4 border-b border-gray-700">
                        <span className="flex items-center gap-1.5 bg-gray-700/50 px-3 py-1.5 rounded-lg">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1.5 bg-gray-700/50 px-3 py-1.5 rounded-lg">
                            📍 {event.venue}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRegisterClick(event)}
                        className={`w-full px-5 py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${
                          hasRegistration
                            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                            : 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                        }`}
                      >
                        {hasRegistration ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Edit Registration
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            Register Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
