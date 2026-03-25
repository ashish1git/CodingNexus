import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Phone, Search, Trash2, Users, Github, Linkedin, Globe, Code, Target, Heart, Calendar, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { teamApplicationService } from '../../services/teamApplicationService';

const TeamApplicationsManager = () => {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await teamApplicationService.getAllApplications();
      if (response.success) {
        setApplications(response.applications || []);
      } else {
        toast.error(response.error || 'Failed to fetch applications');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) {
      return applications;
    }

    const query = searchTerm.toLowerCase();
    return applications.filter((item) => (
      (item.fullName || item.name)?.toLowerCase().includes(query)
      || item.email?.toLowerCase().includes(query)
      || item.phoneNumber?.toLowerCase().includes(query)
      || item.branch?.toLowerCase().includes(query)
      || item.githubProfile?.toLowerCase().includes(query)
      || item.classYear?.toLowerCase().includes(query)
      || item.division?.toLowerCase().includes(query)
      || item.moodleId?.toLowerCase().includes(query)
      || item.preferredLanguage?.toLowerCase().includes(query)
      || item.interestedDomain?.toLowerCase().includes(query)
    ));
  }, [applications, searchTerm]);

  const copyToClipboard = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  const deleteApplication = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the application from ${name}? This action cannot be undone.`)) {
      try {
        const response = await teamApplicationService.deleteApplication(id);
        if (response.success) {
          toast.success('Application deleted successfully');
          loadApplications();
        } else {
          toast.error(response.error || 'Failed to delete application');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete application');
      }
    }
  };

  const exportCsv = () => {
    const headers = [
      'Full Name', 'Branch', 'Year', 'Department', 'Email', 'Phone',
      'GitHub', 'LinkedIn', 'Portfolio', 'Resume Link',
      'Technical Skills', 'Technical Proficiency', 'Preferred Language', 'Practice DSA', 'DSA Platforms', 'Problem Solving Level',
      'Has Projects', 'Project Links', 'Proudest Project',
      'Why Join', 'Technical Learning', 'Hours Per Week',
      'Teamwork Committed', 'Technical Task Willing', 'Offline Available', 'Interested Domain',
      'Additional Info', 'Declaration Agreed', 'Applied At'
    ];
    
    const rows = filteredApplications.map((item) => [
      item.fullName || item.name || '',
      item.branch || '',
      item.year || '',
      item.department || '',
      item.email || '',
      item.phoneNumber || '',
      item.githubProfile || '',
      item.linkedinProfile || '',
      item.portfolioWebsite || '',
      item.resumeLink || '',
      Array.isArray(item.technicalSkills) ? item.technicalSkills.join(', ') : '',
      item.technicalProficiency || '',
      item.preferredLanguage || '',
      item.practiceDSA || '',
      item.dsaPlatforms || '',
      item.problemSolvingLevel || '',
      item.hasProjects ? 'Yes' : 'No',
      item.projectLinks || '',
      item.proudestProject || '',
      item.whyJoinCodingNexus || '',
      item.technicalLearning || '',
      item.hoursPerWeek || '',
      item.teamworkCommitted ? 'Yes' : 'No',
      item.technicalTaskWilling ? 'Yes' : 'No',
      item.offlineAvailable ? 'Yes' : 'No',
      item.interestedDomain || '',
      item.additionalInfo || '',
      item.declarationAgreed ? 'Yes' : 'No',
      new Date(item.createdAt).toLocaleString()
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'team-applications.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Team Applications</h1>
              <p className="text-gray-600 mt-1">Review everyone who applied to join your team.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadApplications}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Refresh
              </button>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, class, moodle ID, email, phone"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="bg-indigo-50 rounded-lg px-4 py-3 text-indigo-700 font-semibold inline-flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total: {filteredApplications.length}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
            No applications found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-start justify-between"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{item.fullName || item.name || 'N/A'}</h3>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        New
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.email && <span className="inline-flex items-center gap-1 mr-3"><Mail className="w-3 h-3" />{item.email}</span>}
                      {item.phoneNumber && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{item.phoneNumber}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied on {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expandedId === item.id ? null : item.id);
                    }}
                  >
                    {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedId === item.id && (
                  <div className="border-t border-gray-200 p-6 space-y-6 bg-gradient-to-b from-white to-gray-50">
                    {/* Basic Information */}
                    <section className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1 h-4 bg-indigo-600 rounded"></div>
                        Basic Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {item.branch && (
                          <div className="p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-gray-500 text-xs uppercase font-semibold">Branch</p>
                            <p className="font-medium text-gray-800 mt-1">{item.branch}</p>
                          </div>
                        )}
                        {item.year && (
                          <div className="p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-gray-500 text-xs uppercase font-semibold">Year</p>
                            <p className="font-medium text-gray-800 mt-1">{item.year}</p>
                          </div>
                        )}
                        {item.department && (
                          <div className="p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-gray-500 text-xs uppercase font-semibold">Department</p>
                            <p className="font-medium text-gray-800 mt-1">{item.department}</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Profiles */}
                    {(item.githubProfile || item.linkedinProfile || item.portfolioWebsite) && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                          <Github className="w-4 h-4 text-gray-700" />
                          Profiles
                        </h4>
                        <div className="space-y-3 text-sm">
                          {item.githubProfile && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
                              <Github className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <a href={item.githubProfile} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate text-xs font-medium">{item.githubProfile}</a>
                            </div>
                          )}
                          {item.linkedinProfile && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
                              <Linkedin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <a href={item.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate text-xs font-medium">{item.linkedinProfile}</a>
                            </div>
                          )}
                          {item.portfolioWebsite && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
                              <Globe className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <a href={item.portfolioWebsite} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate text-xs font-medium">{item.portfolioWebsite}</a>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Resume */}
                    {item.resumeLink && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Resume</h4>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                          <a href={item.resumeLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate text-xs font-medium">{item.resumeLink}</a>
                        </div>
                      </section>
                    )}

                    {/* Technical Skills */}
                    {(item.technicalSkills?.length > 0 || item.technicalProficiency) && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          Technical Skills
                        </h4>
                        {item.technicalSkills?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {item.technicalSkills.map((skill) => (
                                <span key={skill} className="px-3 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.technicalProficiency && (
                          <div className="p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-gray-500 text-xs uppercase font-semibold">Proficiency Level</p>
                            <p className="font-bold text-gray-800 mt-1 text-lg">{item.technicalProficiency}/5</p>
                          </div>
                        )}
                      </section>
                    )}

                    {/* Programming & DSA */}
                    {(item.preferredLanguage || item.practiceDSA || item.problemSolvingLevel || item.dsaPlatforms) && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          Programming & DSA
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.preferredLanguage && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-500 text-xs uppercase font-semibold">Preferred Language</p>
                              <p className="font-medium text-gray-800 mt-1">{item.preferredLanguage}</p>
                            </div>
                          )}
                          {item.practiceDSA && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-500 text-xs uppercase font-semibold">DSA Practice</p>
                              <p className="font-medium text-gray-800 mt-1">{item.practiceDSA}</p>
                            </div>
                          )}
                          {item.dsaPlatforms && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200 md:col-span-2">
                              <p className="text-gray-500 text-xs uppercase font-semibold">Platforms</p>
                              <p className="font-medium text-gray-800 mt-1">{item.dsaPlatforms}</p>
                            </div>
                          )}
                          {item.problemSolvingLevel && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-500 text-xs uppercase font-semibold">Problem Solving</p>
                              <p className="font-bold text-gray-800 mt-1 text-lg">{item.problemSolvingLevel}/5</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Projects */}
                    {(item.projectLinks || item.proudestProject || item.hasProjects !== undefined) && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Projects
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-gray-500 text-xs uppercase font-semibold">Has Projects</p>
                            <p className="font-medium text-gray-800 mt-1">{item.hasProjects ? '✓ Yes' : '✗ No'}</p>
                          </div>
                          {item.projectLinks && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Project Links</p>
                              <p className="text-gray-700 text-sm break-all">{item.projectLinks}</p>
                            </div>
                          )}
                          {item.proudestProject && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Proudest Project</p>
                              <p className="text-gray-700 text-sm">{item.proudestProject}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Motivation & Learning */}
                    {(item.whyJoinCodingNexus || item.technicalLearning) && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          Motivation & Learning
                        </h4>
                        <div className="space-y-3">
                          {item.whyJoinCodingNexus && (
                            <div>
                              <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Why Join Coding Nexus</p>
                              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-gray-700 text-sm">{item.whyJoinCodingNexus}</p>
                              </div>
                            </div>
                          )}
                          {item.technicalLearning && (
                            <div>
                              <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Technical Learning</p>
                              <div className="p-3 bg-purple-50 rounded border border-purple-200">
                                <p className="text-gray-700 text-sm">{item.technicalLearning}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Commitment & Availability */}
                    {(item.hoursPerWeek || item.teamworkCommitted || item.technicalTaskWilling || item.offlineAvailable || item.interestedDomain) && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Commitment & Availability
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.hoursPerWeek && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-500 text-xs uppercase font-semibold">Hours Per Week</p>
                              <p className="font-bold text-gray-800 mt-1 text-lg">{item.hoursPerWeek}</p>
                            </div>
                          )}
                          {item.interestedDomain && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-500 text-xs uppercase font-semibold">Interested Domain</p>
                              <p className="font-medium text-gray-800 mt-1">{item.interestedDomain}</p>
                            </div>
                          )}
                          {item.teamworkCommitted && (
                            <div className="p-3 bg-green-50 rounded border border-green-200 flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <span className="font-semibold text-green-700">Teamwork Committed</span>
                            </div>
                          )}
                          {item.technicalTaskWilling && (
                            <div className="p-3 bg-green-50 rounded border border-green-200 flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <span className="font-semibold text-green-700">Willing for Tech Task</span>
                            </div>
                          )}
                          {item.offlineAvailable && (
                            <div className="p-3 bg-green-50 rounded border border-green-200 flex items-center gap-2 md:col-span-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <span className="font-semibold text-green-700">Available for Offline Meetings</span>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Additional Information */}
                    {item.additionalInfo && (
                      <section className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Additional Information</h4>
                        <div className="p-3 bg-gray-50 rounded border border-gray-200">
                          <p className="text-gray-700 text-sm">{item.additionalInfo}</p>
                        </div>
                      </section>
                    )}

                    {/* Declaration */}
                    {item.declarationAgreed && (
                      <section className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-amber-600 flex-shrink-0" />
                          <span className="font-bold text-amber-900">Declaration: Agreed to terms and conditions</span>
                        </div>
                      </section>
                    )}

                    {/* Copy & Delete Buttons */}
                    <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                      {item.email && (
                        <button
                          onClick={() => copyToClipboard(item.email, 'Email')}
                          className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm transition"
                        >
                          <Mail className="w-4 h-4" />
                          Copy Email
                        </button>
                      )}
                      {item.phoneNumber && (
                        <button
                          onClick={() => copyToClipboard(item.phoneNumber, 'Phone')}
                          className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm transition"
                        >
                          <Phone className="w-4 h-4" />
                          Copy Phone
                        </button>
                      )}
                      <button
                        onClick={() => deleteApplication(item.id, item.fullName || item.name)}
                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-sm transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamApplicationsManager;
