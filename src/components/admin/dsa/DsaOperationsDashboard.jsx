import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Calendar, Clock, BookOpen, FileText, AlertCircle, CheckCircle,
  XCircle, Bell, Users, ArrowRight, HelpCircle, BarChart3
} from 'lucide-react';
import dsaService from '../../../services/dsaService';
import adminService from '../../../services/adminService';

const DsaOperationsDashboard = () => {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [lectRes, notesRes, ticketRes] = await Promise.all([
      dsaService.getLectures(),
      dsaService.getNotes({ status: 'pending' }),
      adminService.getAllTickets()
    ]);
    if (lectRes.success) setLectures(lectRes.lectures);
    if (notesRes.success) setNotes(notesRes.notes || []);
    if (ticketRes.success) setTickets(ticketRes.tickets || []);
    setLoading(false);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todayLectures = useMemo(() =>
    lectures.filter(l => l.status === 'scheduled' && new Date(l.lectureDate) >= todayStart && new Date(l.lectureDate) < new Date(todayStart.getTime() + 86400000))
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00')),
  [lectures, todayStart]);

  const upcomingLectures = useMemo(() =>
    lectures.filter(l => l.status === 'scheduled' && new Date(l.lectureDate) > new Date(todayStart.getTime() + 86400000) && new Date(l.lectureDate) <= weekEnd)
      .sort((a, b) => new Date(a.lectureDate) - new Date(b.lectureDate)),
  [lectures, todayStart, weekEnd]);

  const pendingReviews = useMemo(() => notes.filter(n => n.status === 'pending'), [notes]);
  const missingNotesCount = useMemo(() =>
    lectures.filter(l => l.status === 'scheduled' && new Date(l.lectureDate) >= todayStart && new Date(l.lectureDate) <= weekEnd && (!l.hasNotes || l.notesStatus === 'missing')).length,
  [lectures, todayStart, weekEnd]);

  const pendingTickets = useMemo(() =>
    tickets.filter(t => t.status === 'open' || t.status === 'pending'), [tickets]);

  const handleNavigate = (tab) => {
    window.dispatchEvent(new CustomEvent('dsa-navigate', { detail: { tab } }));
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (t) => t || '--';

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-700">{todayLectures.length}</span>
          </div>
          <p className="text-xs font-medium text-blue-700">Today's Lectures</p>
        </div>
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-700">{upcomingLectures.length}</span>
          </div>
          <p className="text-xs font-medium text-purple-700">Upcoming (7 days)</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <span className="text-2xl font-bold text-amber-700">{pendingReviews.length}</span>
          </div>
          <p className="text-xs font-medium text-amber-700">Pending Reviews</p>
        </div>
        <div className="p-4 rounded-xl border border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-700">{missingNotesCount}</span>
          </div>
          <p className="text-xs font-medium text-red-700">Missing Notes</p>
        </div>
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-2">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-700">{pendingTickets.length}</span>
          </div>
          <p className="text-xs font-medium text-orange-700">Open Tickets</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Today's Schedule
          </h3>
          {todayLectures.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No lectures scheduled today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayLectures.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.topic}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{l.trainerName}</span><span>•</span>
                      <span>{formatTime(l.startTime)}{l.endTime ? ` - ${formatTime(l.endTime)}` : ''}</span>
                      {l.batch && <><span>•</span><span>{l.batch}</span></>}
                    </p>
                  </div>
                  {(!l.hasNotes || l.notesStatus === 'missing') && (
                    <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium shrink-0">No Notes</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Pending Note Reviews
            </h3>
            {pendingReviews.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">{pendingReviews.length}</span>
            )}
          </div>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All caught up! No pending reviews</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {pendingReviews.slice(0, 8).map(n => (
                <div key={n.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title || n.lectureTopic}</p>
                    <p className="text-xs text-gray-500">by {n.trainerName}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium shrink-0">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Upcoming This Week
          </h3>
          {upcomingLectures.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming lectures this week</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {upcomingLectures.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-center shrink-0 w-10">
                    <p className="text-xs font-bold text-gray-900">{new Date(l.lectureDate).getDate()}</p>
                    <p className="text-[10px] text-gray-500">{new Date(l.lectureDate).toLocaleDateString('en-IN', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.topic}</p>
                    <p className="text-xs text-gray-500">{l.trainerName}{l.batch ? ` • ${l.batch}` : ''}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium shrink-0">{formatTime(l.startTime)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-600" />
              Open Support Tickets
            </h3>
            {pendingTickets.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">{pendingTickets.length}</span>
            )}
          </div>
          {pendingTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No open tickets</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {pendingTickets.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.subject || t.title || 'Ticket'}</p>
                    <p className="text-xs text-gray-500 capitalize">{t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Schedule Lecture', icon: Calendar, action: 'timetable', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
            { label: 'Review Notes', icon: FileText, action: 'review', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
            { label: 'Create Announcement', icon: Bell, path: '/admin/announcements', color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
            { label: 'Support Tickets', icon: HelpCircle, path: '/admin/tickets', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
          ].map(qa => (
            <button key={qa.label} onClick={() => qa.path ? navigate(qa.path) : handleNavigate(qa.action)}
              className={`flex items-center gap-3 p-4 rounded-xl border border-gray-200 ${qa.color} transition-all hover:shadow-sm`}>
              <qa.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium text-left">{qa.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto shrink-0 opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DsaOperationsDashboard;
