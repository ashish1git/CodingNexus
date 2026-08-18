import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Bot, Plus, X, Pencil, Trash2, Search, Sparkles, Power, PowerOff
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

// Admin management UI for Nexi's curated FAQs
const NexiFaqManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingFaq, setDeletingFaq] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: 'general',
    isActive: true
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredFaqs(faqs.filter(f =>
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        (f.category || '').toLowerCase().includes(term)
      ));
    } else {
      setFilteredFaqs(faqs);
    }
  }, [faqs, searchTerm]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const response = await adminService.getNexiFaqs();
      if (response.success) {
        setFaqs(response.data || []);
      } else {
        toast.error(response.error || 'Failed to load FAQs');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '', keywords: '', category: 'general', isActive: true });
    setShowModal(true);
  };

  const openEdit = (faq) => {
    setEditingFaq(faq);
    let keywords = [];
    try { keywords = JSON.parse(faq.keywords || '[]'); } catch (e) { keywords = []; }
    setFormData({
      question: faq.question,
      answer: faq.answer,
      keywords: keywords.join(', '),
      category: faq.category || 'general',
      isActive: faq.isActive
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        category: formData.category,
        isActive: formData.isActive
      };

      let response;
      if (editingFaq) {
        response = await adminService.updateNexiFaq(editingFaq.id, payload);
      } else {
        response = await adminService.createNexiFaq(payload);
      }

      if (response.success) {
        setShowModal(false);
        fetchFaqs();
      }
    } catch (error) {
      toast.error('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (faq) => {
    try {
      const response = await adminService.updateNexiFaq(faq.id, { isActive: !faq.isActive });
      if (response.success) {
        fetchFaqs();
      }
    } catch (error) {
      toast.error('Failed to update FAQ');
    }
  };

  const handleDelete = async () => {
    if (!deletingFaq) return;
    try {
      const response = await adminService.deleteNexiFaq(deletingFaq.id);
      if (response.success) {
        setDeletingFaq(null);
        fetchFaqs();
      }
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-indigo-600 transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-pink-600" />
                <span className="text-xl font-bold text-gray-800">Nexi FAQ Management</span>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add FAQ
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Info banner */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1">How Nexi uses these FAQs</p>
            <p>When a student asks something, Nexi first matches their question against these curated answers — fast, free, and exactly what you wrote. Only unmatched questions go to the AI model. Add keywords to improve matching (e.g. <code className="bg-pink-100 px-1.5 py-0.5 rounded text-xs">score, marks, result</code>).</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full md:w-96 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredFaqs.length > 0 ? (
          <div className="space-y-3">
            {filteredFaqs.map(faq => (
              <div key={faq.id} className={`bg-white rounded-xl shadow-sm border p-5 ${faq.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{faq.question}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {faq.category || 'general'}
                      </span>
                      {!faq.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{faq.answer}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      {(() => {
                        let keywords = [];
                        try { keywords = JSON.parse(faq.keywords || '[]'); } catch (e) { keywords = []; }
                        return keywords.length > 0 ? (
                          <>
                            <span className="font-medium">Keywords:</span>
                            {keywords.map((k, i) => (
                              <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{k}</span>
                            ))}
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(faq)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                      title={faq.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {faq.isActive ? <Power className="w-4 h-4 text-green-600" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(faq)}
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingFaq(faq)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No FAQs found' : 'No FAQs yet'}
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              {searchTerm ? 'Try a different search.' : 'Add your first FAQ to help Nexi answer students instantly.'}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First FAQ
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                {editingFaq ? 'Edit FAQ' : 'Add FAQ'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  placeholder="e.g. How are marks awarded in competitions?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Answer</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows="5"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
                  placeholder="Write the answer students should see..."
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Keywords <span className="text-gray-400 font-normal">(comma-separated, for better matching)</span>
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  placeholder="e.g. marks, score, points, grading"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  >
                    <option value="general">General</option>
                    <option value="competition">Competition</option>
                    <option value="ticket">Support Ticket</option>
                    <option value="account">Account</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium text-sm"
                >
                  {saving ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Create FAQ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingFaq && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete FAQ?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete &quot;<span className="font-medium">{deletingFaq.question}</span>&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeletingFaq(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NexiFaqManagement;
