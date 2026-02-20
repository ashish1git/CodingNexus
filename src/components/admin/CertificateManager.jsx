import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, Plus, Edit2, Trash2, Eye, Search, Filter, 
  Calendar, Users, Download, Loader, X, Check, AlertTriangle, FileText, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { certificateService } from '../../services/certificateService';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import toast from 'react-hot-toast';

const CertificateManager = () => {
  const { userDetails } = useAuth();
  const canManageCertificates = hasPermission(userDetails, 'manageCertificates');
  
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    description: '',
    batch: '',
    templateType: 'participation',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const result = await certificateService.getAllCertificates();
      if (result.success) {
        setCertificates(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCertificate(null);
    setFormData({
      eventName: '',
      eventDate: new Date().toISOString().split('T')[0],
      description: '',
      batch: '',
      templateType: 'participation',
      isActive: true
    });
    setShowModal(true);
  };

  const openEditModal = (cert) => {
    setEditingCertificate(cert);
    setFormData({
      eventName: cert.eventName,
      eventDate: new Date(cert.eventDate).toISOString().split('T')[0],
      description: cert.description || '',
      batch: cert.batch || '',
      templateType: cert.templateType,
      isActive: cert.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let result;
      if (editingCertificate) {
        result = await certificateService.updateCertificate(editingCertificate.id, formData);
      } else {
        result = await certificateService.createCertificate(formData);
      }

      if (result.success) {
        setShowModal(false);
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate? All associated requests will also be deleted.')) {
      return;
    }

    try {
      const result = await certificateService.deleteCertificate(id);
      if (result.success) {
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const viewRequests = async (cert) => {
    setSelectedCertificate(cert);
    setShowRequestsModal(true);
    setLoadingRequests(true);

    try {
      const result = await certificateService.getCertificateRequests(cert.id);
      if (result.success) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const toggleActive = async (cert) => {
    try {
      const result = await certificateService.updateCertificate(cert.id, {
        isActive: !cert.isActive
      });
      if (result.success) {
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.eventName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || cert.templateType === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Access Denied Screen
  if (!canManageCertificates) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to manage certificates. Contact your administrator to request access.
            </p>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-500" />
            Certificate Manager
          </h1>
          <p className="text-gray-600 mt-1">Create and manage participation certificates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Certificate
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{certificates.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {certificates.filter(c => c.isActive).length}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {certificates.reduce((acc, c) => acc + (c._count?.requests || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Claims</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {certificates.filter(c => c.templateType === 'achievement').length}
              </p>
              <p className="text-xs text-gray-500">Achievements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-8 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          >
            <option value="all">All Types</option>
            <option value="participation">Participation</option>
            <option value="completion">Completion</option>
            <option value="achievement">Achievement</option>
          </select>
        </div>
      </div>

      {/* Certificates List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Certificates Found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first certificate to get started'
            }
          </p>
          {!searchQuery && filterType === 'all' && (
            <button
              onClick={openCreateModal}
              className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
            >
              Create Certificate
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCertificates.map(cert => (
            <div
              key={cert.id}
              className={`bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md ${
                cert.isActive 
                  ? 'border-gray-200 hover:border-amber-300' 
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    cert.isActive
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                  }`}>
                    <Award className={`w-8 h-8 ${cert.isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800">{cert.eventName}</h3>
                      {!cert.isActive && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    {cert.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{cert.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(cert.eventDate)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        cert.templateType === 'achievement' 
                          ? 'bg-purple-100 text-purple-700'
                          : cert.templateType === 'completion'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {cert.templateType.charAt(0).toUpperCase() + cert.templateType.slice(1)}
                      </span>
                      {cert.batch && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          Batch: {cert.batch}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users className="w-4 h-4" />
                        {cert._count?.requests || 0} claims
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto lg:ml-0">
                  <button
                    onClick={() => viewRequests(cert)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="View Requests"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(cert)}
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => toggleActive(cert)}
                    className={`p-2 rounded-lg transition ${
                      cert.isActive
                        ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={cert.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {cert.isActive ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingCertificate ? 'Edit Certificate' : 'Create Certificate'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="e.g., Coding Competition 2024"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the event..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g., 2024 or All"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Type
                  </label>
                  <select
                    value={formData.templateType}
                    onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  >
                    <option value="participation">Participation</option>
                    <option value="completion">Completion</option>
                    <option value="achievement">Achievement</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 border-gray-300 rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-600">
                  Make this certificate available for students to claim
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {editingCertificate ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Requests Modal */}
      {showRequestsModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Certificate Claims</h2>
                  <p className="text-sm text-gray-600">{selectedCertificate.eventName}</p>
                </div>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No one has claimed this certificate yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div
                      key={req.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{req.nameOnCertificate}</p>
                          <p className="text-sm text-gray-500">{req.user?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            <Download className="w-4 h-4 inline mr-1" />
                            {req.downloadCount} downloads
                          </p>
                          <p className="text-xs text-gray-400">
                            Claimed: {formatDate(req.createdAt || req.requestedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManager;
