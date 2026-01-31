import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Award, Download, Calendar, CheckCircle, 
  Clock, Loader, FileText, Sparkles, X, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { certificateService } from '../../services/certificateService';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const StudentCertificates = () => {
  const { userDetails } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [myCertificates, setMyCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const certificateRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availableRes, myRes] = await Promise.all([
        certificateService.getAvailableCertificates(),
        certificateService.getMyCertificates()
      ]);

      if (availableRes.success) {
        setCertificates(availableRes.data);
      }
      if (myRes.success) {
        setMyCertificates(myRes.data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimClick = (cert) => {
    setSelectedCertificate(cert);
    setNameInput(userDetails?.name || userDetails?.studentProfile?.name || '');
    setShowClaimModal(true);
  };

  const handleClaim = async () => {
    if (!nameInput.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setClaiming(true);
    try {
      const result = await certificateService.requestCertificate(
        selectedCertificate.id,
        nameInput.trim()
      );

      if (result.success) {
        setShowClaimModal(false);
        setSelectedCertificate(null);
        setNameInput('');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Claim error:', error);
    } finally {
      setClaiming(false);
    }
  };

  const generateCertificatePDF = async (request) => {
    setDownloading(request.id);
    
    try {
      // Track download
      await certificateService.trackDownload(request.id);

      // Create certificate HTML
      const cert = request.certificate;
      const eventDate = new Date(cert.eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create an isolated iframe to avoid Tailwind's oklch colors
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1056px';
      iframe.style.height = '816px';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #0a0a0f; }
            @keyframes none {}
          </style>
        </head>
        <body>
          <div id="cert-content" style="
            width: 1056px;
            height: 816px;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0a0a0f 100%);
            padding: 30px;
            position: relative;
            font-family: 'Rajdhani', sans-serif;
            box-sizing: border-box;
            overflow: hidden;
          ">
            <!-- Circuit Pattern Background -->
            <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.08;" viewBox="0 0 1056 816">
              <defs>
                <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <circle cx="50" cy="50" r="3" fill="#00d4ff"/>
                  <line x1="50" y1="50" x2="100" y2="50" stroke="#00d4ff" stroke-width="1"/>
                  <line x1="50" y1="50" x2="50" y2="100" stroke="#00d4ff" stroke-width="1"/>
                  <line x1="50" y1="50" x2="0" y2="50" stroke="#00d4ff" stroke-width="1"/>
                  <line x1="50" y1="50" x2="50" y2="0" stroke="#00d4ff" stroke-width="1"/>
                  <circle cx="0" cy="0" r="2" fill="#00d4ff"/>
                  <circle cx="100" cy="0" r="2" fill="#00d4ff"/>
                  <circle cx="0" cy="100" r="2" fill="#00d4ff"/>
                  <circle cx="100" cy="100" r="2" fill="#00d4ff"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#circuit)"/>
            </svg>

            <!-- Glowing Corner Brackets -->
            <div style="position: absolute; top: 25px; left: 25px; width: 80px; height: 80px; border-top: 4px solid #00d4ff; border-left: 4px solid #00d4ff; box-shadow: 0 0 15px #00d4ff, inset 0 0 15px rgba(0,212,255,0.1);"></div>
            <div style="position: absolute; top: 25px; right: 25px; width: 80px; height: 80px; border-top: 4px solid #00d4ff; border-right: 4px solid #00d4ff; box-shadow: 0 0 15px #00d4ff, inset 0 0 15px rgba(0,212,255,0.1);"></div>
            <div style="position: absolute; bottom: 25px; left: 25px; width: 80px; height: 80px; border-bottom: 4px solid #00d4ff; border-left: 4px solid #00d4ff; box-shadow: 0 0 15px #00d4ff, inset 0 0 15px rgba(0,212,255,0.1);"></div>
            <div style="position: absolute; bottom: 25px; right: 25px; width: 80px; height: 80px; border-bottom: 4px solid #00d4ff; border-right: 4px solid #00d4ff; box-shadow: 0 0 15px #00d4ff, inset 0 0 15px rgba(0,212,255,0.1);"></div>

            <!-- Tech Border Lines -->
            <div style="position: absolute; top: 50px; left: 120px; right: 120px; height: 2px; background: linear-gradient(90deg, transparent, #00d4ff, transparent);"></div>
            <div style="position: absolute; bottom: 50px; left: 120px; right: 120px; height: 2px; background: linear-gradient(90deg, transparent, #00d4ff, transparent);"></div>
            <div style="position: absolute; left: 50px; top: 120px; bottom: 120px; width: 2px; background: linear-gradient(180deg, transparent, #00d4ff, transparent);"></div>
            <div style="position: absolute; right: 50px; top: 120px; bottom: 120px; width: 2px; background: linear-gradient(180deg, transparent, #00d4ff, transparent);"></div>

            <!-- Binary Code Decoration Left -->
            <div style="position: absolute; left: 70px; top: 150px; font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #00d4ff; opacity: 0.3; writing-mode: vertical-rl; text-orientation: mixed; letter-spacing: 3px;">
              01001000 01000101 01001100 01001100
            </div>
            
            <!-- Binary Code Decoration Right -->
            <div style="position: absolute; right: 70px; top: 150px; font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #00d4ff; opacity: 0.3; writing-mode: vertical-rl; text-orientation: mixed; letter-spacing: 3px;">
              01010111 01001111 01010010 01001100
            </div>

            <!-- Main Content -->
            <div style="position: relative; z-index: 10; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px;">
              
              <!-- Logo Section -->
              <div style="margin-bottom: 15px;">
                <!-- Hexagon Logo -->
                <div style="position: relative; width: 90px; height: 90px; margin: 0 auto 12px;">
                  <svg viewBox="0 0 100 100" style="width: 90px; height: 90px;">
                    <defs>
                      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#00d4ff"/>
                        <stop offset="50%" style="stop-color:#0099ff"/>
                        <stop offset="100%" style="stop-color:#6366f1"/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="url(#logoGrad)" stroke-width="3" filter="url(#glow)"/>
                    <polygon points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5" fill="rgba(0,212,255,0.1)" stroke="url(#logoGrad)" stroke-width="1"/>
                    <text x="50" y="58" text-anchor="middle" fill="#00d4ff" font-family="Orbitron, sans-serif" font-size="28" font-weight="700">&lt;/&gt;</text>
                  </svg>
                </div>
                <h1 style="
                  font-family: 'Orbitron', sans-serif;
                  color: #00d4ff;
                  font-size: 22px;
                  font-weight: 700;
                  letter-spacing: 6px;
                  margin: 0;
                  text-transform: uppercase;
                  text-shadow: 0 0 20px rgba(0,212,255,0.5);
                ">Coding Nexus</h1>
                <p style="
                  font-family: 'Share Tech Mono', monospace;
                  color: #64748b;
                  font-size: 12px;
                  letter-spacing: 4px;
                  margin: 5px 0 0 0;
                  text-transform: uppercase;
                ">// Tech Community Club</p>
              </div>

              <!-- Certificate Title -->
              <div style="margin: 15px 0;">
                <p style="
                  font-family: 'Share Tech Mono', monospace;
                  color: #64748b;
                  font-size: 11px;
                  letter-spacing: 3px;
                  margin: 0 0 5px 0;
                ">&lt;certificate type="${cert.templateType}"&gt;</p>
                <h2 style="
                  font-family: 'Orbitron', sans-serif;
                  color: #ffffff;
                  font-size: 38px;
                  font-weight: 600;
                  letter-spacing: 8px;
                  margin: 0;
                  text-transform: uppercase;
                  text-shadow: 0 0 30px rgba(255,255,255,0.3);
                ">CERTIFICATE</h2>
                <p style="
                  font-family: 'Rajdhani', sans-serif;
                  color: #a855f7;
                  font-size: 18px;
                  font-weight: 500;
                  letter-spacing: 10px;
                  margin: 5px 0 0 0;
                  text-transform: uppercase;
                ">OF ${cert.templateType === 'achievement' ? 'ACHIEVEMENT' : cert.templateType === 'completion' ? 'COMPLETION' : 'PARTICIPATION'}</p>
                <p style="
                  font-family: 'Share Tech Mono', monospace;
                  color: #64748b;
                  font-size: 11px;
                  letter-spacing: 3px;
                  margin: 5px 0 0 0;
                ">&lt;/certificate&gt;</p>
              </div>

              <!-- Recipient Section -->
              <div style="margin: 20px 0;">
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0; font-weight: 400; word-spacing: 3px; letter-spacing: 0.5px;">This is to certify that</p>
                <div style="
                  background: linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent);
                  padding: 15px 50px;
                  border-top: 1px solid rgba(0,212,255,0.3);
                  border-bottom: 1px solid rgba(0,212,255,0.3);
                  margin: 10px 0;
                ">
                  <h3 style="
                    font-family: 'Orbitron', sans-serif;
                    color: #00d4ff;
                    font-size: 32px;
                    font-weight: 600;
                    margin: 0;
                    text-shadow: 0 0 25px rgba(0,212,255,0.5);
                    letter-spacing: 3px;
                    word-spacing: 8px;
                  ">${request.nameOnCertificate}</h3>
                </div>
              </div>

              <!-- Event Section -->
              <div style="margin: 15px 0;">
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0; word-spacing: 3px; letter-spacing: 0.5px;">has successfully participated in</p>
                <h4 style="
                  font-family: 'Rajdhani', sans-serif;
                  color: #fbbf24;
                  font-size: 26px;
                  font-weight: 700;
                  margin: 8px 0;
                  text-shadow: 0 0 15px rgba(251,191,36,0.4);
                  letter-spacing: 1px;
                  word-spacing: 6px;
                ">${cert.eventName}</h4>
                ${cert.description ? `<p style="color: #64748b; font-size: 13px; margin: 5px 0; max-width: 550px;">${cert.description}</p>` : ''}
                <p style="
                  font-family: 'Share Tech Mono', monospace;
                  color: #10b981;
                  font-size: 13px;
                  margin: 12px 0 0 0;
                  word-spacing: 4px;
                  letter-spacing: 0.5px;
                ">// Event Date: ${eventDate}</p>
              </div>

              <!-- Signature Section -->
              <div style="
                display: flex;
                justify-content: space-between;
                width: 75%;
                margin-top: 30px;
              ">
                <div style="text-align: center;">
                  <div style="width: 140px; height: 2px; background: linear-gradient(90deg, transparent, #6366f1, transparent); margin-bottom: 10px;"></div>
                  <p style="font-family: 'Share Tech Mono', monospace; color: #64748b; font-size: 10px; margin: 0; letter-spacing: 2px;">DATE.ISSUED</p>
                  <p style="color: #ffffff; font-size: 13px; margin: 5px 0 0 0; font-weight: 500; word-spacing: 3px; letter-spacing: 0.5px;">${eventDate}</p>
                </div>
                <div style="text-align: center;">
                  <div style="width: 140px; height: 2px; background: linear-gradient(90deg, transparent, #6366f1, transparent); margin-bottom: 10px;"></div>
                  <p style="font-family: 'Share Tech Mono', monospace; color: #64748b; font-size: 10px; margin: 0; letter-spacing: 2px;">AUTHORIZED.BY</p>
                  <p style="color: #ffffff; font-size: 13px; margin: 5px 0 0 0; font-weight: 500; word-spacing: 4px; letter-spacing: 0.5px;">Coding Nexus Club</p>
                </div>
              </div>

              <!-- Certificate ID -->
              <div style="
                position: absolute;
                bottom: 35px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 15px;
              ">
                <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #374151);"></div>
                <p style="
                  font-family: 'Share Tech Mono', monospace;
                  color: #374151;
                  font-size: 9px;
                  letter-spacing: 3px;
                ">CERT_ID: ${request.id.slice(0, 8).toUpperCase()}</p>
                <div style="width: 60px; height: 1px; background: linear-gradient(90deg, #374151, transparent);"></div>
              </div>

              <!-- Version Tag -->
              <div style="position: absolute; bottom: 35px; right: 80px;">
                <p style="font-family: 'Share Tech Mono', monospace; color: #374151; font-size: 8px;">v2.0</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const certElement = iframeDoc.getElementById('cert-content');

      // Generate canvas
      const canvas = await html2canvas(certElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0a0f',
        windowWidth: 1056,
        windowHeight: 816
      });

      // Create PDF (landscape A4)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${cert.eventName.replace(/\s+/g, '_')}_Certificate.pdf`);

      // Cleanup
      document.body.removeChild(iframe);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const availableCertificates = certificates.filter(c => !c.requested);
  const claimedCertificates = myCertificates;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-lg shadow-lg border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold text-white">My Certificates</h1>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-amber-600/20 rounded-2xl p-6 sm:p-8 mb-8 border border-amber-500/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Certificates & Achievements</h2>
                <p className="text-amber-200/80">Claim and download your participation certificates</p>
              </div>
            </div>
          </div>
          <Sparkles className="absolute bottom-4 right-4 w-20 h-20 text-amber-500/20" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{claimedCertificates.length}</p>
                <p className="text-sm text-slate-400">Claimed</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{availableCertificates.length}</p>
                <p className="text-sm text-slate-400">Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Available ({availableCertificates.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('claimed')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'claimed'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              My Certificates ({claimedCertificates.length})
            </span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'available' ? (
          <div className="space-y-4">
            {availableCertificates.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Certificates Available</h3>
                <p className="text-slate-500">Check back later for new certificates!</p>
              </div>
            ) : (
              availableCertificates.map(cert => (
                <div
                  key={cert.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-slate-700/50 hover:border-amber-500/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30 group-hover:scale-110 transition-transform">
                        <Award className="w-8 h-8 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1" style={{ wordSpacing: '2px', letterSpacing: '0.3px' }}>{cert.eventName}</h3>
                        {cert.description && (
                          <p className="text-sm text-slate-400 mb-2" style={{ wordSpacing: '3px', letterSpacing: '0.3px' }}>{cert.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(cert.eventDate)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            cert.templateType === 'achievement' 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : cert.templateType === 'completion'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {cert.templateType.charAt(0).toUpperCase() + cert.templateType.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClaimClick(cert)}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Claim Certificate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {claimedCertificates.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Certificates Yet</h3>
                <p className="text-slate-500">Claim your first certificate from the Available tab!</p>
              </div>
            ) : (
              claimedCertificates.map(request => (
                <div
                  key={request.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1" style={{ wordSpacing: '2px', letterSpacing: '0.3px' }}>{request.certificate.eventName}</h3>
                        <p className="text-sm text-emerald-400 mb-2" style={{ wordSpacing: '2px' }}>
                          Name on certificate: <span className="font-medium">{request.nameOnCertificate}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(request.certificate.eventDate)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Download className="w-4 h-4" />
                            {request.downloadCount} downloads
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => generateCertificatePDF(request)}
                      disabled={downloading === request.id}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {downloading === request.id ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Download PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Claim Certificate</h2>
                    <p className="text-indigo-200 text-sm">Enter your details below</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Certificate Info Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedCertificate.eventName}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(selectedCertificate.eventDate)}</p>
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Name on Certificate
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition font-medium text-base"
                  autoFocus
                />
                <p className="mt-2.5 text-sm text-gray-500 flex items-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  This name will appear on your certificate. Please enter your full name as you want it to appear.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClaim}
                  disabled={claiming || !nameInput.trim()}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                  {claiming ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Claim Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;
