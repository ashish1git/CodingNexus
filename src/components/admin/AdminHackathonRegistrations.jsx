import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Users, Code, Search, Filter, TrendingUp, 
  AlertCircle, CheckCircle, User, Mail, Phone, Hash, Edit, X, FileText, Save, RefreshCw
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function AdminHackathonRegistrations() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [groupedByProblem, setGroupedByProblem] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [problemFilter, setProblemFilter] = useState('all');
  const [teamTypeFilter, setTeamTypeFilter] = useState('all');
  
  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // CSV column selection state
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'moodleId',
    'problemStatementNo',
    'teamMember1Name',
    'teamMember1Phone',
    'teamMember2Name',
    'teamMember2Phone'
  ]);

  useEffect(() => {
    if (eventId) {
      loadRegistrations();
    }
  }, [eventId]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const res = await eventService.adminGetHackathonRegistrations(eventId);
      
      if (res.success) {
        setEvent(res.event);
        setRegistrations(res.registrations || []);
        setGroupedByProblem(res.groupedByProblem || {});
        setStats(res.stats || {});
      } else {
        toast.error(res.error || 'Failed to load registrations');
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load hackathon registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (registration) => {
    setEditingRegistration(registration);
    setEditFormData({
      problemStatementNo: registration.problemStatementNo,
      teamMember1Name: registration.teamMember1Name,
      teamMember1Email: registration.teamMember1Email,
      teamMember1Phone: registration.teamMember1Phone,
      teamMember2Name: registration.teamMember2Name || '',
      teamMember2Email: registration.teamMember2Email || '',
      teamMember2Phone: registration.teamMember2Phone || '',
      additionalInfo: registration.additionalInfo || ''
    });
    setEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!editFormData.teamMember1Name || !editFormData.teamMember1Email || !editFormData.teamMember1Phone) {
      toast.error('Team Member 1 details are required');
      return;
    }

    if (!/^\d{10}$/.test(editFormData.teamMember1Phone)) {
      toast.error('Team Member 1 phone must be 10 digits');
      return;
    }

    if (editFormData.teamMember2Phone && !/^\d{10}$/.test(editFormData.teamMember2Phone)) {
      toast.error('Team Member 2 phone must be 10 digits');
      return;
    }

    try {
      setSaving(true);
      const res = await eventService.adminUpdateHackathonRegistration(
        eventId,
        editingRegistration.id,
        editFormData
      );

      if (res.success) {
        toast.success('Registration updated successfully');
        setEditModal(false);
        setEditingRegistration(null);
        loadRegistrations(); // Reload data
      } else {
        toast.error(res.error || 'Failed to update registration');
      }
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCSV = async () => {
    setShowColumnModal(true);
  };

  const handleConfirmDownload = async () => {
    try {
      setDownloading(true);
      setShowColumnModal(false);
      
      const blob = await eventService.adminDownloadHackathonCSV(eventId, selectedColumns);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hackathon_registrations_${event?.title?.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV downloaded successfully');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  const toggleColumn = (column) => {
    setSelectedColumns(prev => 
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns([
      'serialNo',
      'registrationDate',
      'participantName',
      'participantEmail',
      'participantPhone',
      'moodleId',
      'year',
      'branch',
      'division',
      'problemStatementNo',
      'teamType',
      'teamMember1Name',
      'teamMember1Email',
      'teamMember1Phone',
      'teamMember2Name',
      'teamMember2Email',
      'teamMember2Phone',
      'additionalInfo'
    ]);
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleDownloadCSVOld = async () => {
    try {
      setDownloading(true);
      const blob = await eventService.adminDownloadHackathonCSV(eventId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hackathon_registrations_${event?.title?.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV downloaded successfully');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchSearch = !searchQuery || 
      reg.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.teamMember1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.teamMember2Name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchProblem = problemFilter === 'all' || reg.problemStatementNo === parseInt(problemFilter);
    const matchTeamType = teamTypeFilter === 'all' || reg.teamType === teamTypeFilter;
    
    return matchSearch && matchProblem && matchTeamType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-6 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xl border border-purple-400/20">
          <button
            onClick={() => navigate('/admin/events')}
            className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-all duration-200 text-sm sm:text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Event Management</span>
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-sm shadow-lg">
                <img src="/favicon.svg" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Hackathon Registrations</h1>
                <p className="text-white/90 text-sm sm:text-base">{event?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadRegistrations}
                disabled={loading}
                className="bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base backdrop-blur-sm border border-white/20"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={downloading || registrations.length === 0}
                className="bg-white text-purple-600 px-5 sm:px-6 py-3 rounded-xl font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-5 h-5" />
                {downloading ? 'Downloading...' : 'Download CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-400/20">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-7 h-7 text-white" />
              <TrendingUp className="w-5 h-5 text-white/70" />
            </div>
            <p className="text-4xl font-bold text-white mb-1.5">{stats.total || 0}</p>
            <p className="text-xs text-white/90 uppercase font-bold tracking-wider">Total</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-blue-400/20">
            <div className="flex items-center justify-between mb-3">
              <User className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-white mb-1.5">{stats.individual || 0}</p>
            <p className="text-xs text-white/90 uppercase font-bold tracking-wider">Individual</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-400/20">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-white mb-1.5">{stats.team || 0}</p>
            <p className="text-xs text-white/90 uppercase font-bold tracking-wider">Teams</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-yellow-400/20">
            <div className="flex items-center justify-between mb-3">
              <Hash className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-white mb-1.5">{stats.problem1 || 0}</p>
            <p className="text-xs text-white/90 uppercase font-bold tracking-wider">Problem 1</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-pink-400/20">
            <div className="flex items-center justify-between mb-3">
              <Hash className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-white mb-1.5">{stats.problem2 || 0}</p>
            <p className="text-xs text-white/90 uppercase font-bold tracking-wider">Problem 2</p>
          </div>
          
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-teal-400/20">
            <div className="flex items-center justify-between mb-3">
              <Hash className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-white mb-1.5">{stats.problem3 || 0}</p>
            <p className="text-xs text-white/90 uppercase font-bold tracking-wider">Problem 3</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-6 mb-6 border-2 border-gray-700 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                Search Registrations
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-500/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-400" />
                Problem Statement
              </label>
              <select
                value={problemFilter}
                onChange={(e) => setProblemFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-500/50"
              >
                <option value="all" className="bg-gray-800">All Problems</option>
                <option value="1" className="bg-gray-800">Problem 1</option>
                <option value="2" className="bg-gray-800">Problem 2</option>
                <option value="3" className="bg-gray-800">Problem 3</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                <Filter className="w-5 h-5 text-green-400" />
                Team Type
              </label>
              <select
                value={teamTypeFilter}
                onChange={(e) => setTeamTypeFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 cursor-pointer hover:border-green-500/50"
              >
                <option value="all" className="bg-gray-800">All Types</option>
                <option value="individual" className="bg-gray-800">Individual</option>
                <option value="team" className="bg-gray-800">Team</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-12 border-2 border-gray-700 text-center shadow-lg">
            <AlertCircle className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <p className="text-gray-300 text-xl font-semibold mb-2">No registrations found</p>
            <p className="text-gray-500 text-sm">
              {searchQuery || problemFilter !== 'all' || teamTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No one has registered yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                Showing {filteredRegistrations.length} of {registrations.length} Registrations
              </h2>
            </div>

            {filteredRegistrations.map((reg, index) => (
              <div key={reg.id} className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-6 border-2 border-gray-700 hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl">
                {/* Top Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 pb-5 border-b border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{reg.participant.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mt-1">
                        <span className="flex items-center gap-1.5 bg-gray-700/50 px-2.5 py-1 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-400" />
                          {reg.participant.email}
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-700/50 px-2.5 py-1 rounded-lg">
                          <Phone className="w-4 h-4 text-green-400" />
                          {reg.participant.phone}
                        </span>
                        {reg.participant.moodleId && (
                          <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/40">
                            {reg.participant.moodleId}
                          </span>
                        )}
                      </div>
                      {(reg.participant.year || reg.participant.branch || reg.participant.division) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {reg.participant.year && (
                            <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-lg text-xs font-bold border border-purple-500/40">
                              {reg.participant.year}
                            </span>
                          )}
                          {reg.participant.branch && (
                            <span className="px-3 py-1 bg-pink-500/30 text-pink-300 rounded-lg text-xs font-bold border border-pink-500/40">
                              {reg.participant.branch}
                            </span>
                          )}
                          {reg.participant.division && (
                            <span className="px-3 py-1 bg-teal-500/30 text-teal-300 rounded-lg text-xs font-bold border border-teal-500/40">
                              Div {reg.participant.division}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleEdit(reg)}
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <div className="flex gap-2">
                      <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/10 border-2 border-purple-500/40 rounded-xl px-4 py-2 text-center shadow-md">
                        <p className="text-purple-300 text-xs font-bold mb-0.5 tracking-wider">PROBLEM</p>
                        <p className="text-white text-xl font-bold">#{reg.problemStatementNo}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/10 border-2 border-blue-500/40 rounded-xl px-4 py-2 text-center shadow-md">
                        <p className="text-blue-300 text-xs font-bold mb-0.5 tracking-wider">TYPE</p>
                        <p className="text-white text-sm font-bold capitalize">{reg.teamType}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Team Member 1 */}
                  <div className="bg-gradient-to-r from-purple-500/15 to-purple-600/5 border-2 border-purple-500/30 rounded-xl p-5 shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-purple-300" />
                      <h4 className="text-purple-300 text-sm font-bold uppercase tracking-wider">Team Member 1</h4>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="bg-gray-900/30 rounded-lg p-2.5">
                        <span className="text-gray-400 font-semibold block mb-0.5 text-xs">Name</span>
                        <span className="text-white font-medium">{reg.teamMember1Name}</span>
                      </div>
                      <div className="bg-gray-900/30 rounded-lg p-2.5">
                        <span className="text-gray-400 font-semibold block mb-0.5 text-xs">Email</span>
                        <span className="text-white font-medium break-all">{reg.teamMember1Email}</span>
                      </div>
                      <div className="bg-gray-900/30 rounded-lg p-2.5">
                        <span className="text-gray-400 font-semibold block mb-0.5 text-xs">Phone</span>
                        <span className="text-white font-medium">{reg.teamMember1Phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Member 2 */}
                  {reg.teamType === 'team' && reg.teamMember2Name ? (
                    <div className="bg-gradient-to-r from-pink-500/15 to-pink-600/5 border-2 border-pink-500/30 rounded-xl p-5 shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-pink-300" />
                        <h4 className="text-pink-300 text-sm font-bold uppercase tracking-wider">Team Member 2</h4>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        <div className="bg-gray-900/30 rounded-lg p-2.5">
                          <span className="text-gray-400 font-semibold block mb-0.5 text-xs">Name</span>
                          <span className="text-white font-medium">{reg.teamMember2Name}</span>
                        </div>
                        <div className="bg-gray-900/30 rounded-lg p-2.5">
                          <span className="text-gray-400 font-semibold block mb-0.5 text-xs">Email</span>
                          <span className="text-white font-medium break-all">{reg.teamMember2Email}</span>
                        </div>
                        <div className="bg-gray-900/30 rounded-lg p-2.5">
                          <span className="text-gray-400 font-semibold block mb-0.5 text-xs">Phone</span>
                          <span className="text-white font-medium">{reg.teamMember2Phone}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-700/30 to-gray-600/10 border-2 border-gray-600/40 rounded-xl p-5 flex items-center justify-center shadow-md">
                      <div className="text-center">
                        <User className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-semibold">Individual Participation</p>
                        <p className="text-gray-500 text-xs mt-1">No second team member</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {reg.additionalInfo && (
                  <div className="mt-5 bg-gradient-to-r from-gray-700/30 to-gray-600/10 border border-gray-600 rounded-xl p-4 shadow-sm">
                    <p className="text-gray-300 text-xs font-bold uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      Additional Information
                    </p>
                    <p className="text-white text-sm leading-relaxed">{reg.additionalInfo}</p>
                  </div>
                )}

                {/* Registration Date */}
                <div className="mt-5 pt-4 border-t border-gray-700 text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Registered on {new Date(reg.registrationDate).toLocaleString('en-IN', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editModal && editingRegistration && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border-2 border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <Edit className="w-6 h-6 text-yellow-400" />
                    Edit Registration
                  </h2>
                  <p className="text-sm text-gray-400">Participant: {editingRegistration.participant.name}</p>
                </div>
                <button
                  onClick={() => {
                    setEditModal(false);
                    setEditingRegistration(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-6">
                {/* Problem Statement */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
                  <label className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>Problem Statement Number <span className="text-red-400">*</span></span>
                  </label>
                  <select
                    name="problemStatementNo"
                    value={editFormData.problemStatementNo}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-500/50"
                  >
                    <option value="1">Problem Statement 1</option>
                    <option value="2">Problem Statement 2</option>
                    <option value="3">Problem Statement 3</option>
                  </select>
                </div>

                {/* Team Member 1 */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-2 border-purple-500/30 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Team Member 1 <span className="text-red-400 text-sm">(Required)</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="teamMember1Name"
                        value={editFormData.teamMember1Name}
                        onChange={handleEditFormChange}
                        required
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="teamMember1Email"
                        value={editFormData.teamMember1Email}
                        onChange={handleEditFormChange}
                        required
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        name="teamMember1Phone"
                        value={editFormData.teamMember1Phone}
                        onChange={handleEditFormChange}
                        required
                        pattern="\\d{10}"
                        maxLength="10"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Member 2 */}
                <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-2 border-pink-500/30 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-bold text-pink-300 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Team Member 2 <span className="text-gray-400 text-sm">(Optional)</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="teamMember2Name"
                        value={editFormData.teamMember2Name}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
                      <input
                        type="email"
                        name="teamMember2Email"
                        value={editFormData.teamMember2Email}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="teamMember2Phone"
                        value={editFormData.teamMember2Phone}
                        onChange={handleEditFormChange}
                        pattern="\\d{10}"
                        maxLength="10"
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Additional Information</label>
                  <textarea
                    name="additionalInfo"
                    value={editFormData.additionalInfo}
                    onChange={handleEditFormChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3.5 rounded-xl font-bold hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditModal(false);
                      setEditingRegistration(null);
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

        {/* Column Selection Modal */}
        {showColumnModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border-2 border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <Download className="w-6 h-6 text-blue-400" />
                    Select Columns for CSV
                  </h2>
                  <p className="text-sm text-gray-400">Choose which columns to include in the export</p>
                </div>
                <button
                  onClick={() => setShowColumnModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={selectAllColumns}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all text-sm"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllColumns}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all text-sm"
                  >
                    Deselect All
                  </button>
                  <div className="ml-auto text-sm text-gray-400 flex items-center">
                    Selected: <span className="ml-2 text-white font-bold">{selectedColumns.length}/18</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'serialNo', label: 'Serial Number' },
                    { key: 'registrationDate', label: 'Registration Date' },
                    { key: 'participantName', label: 'Participant Name' },
                    { key: 'participantEmail', label: 'Participant Email' },
                    { key: 'participantPhone', label: 'Participant Phone' },
                    { key: 'moodleId', label: 'Moodle ID' },
                    { key: 'year', label: 'Year' },
                    { key: 'branch', label: 'Branch' },
                    { key: 'division', label: 'Division' },
                    { key: 'problemStatementNo', label: 'Problem Statement' },
                    { key: 'teamType', label: 'Team Type' },
                    { key: 'teamMember1Name', label: 'Team Member 1 Name' },
                    { key: 'teamMember1Email', label: 'Team Member 1 Email' },
                    { key: 'teamMember1Phone', label: 'Team Member 1 Phone' },
                    { key: 'teamMember2Name', label: 'Team Member 2 Name' },
                    { key: 'teamMember2Email', label: 'Team Member 2 Email' },
                    { key: 'teamMember2Phone', label: 'Team Member 2 Phone' },
                    { key: 'additionalInfo', label: 'Additional Information' }
                  ].map((column) => (
                    <label
                      key={column.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedColumns.includes(column.key)
                          ? 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30'
                          : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                        className="w-5 h-5 rounded accent-purple-600"
                      />
                      <span className="text-white font-medium text-sm">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleConfirmDownload}
                  disabled={selectedColumns.length === 0 || downloading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download CSV ({selectedColumns.length} columns)
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowColumnModal(false)}
                  className="px-6 py-3.5 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
