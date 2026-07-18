import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Bell, Edit, Trash2, Search, ShieldAlert, Mail, Users, Filter, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { hasPermission, getPermissionDeniedMessage } from '../../utils/permissions';

const DIVISIONS = [
  'FE-A', 'FE-B', 'FE-C',
  'SE-A', 'SE-B', 'SE-C',
  'TE-A', 'TE-B', 'TE-C',
  'BE-A', 'BE-B', 'BE-C'
];

const BATCHES = ['All', 'Basic', 'Advanced'];

const AnnouncementManager = () => {
  const { userDetails } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    batch: 'All',
    division: '',
    notifyEmail: false
  });

  const canManageAnnouncements = hasPermission(userDetails, 'manageAnnouncements');

  useEffect(() => { fetchAnnouncements(); }, []);
  useEffect(() => { filterAnnouncements(); }, [announcements, searchTerm, batchFilter, divisionFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllAnnouncements();
      if (response.success && response.announcements) {
        setAnnouncements(response.announcements.map(a => ({
          ...a,
          createdAt: new Date(a.createdAt)
        })));
      } else {
        toast.error(response.error || 'Failed to load announcements');
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];
    if (batchFilter !== 'All') {
      const lower = batchFilter.toLowerCase();
      filtered = filtered.filter(a => a.batch === lower);
    }
    if (divisionFilter) {
      filtered = filtered.filter(a => a.division === divisionFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.content || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredAnnouncements(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageAnnouncements) {
      toast.error(getPermissionDeniedMessage('manageAnnouncements'));
      return;
    }

    try {
      const payload = {
        title: formData.title,
        message: formData.message,          // fixed: was 'content'
        batch: formData.batch,
        division: formData.division || null,
        notifyEmail: formData.notifyEmail,
        priority: 'normal'
      };

      let response;
      if (editMode && selectedAnnouncement) {
        response = await adminService.updateAnnouncement(selectedAnnouncement.id, payload);
        if (response.success) toast.success('Announcement updated!');
        else { toast.error(response.error || 'Failed to update'); return; }
      } else {
        response = await adminService.createAnnouncement(payload);
        if (response.success) toast.success('Announcement created!');
        else { toast.error(response.error || 'Failed to create'); return; }
      }

      resetForm();
      setShowModal(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      message: announcement.message || announcement.content || '',
      batch: announcement.batch === 'all' ? 'All' : announcement.batch,
      division: announcement.division || '',
      notifyEmail: announcement.notifyEmail || false
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canManageAnnouncements) {
      toast.error(getPermissionDeniedMessage('manageAnnouncements'));
      return;
    }
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await adminService.deleteAnnouncement(id);
      if (response.success) {
        toast.success('Announcement deleted!');
        fetchAnnouncements();
      } else {
        toast.error(response.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', message: '', batch: 'All', division: '', notifyEmail: false });
    setEditMode(false);
    setSelectedAnnouncement(null);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const getBatchBadge = (batch) => {
    if (!batch || batch === 'all') return 'bg-gray-100 text-gray-700';
    return batch.toLowerCase() === 'basic' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
  };

  // Stats
  const totalAll = announcements.filter(a => !a.division).length;
  const byDivision = DIVISIONS.filter(d => announcements.some(a => a.division === d));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
              <ArrowLeft className="w-5 h-5" /><span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
            {canManageAnnouncements && (
              <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <Plus className="w-5 h-5" />New Announcement
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!canManageAnnouncements ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">You don't have permission to manage announcements.</p>
              <Link to="/admin/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <ArrowLeft className="w-5 h-5" />Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search announcements..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
            </div>
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
              <option value="All">All Batches</option>
              <option value="Basic">Basic</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
              <option value="">All Divisions</option>
              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(batchFilter !== 'All' || divisionFilter || searchTerm) && (
              <button onClick={() => { setBatchFilter('All'); setDivisionFilter(''); setSearchTerm(''); }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />Clear
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{announcements.length}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalAll}</p>
            <p className="text-xs text-gray-600">For Everyone</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{byDivision.length}</p>
            <p className="text-xs text-gray-600">Divisions Targeted</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {announcements.filter(a => a.notifyEmail).length}
            </p>
            <p className="text-xs text-gray-600">Emailed</p>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Bell className="w-5 h-5 text-pink-600 flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-gray-800">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBatchBadge(a.batch)}`}>
                        {a.batch === 'all' ? 'Everyone' : a.batch}
                      </span>
                      {a.division && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          🎓 {a.division}
                        </span>
                      )}
                      {a.notifyEmail && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                          <Mail className="w-3 h-3" />Emailed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2 whitespace-pre-wrap text-sm">{a.message || a.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>By: {a.createdBy}</span>
                      <span>{a.createdAt?.toLocaleString()}</span>
                      {a.updatedAt && a.updatedAt !== a.createdAt?.toISOString() && (
                        <span className="text-orange-600">Edited</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button onClick={() => handleEdit(a)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                      <Edit className="w-5 h-5" />
                    </button>
                    {userDetails?.role === 'superadmin' && (
                      <button onClick={() => handleDelete(a.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Announcements</h3>
            <p className="text-gray-600 mb-6">{searchTerm ? 'No matching announcements' : 'Create your first announcement'}</p>
            {canManageAnnouncements && (
              <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <Plus className="w-5 h-5" />Create Announcement
              </button>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editMode ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="Workshop this Saturday" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="Details of the announcement..." required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Batch</label>
                  <select value={formData.batch}
                    onChange={e => setFormData({ ...formData, batch: e.target.value, division: e.target.value === 'All' ? '' : formData.division })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                    {BATCHES.map(b => <option key={b} value={b}>{b === 'All' ? 'All Batches (Everyone)' : `${b} Batch`}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${formData.batch === 'All' ? 'text-gray-400' : 'text-gray-700'}`}>
                    Specific Division {formData.batch === 'All' && '(auto-cleared for All)'}
                  </label>
                  <select value={formData.division}
                    onChange={e => setFormData({ ...formData, division: e.target.value })}
                    disabled={formData.batch === 'All'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400">
                    <option value="">All Divisions</option>
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.notifyEmail}
                    onChange={e => setFormData({ ...formData, notifyEmail: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <span className="text-sm font-medium text-blue-800 flex items-center gap-1">
                      <Mail className="w-4 h-4" /> Send email notification
                    </span>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {formData.division
                        ? `Students in ${formData.division} will receive this announcement via email`
                        : formData.batch === 'All'
                          ? 'All active students will receive this via email'
                          : `All ${formData.batch} batch students will receive this via email`}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium">
                  {editMode ? 'Update' : 'Create'} Announcement
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
