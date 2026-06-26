import React, { useState, useEffect } from 'react';
import {
  Loader2, BookOpen, Calendar, Clock, CheckCircle, AlertCircle, XCircle, Bell, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import dsaService from '../../../services/dsaService';

const DsaTrainerDashboard = () => {
  const { userDetails } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingNotify, setSendingNotify] = useState(false);

  const isSuperAdmin = userDetails?.role === 'superadmin' || userDetails?.role === 'admin';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await dsaService.getTrainerDashboard();
    if (res.success) setDashboard(res.dashboard);
    setLoading(false);
  };

  const handleNotify = async () => {
    setSendingNotify(true);
    await dsaService.notifyMissingNotes();
    setSendingNotify(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-20 text-gray-400">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Not a DSA trainer</p>
        <p className="text-sm">You are not assigned as a DSA trainer. Contact a Super Admin to get assigned.</p>
      </div>
    );
  }

  const { stats, upcomingLectures } = dashboard;

  const statusCards = [
    { label: 'Total Lectures', value: stats.totalLectures, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-100' },
    { label: 'Pending Review', value: stats.pending, icon: AlertCircle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-100' },
    { label: 'Missing Notes', value: stats.missing, icon: XCircle, color: 'text-gray-600 bg-gray-100 border-gray-200' },
  ];

  const getNoteStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'pending': return <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> Pending</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Missing</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            My Dashboard
          </h2>
          <p className="text-sm text-gray-500">Welcome, {dashboard.trainerName}</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={handleNotify}
            disabled={sendingNotify}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            {sendingNotify ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Notify Missing Notes
          </button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {statusCards.map(card => (
          <div key={card.label} className={`p-4 rounded-xl border ${card.color}`}>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs font-medium mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Lectures */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Upcoming Lectures
        </h3>
        {upcomingLectures.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming lectures scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingLectures.map(lecture => (
              <div key={lecture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{lecture.topic}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lecture.lectureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {lecture.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {lecture.startTime}
                        </span>
                      )}
                      {lecture.batch && <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">{lecture.batch}</span>}
                    </div>
                  </div>
                </div>
                {getNoteStatusBadge(lecture.noteStatus)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats explanation */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <p className="text-xs text-gray-600">
          <strong>Notes workflow:</strong> Upload notes for each lecture → Notes enter "Pending Review" →
          Reviewer approves/rejects with remarks → Status updates in your dashboard.
          {stats.missing > 0 && ` You have ${stats.missing} lecture(s) with missing notes.`}
        </p>
      </div>
    </div>
  );
};

export default DsaTrainerDashboard;
