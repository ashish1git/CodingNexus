import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Download, RefreshCw, Calendar, MapPin, ExternalLink, X, Eye } from 'lucide-react';
import { eventService } from '../../services/eventService';
import EventCertificateDisplay from './EventCertificateDisplay';
import toast from 'react-hot-toast';

export default function EventCertificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [namePrompt, setNamePrompt] = useState(null);
  const [customName, setCustomName] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await eventService.getCertificates();
      if (response.success) {
        setCertificates(response.certificates || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const promptForName = (cert) => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCustomName(userData.name || '');
    setNamePrompt(cert);
  };

  const handleDownloadPDF = async (cert, participantName) => {
    setDownloading(cert.id);
    setNamePrompt(null);
    try {
      const jsPDF = (await import('jspdf')).default;

      const eventDate = new Date(cert.event.eventDate).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const issueDate = new Date(cert.issueDate).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const certType = cert.templateType === 'achievement' ? 'Achievement' : 'Participation';
      const venueText = cert.event.venue ? ` at ${cert.event.venue}` : '';

      // Use iframe for COMPLETE CSS isolation from Tailwind's oklch colors
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1122px;height:793px;border:none;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1122px; height: 793px; overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; }
</style></head><body>
<div id="cert" style="width:1122px;height:793px;background:#120a24;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#1a0533,#0d1b2a 50%,#1a0533);"></div>
  <div style="position:absolute;top:12px;left:12px;right:12px;bottom:12px;border:2px solid #7c3aed66;border-radius:8px;"></div>
  <div style="position:absolute;top:18px;left:18px;right:18px;bottom:18px;border:1px solid #7c3aed33;border-radius:6px;"></div>
  <div style="position:absolute;top:25px;left:25px;width:50px;height:50px;border-top:3px solid #a855f7;border-left:3px solid #a855f7;border-radius:4px 0 0 0;"></div>
  <div style="position:absolute;top:25px;right:25px;width:50px;height:50px;border-top:3px solid #a855f7;border-right:3px solid #a855f7;border-radius:0 4px 0 0;"></div>
  <div style="position:absolute;bottom:25px;left:25px;width:50px;height:50px;border-bottom:3px solid #a855f7;border-left:3px solid #a855f7;border-radius:0 0 0 4px;"></div>
  <div style="position:absolute;bottom:25px;right:25px;width:50px;height:50px;border-bottom:3px solid #a855f7;border-right:3px solid #a855f7;border-radius:0 0 4px 0;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px 80px;text-align:center;">
    <div style="font-size:14px;letter-spacing:6px;text-transform:uppercase;color:#a78bfa;margin-bottom:10px;">Coding Nexus</div>
    <div style="font-size:44px;font-weight:700;color:#ffffff;margin:10px 0;letter-spacing:2px;">CERTIFICATE</div>
    <div style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#8b5cf6;margin-bottom:30px;">of ${certType}</div>
    <div style="font-size:14px;color:#9ca3af;margin-bottom:10px;">This is to certify that</div>
    <div style="font-size:36px;font-weight:700;color:#d8b4fe;margin:5px 0 15px;font-style:italic;">${participantName}</div>
    <div style="width:300px;height:2px;background:linear-gradient(90deg,transparent,#a855f7,transparent);margin:5px auto 15px;"></div>
    <div style="font-size:15px;color:#d1d5db;max-width:600px;line-height:1.7;">
      has successfully participated in<br/>
      <span style="color:#ffffff;font-size:20px;font-weight:700;">${cert.event.title}</span><br/>
      held on ${eventDate}${venueText}
    </div>
    <div style="margin-top:40px;display:flex;justify-content:space-between;width:100%;padding:0 60px;">
      <div style="text-align:center;"><div style="width:150px;border-top:1px solid #7c3aed66;padding-top:8px;"><div style="font-size:12px;color:#9ca3af;">Date of Issue</div><div style="font-size:13px;color:#d1d5db;">${issueDate}</div></div></div>
      <div style="text-align:center;"><div style="width:150px;border-top:1px solid #7c3aed66;padding-top:8px;"><div style="font-size:12px;color:#9ca3af;">Certificate No.</div><div style="font-size:13px;color:#d1d5db;">${cert.certificateNumber}</div></div></div>
      <div style="text-align:center;"><div style="width:150px;border-top:1px solid #7c3aed66;padding-top:8px;"><div style="font-size:12px;color:#9ca3af;">Authorized By</div><div style="font-size:13px;color:#d1d5db;">Coding Nexus</div></div></div>
    </div>
  </div>
</div>
</body></html>`);
      iframeDoc.close();

      // Wait for iframe render
      await new Promise(r => setTimeout(r, 300));

      // Import html2canvas INSIDE the iframe context to avoid Tailwind CSS
      const html2canvas = (await import('html2canvas')).default;
      const certEl = iframeDoc.getElementById('cert');
      const canvas = await html2canvas(certEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1122,
        height: 793,
        windowWidth: 1122,
        windowHeight: 793,
      });

      const pdf = new jsPDF('landscape', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
      pdf.save(`Certificate_${cert.event.title.replace(/\s+/g, '_')}_${cert.certificateNumber}.pdf`);

      document.body.removeChild(iframe);
      toast.success('Certificate downloaded!');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to generate certificate PDF');
    } finally {
      setDownloading(null);
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

  // If viewing a certificate in beautiful display
  if (selectedCert) {
    return (
      <div className="relative">
        <button
          onClick={() => setSelectedCert(null)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <EventCertificateDisplay 
          certificate={selectedCert}
          onCertificateUpdate={(updatedCert) => {
            setSelectedCert(updatedCert);
            // Update the certificate in the list as well
            setCertificates(certificates.map(cert => cert.id === updatedCert.id ? updatedCert : cert));
          }}
        />
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
          <h1 className="text-lg font-bold text-white">My Certificates</h1>
          <button onClick={fetchCertificates} className="text-gray-400 hover:text-white transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {certificates.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Certificates Yet</h3>
            <p className="text-gray-400 mb-6">
              Certificates will appear here once issued by the event organizer after event completion.
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
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/40 transition"
              >
                {/* Certificate Preview Banner */}
                <div className="bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-purple-900/60 p-6 border-b border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-600/30 border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
                      <Award className="w-8 h-8 text-purple-300" />
                    </div>
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{cert.event.title}</h3>
                      <p className="text-purple-300 text-sm capitalize">{cert.templateType} Certificate</p>
                    </div>
                    {cert.verified && (
                      <span className="px-3 py-1 bg-green-900/40 text-green-300 text-xs rounded-full border border-green-600/30 flex-shrink-0">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(cert.event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                    {cert.event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {cert.event.venue}
                      </span>
                    )}
                    <span className="text-gray-500">#{cert.certificateNumber}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Certificate
                    </button>
                    <button
                      onClick={() => promptForName(cert)}
                      disabled={downloading === cert.id}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
                    >
                      {downloading === cert.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download PDF
                        </>
                      )}
                    </button>
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Online
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Name Prompt Modal */}
      {namePrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Enter Your Name</h3>
              <button
                onClick={() => setNamePrompt(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              This name will appear on the certificate PDF.
            </p>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customName.trim()) {
                  handleDownloadPDF(namePrompt, customName.trim());
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setNamePrompt(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDownloadPDF(namePrompt, customName.trim())}
                disabled={!customName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
