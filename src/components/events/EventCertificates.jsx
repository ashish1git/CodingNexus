import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Download, RefreshCw, Calendar, MapPin, ShieldCheck, ShieldX, X, User } from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function EventCertificates() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Name prompt modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching fresh registrations from server...');
      const response = await eventService.getMyRegistrations();
      if (response.success) {
        console.log('✅ API Response:', JSON.stringify(response.registrations.map(r => ({
          eventId: r.eventId,
          title: r.event?.title,
          certificateIssued: r.certificateIssued,
          certificateName: r.certificateName,
          certificateApprovedByAdmin: r.certificateApprovedByAdmin
        })), null, 2));
        setRegistrations(response.registrations || []);
        setLastRefresh(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load certificate data');
    } finally {
      setLoading(false);
    }
  };

  // Force hard refresh
  const forceRefresh = async () => {
    toast.loading('Refreshing data...');
    await fetchRegistrations();
    toast.dismiss();
    toast.success('Data refreshed!');
  };

  // Handle download click - always refresh first to get latest state
  const handleDownloadClick = async (registration) => {
    console.log('📄 Certificate download clicked:', {
      eventId: registration.eventId,
      certificateIssued: registration.certificateIssued,
      certificateName: registration.certificateName,
      participantName: registration.participantName
    });
    
    // Always refresh to get latest state (in case admin reset the certificate)
    setDownloading(registration.eventId);
    try {
      const response = await eventService.getMyRegistrations();
      if (response.success) {
        setRegistrations(response.registrations || []);
        // Find the updated registration
        const updatedReg = response.registrations.find(r => r.eventId === registration.eventId);
        if (!updatedReg) {
          toast.error('Registration not found');
          setDownloading(null);
          return;
        }
        
        console.log('📄 Updated registration state:', {
          certificateIssued: updatedReg.certificateIssued,
          certificateName: updatedReg.certificateName
        });
        
        if (updatedReg.certificateIssued) {
          // Certificate exists - download directly with locked name
          const blob = await eventService.downloadCertificate(updatedReg.eventId, null);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Certificate_${updatedReg.event.title.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('Certificate downloaded!');
          setDownloading(null);
        } else {
          // No certificate - show modal for name input
          setDownloading(null);
          setSelectedRegistration(updatedReg);
          const nameToDisplay = updatedReg.participantName || updatedReg.name || '';
          setCustomName(nameToDisplay);
          setShowNameModal(true);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to check certificate status');
      setDownloading(null);
    }
  };

  // Close the name prompt modal
  const handleCloseModal = () => {
    setShowNameModal(false);
    setSelectedRegistration(null);
    setCustomName('');
  };

  // Confirm and download with the entered name (first-time only)
  const handleConfirmDownload = async () => {
    if (!selectedRegistration) return;
    
    const nameToUse = customName.trim();
    
    console.log('📥 First-time certificate download:', {
      eventId: selectedRegistration.eventId,
      nameToUse
    });
    
    if (!nameToUse) {
      toast.error('Please enter a name for the certificate');
      return;
    }

    setShowNameModal(false);
    setDownloading(selectedRegistration.eventId);
    
    try {
      const blob = await eventService.downloadCertificate(
        selectedRegistration.eventId, 
        nameToUse
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${selectedRegistration.event.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded! Name is now locked.');
      
      // Refresh to update the UI with certificate status
      await fetchRegistrations();
    } catch (error) {
      console.error('Download error:', error);
      if (error?.response?.status === 403) {
        toast.error('Not eligible for this certificate');
      } else {
        toast.error('Failed to download certificate');
      }
    } finally {
      setDownloading(null);
      setSelectedRegistration(null);
      setCustomName('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black event-dark-theme">
      {/* Header */}
      <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/event-dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Back to Dashboard</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">My Certificates</h1>
            {lastRefresh && <span className="text-xs text-gray-500">Last updated: {lastRefresh}</span>}
          </div>
          <button 
            onClick={forceRefresh} 
            className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
            title="Refresh data from server"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Refresh</span>
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {registrations.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
            <p className="text-gray-400 mb-6">
              Register for events and attend quizzes to earn certificates.
            </p>
            <button
              onClick={() => navigate('/event-dashboard')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {registrations.map(reg => (
              <div
                key={reg.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/40 transition"
              >
                {/* Event Banner */}
                <div className={`p-6 border-b border-gray-700 ${
                  reg.eligible 
                    ? 'bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-purple-900/60' 
                    : 'bg-gradient-to-r from-gray-800/60 via-gray-900/40 to-gray-800/60'
                }`}>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                      reg.eligible 
                        ? 'bg-purple-600/30 border-2 border-purple-500' 
                        : 'bg-gray-700/30 border-2 border-gray-600'
                    }`}>
                      <Award className={`w-8 h-8 ${reg.eligible ? 'text-purple-300' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{reg.event.title}</h3>
                      <p className="text-sm capitalize text-gray-400">{reg.event.eventType}</p>
                    </div>
                    {reg.eligible ? (
                      <span className="px-3 py-1 bg-green-900/40 text-green-300 text-xs rounded-full border border-green-600/30 flex-shrink-0 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Eligible
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-900/30 text-red-300 text-xs rounded-full border border-red-600/30 flex-shrink-0 flex items-center gap-1">
                        <ShieldX className="w-3 h-3" /> Not Eligible
                      </span>
                    )}
                  </div>
                </div>

                {/* Registration Details */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(reg.event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                    {reg.event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {reg.event.venue}
                      </span>
                    )}
                  </div>

                  {/* Eligibility Status */}
                  <div className="flex flex-wrap gap-3 mb-4 text-xs">
                    <span className={`px-2 py-1 rounded ${reg.quizAttended ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      Quiz: {reg.quizAttended ? '✓ Attended' : '✗ Not Attended'}
                    </span>
                    <span className={`px-2 py-1 rounded ${reg.certificateApprovedByAdmin ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      Admin: {reg.certificateApprovedByAdmin ? '✓ Approved' : '– Pending'}
                    </span>
                    <span className={`px-2 py-1 rounded ${reg.certificateIssued ? 'bg-blue-900/30 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>
                      Certificate: {reg.certificateIssued ? '✓ Issued' : '✗ Not Issued'}
                    </span>
                    <span className={`px-2 py-1 rounded ${reg.attendanceMarked ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      Attendance: {reg.attendanceMarked ? '✓ Marked' : '✗ Not Marked'}
                    </span>
                  </div>

                  {/* Download Button */}
                  {reg.eligible ? (
                    <div className="space-y-2">
                      {reg.certificateIssued && (
                        // Show locked name info
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-600/30 rounded-lg">
                          <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-blue-300 text-sm">
                            Name locked: <span className="text-white font-medium">{reg.certificateName || reg.participantName || 'N/A'}</span>
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDownloadClick(reg)}
                        disabled={downloading === reg.eventId}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
                      >
                        {downloading === reg.eventId ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            {reg.certificateIssued ? 'Re-download Certificate' : 'Download Certificate'}
                          </>
                        )}
                      </button>
                      {reg.certificateIssued && (
                        <p className="text-xs text-gray-500 text-center">
                          Wrong name? Contact admin to correct and re-issue.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full text-center px-5 py-3 bg-gray-700/50 text-gray-500 rounded-lg text-sm">
                      Complete the quiz or get admin approval to download your certificate
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Name Prompt Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Enter Certificate Name
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-400 text-sm mb-4">
                This name will appear on your certificate. <span className="text-yellow-400 font-medium">You can only set this once</span> - after download, the name will be locked.
              </p>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmDownload();
                  if (e.key === 'Escape') handleCloseModal();
                }}
              />
              <p className="text-gray-500 text-xs mt-2">
                Event: {selectedRegistration?.event?.title}
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-700">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                disabled={!customName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download &amp; Lock Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
