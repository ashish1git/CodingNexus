import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Loader2, Calendar, Clock, Users,
  BookOpen, X, Trash2, Edit, AlertCircle, CheckCircle, XCircle,
  RotateCcw, Filter, Grid3X3, LayoutList, Sun
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { hasPermission } from '../../../utils/permissions';
import dsaService from '../../../services/dsaService';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

const STATUS_COLORS = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200', label: 'Upcoming' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200', label: 'Completed' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', border: 'border-gray-200', label: 'Cancelled' },
  pastdue:   { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200', label: 'Past Due' }
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const startOfWeek = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const formatDate = (date) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const toDateInput = (date) => new Date(date).toISOString().split('T')[0];
const getLectureDate = (lecture) => new Date(lecture.lectureDate);
const isToday = (date) => isSameDay(date, new Date());

const getStatusStyle = (lecture) => {
  const status = lecture.status;
  if (status === 'cancelled') return STATUS_COLORS.cancelled;
  if (status === 'completed') return STATUS_COLORS.completed;
  if (status === 'scheduled') {
    const now = new Date();
    const lectureDate = new Date(lecture.lectureDate);
    if (lecture.startTime) {
      const [h, m] = lecture.startTime.split(':').map(Number);
      lectureDate.setHours(h || 0, m || 0, 0, 0);
    } else {
      lectureDate.setHours(23, 59, 59, 999);
    }
    return lectureDate < now ? STATUS_COLORS.pastdue : STATUS_COLORS.scheduled;
  }
  return STATUS_COLORS.scheduled;
};

const DsaTimetable = ({ trainerView = false }) => {
  const { userDetails } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [filterTrainer, setFilterTrainer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [myTrainerId, setMyTrainerId] = useState(null);

  const canSchedule = useMemo(() =>
    (userDetails?.role === 'superadmin' || userDetails?.role === 'admin' || hasPermission(userDetails, 'manageDsaSchedule')) && !trainerView, [userDetails, trainerView]);

  // Auto-filter to current trainer when in trainer view
  useEffect(() => {
    if (trainerView && trainers.length > 0 && userDetails?.adminProfile?.id) {
      const myTrainer = trainers.find(t => t.adminId === userDetails.adminProfile.id);
      if (myTrainer) {
        setMyTrainerId(myTrainer.id);
        setFilterTrainer(myTrainer.id);
      }
    }
  }, [trainerView, trainers, userDetails]);

  const emptyForm = { trainerIds: [], topic: '', description: '', batch: '', division: '', lectureDate: '', startTime: '', endTime: '', notesRequired: true };
  const [form, setForm] = useState({ ...emptyForm });
  const [recurringForm, setRecurringForm] = useState({
    trainerIds: [], topic: '', description: '', batch: '', division: '',
    startTime: '', endTime: '', startDate: '', endDate: '', count: 12,
    daysOfWeek: { monday: true, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false },
    notesRequired: true
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [lecturesRes, trainersRes] = await Promise.all([
      dsaService.getLectures(),
      dsaService.getTrainers()
    ]);
    if (lecturesRes.success) setLectures(lecturesRes.lectures);
    if (trainersRes.success) setTrainers(trainersRes.trainers.filter(t => t.isActive));
    setLoading(false);
  };

  const now = new Date();

  const filteredLectures = useMemo(() =>
    lectures.filter(l => {
      if (filterTrainer !== 'all' && l.trainerId !== filterTrainer) return false;
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      if (filterBatch !== 'all' && l.batch !== filterBatch) return false;
      if (filterDivision !== 'all' && l.division !== filterDivision) return false;
      return true;
    }), [lectures, filterTrainer, filterStatus, filterBatch, filterDivision]);

  // Group co-teaching lectures (same date, time, topic, batch) for display
  const groupedLectures = useMemo(() => {
    const groups = {};
    filteredLectures.forEach(l => {
      const key = `${l.topic}||${l.lectureDate}||${l.startTime || ''}||${l.endTime || ''}||${l.batch || ''}`;
      if (!groups[key]) {
        groups[key] = { ids: [l.id], trainerNames: [l.trainerName], lectures: [l] };
      } else {
        groups[key].ids.push(l.id);
        groups[key].trainerNames.push(l.trainerName);
        groups[key].lectures.push(l);
      }
    });
    return Object.values(groups);
  }, [filteredLectures]);

  const batches = useMemo(() => {
    const b = new Set(lectures.map(l => l.batch).filter(Boolean));
    return ['all', ...Array.from(b)];
  }, [lectures]);

  const divisions = useMemo(() => {
    const d = new Set(lectures.map(l => l.division).filter(Boolean));
    return ['all', ...Array.from(d)];
  }, [lectures]);

  const calendarDays = useMemo(() => {
    const first = startOfMonth(currentDate);
    const last = endOfMonth(currentDate);
    const days = [];
    for (let i = 0; i < first.getDay(); i++) days.push({ date: null, day: 0 });
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      days.push({ date, day: d, lectures: filteredLectures.filter(l => isSameDay(getLectureDate(l), date)) });
    }
    return days;
  }, [currentDate, filteredLectures]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return { date, lectures: filteredLectures.filter(l => isSameDay(getLectureDate(l), date)) };
    });
  }, [currentDate, filteredLectures]);

  const upcomingLectures = useMemo(() =>
    filteredLectures
      .filter(l => l.status === 'scheduled' && getLectureDate(l) >= now)
      .sort((a, b) => getLectureDate(a) - getLectureDate(b))
      .slice(0, 5), [filteredLectures, now]);

  useEffect(() => {
    if (editingLecture) {
      setForm({
        trainerIds: editingLecture.trainerId ? [editingLecture.trainerId] : [],
        topic: editingLecture.topic || '',
        description: editingLecture.description || '',
        batch: editingLecture.batch || '',
        division: editingLecture.division || '',
        lectureDate: toDateInput(getLectureDate(editingLecture)),
        startTime: editingLecture.startTime || '',
        endTime: editingLecture.endTime || '',
        notesRequired: editingLecture.notesRequired !== undefined ? editingLecture.notesRequired : true
      });
    }
  }, [editingLecture]);

  const navigatePrev = useCallback(() => {
    if (viewMode === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else if (viewMode === 'week') setCurrentDate(d => addDays(d, -7));
    else setCurrentDate(d => addDays(d, -1));
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    if (viewMode === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else if (viewMode === 'week') setCurrentDate(d => addDays(d, 7));
    else setCurrentDate(d => addDays(d, 1));
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      return `${formatDate(start)} - ${formatDate(addDays(start, 6))}`;
    }
    return formatDate(currentDate);
  }, [currentDate, viewMode]);

  const handleCreateSingle = () => { setEditingLecture(null); setForm({ ...emptyForm }); setShowCreateModal(true); };
  const handleOpenEdit = (lecture) => { setEditingLecture(lecture); setShowCreateModal(true); };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (form.trainerIds.length === 0) { alert('Select at least one trainer.'); return; }
    const payload = { ...form, trainerId: undefined };
    const res = editingLecture
      ? await dsaService.updateLecture(editingLecture.id, payload)
      : await dsaService.createLecture(payload);
    if (res.success) { setShowCreateModal(false); setEditingLecture(null); fetchData(); }
  };

  const handleCancel = async (lecture) => {
    if (!window.confirm(`Cancel "${lecture.topic}" on ${formatDate(getLectureDate(lecture))}?`)) return;
    const res = await dsaService.cancelLecture(lecture.id);
    if (res.success) { setSelectedLecture(null); fetchData(); }
  };

  const handleReschedule = async (lecture) => {
    const newDate = prompt('New date (YYYY-MM-DD):', toDateInput(getLectureDate(lecture)));
    if (!newDate) return;
    const newStart = prompt('New start time (HH:mm) or leave blank:', lecture.startTime || '');
    const res = await dsaService.rescheduleLecture(lecture.id, {
      lectureDate: newDate, startTime: newStart || lecture.startTime, endTime: lecture.endTime
    });
    if (res.success) { setSelectedLecture(null); fetchData(); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lecture permanently?')) return;
    const res = await dsaService.deleteLecture(id);
    if (res.success) { setSelectedLecture(null); fetchData(); }
  };

  const handleRecurringSubmit = async (e) => {
    e.preventDefault();
    if (recurringForm.trainerIds.length === 0) { alert('Select at least one trainer.'); return; }
    const selectedDays = Object.entries(recurringForm.daysOfWeek).filter(([_, v]) => v).map(([k]) => k);
    if (selectedDays.length === 0) { alert('Select at least one day.'); return; }
    const res = await dsaService.createRecurringSchedule({
      trainerIds: recurringForm.trainerIds,
      topic: recurringForm.topic,
      description: recurringForm.description, batch: recurringForm.batch, division: recurringForm.division,
      startTime: recurringForm.startTime, endTime: recurringForm.endTime,
      startDate: recurringForm.startDate, endDate: recurringForm.endDate || undefined,
      count: parseInt(recurringForm.count) || 12, daysOfWeek: selectedDays,
      notesRequired: recurringForm.notesRequired !== undefined ? recurringForm.notesRequired : true
    });
    if (res.success) { setShowRecurringModal(false); fetchData(); }
  };

  const toggleDay = (day) => {
    setRecurringForm(f => ({ ...f, daysOfWeek: { ...f.daysOfWeek, [day]: !f.daysOfWeek[day] } }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>;
  }

  const LectureCompact = ({ lecture }) => {
    const s = getStatusStyle(lecture);
    const label = lecture.trainerNamesLabel || lecture.trainerName || '';
    return (
      <div className={`${s.bg} ${s.text} px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1.5 border ${s.border}`}
        onClick={(e) => { e.stopPropagation(); setSelectedLecture(lecture); }} title={`${lecture.topic}${lecture.startTime ? ' @ ' + lecture.startTime : ''} - ${s.label}${label ? ' - ' + label : ''}`}>
        <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
        <span className="flex-1 truncate">{lecture.topic}</span>
        {lecture.startTime && <span className="text-[10px] opacity-75 shrink-0">{lecture.startTime}</span>}
        {label && <span className="text-[10px] opacity-60 shrink-0 max-w-[80px] truncate">{label}</span>}
      </div>
    );
  };

  const LectureCard = ({ lecture }) => {
    const s = getStatusStyle(lecture);
    const label = lecture.trainerNamesLabel || lecture.trainerName || '';
    return (
      <div className={`p-2 ${s.bg} ${s.text} rounded-lg border ${s.border} cursor-pointer hover:shadow-md transition-all`}
        onClick={() => setSelectedLecture(lecture)}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <BookOpen className="w-3 h-3 shrink-0" />
          <span className="font-medium text-xs truncate">{lecture.topic}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] opacity-75 flex-wrap">
          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{lecture.startTime || '--'}</span>
          {lecture.batch && <span>{lecture.batch}</span>}
        </div>
        {label && <div className="text-[10px] opacity-60 mt-0.5 truncate">{label}</div>}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50"><Calendar className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{trainerView ? 'My Schedule' : 'DSA Timetable'}</h2>
              <p className="text-xs text-gray-500">{lectures.length} total lectures</p>
            </div>
          </div>
          {canSchedule && (
            <div className="flex items-center gap-2">
              <button onClick={handleCreateSingle}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95">
                <Plus className="w-4 h-4" /> Schedule
              </button>
              <button onClick={() => setShowRecurringModal(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-all">
                <RotateCcw className="w-4 h-4" /> Recurring
              </button>
            </div>
          )}
        </div>
        {upcomingLectures.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Upcoming:</span>
            {upcomingLectures.map(l => (
              <button key={l.id} onClick={() => setSelectedLecture(l)}
                className="flex items-center gap-1 whitespace-nowrap px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium hover:bg-blue-100 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{l.topic} - {formatDate(getLectureDate(l))}
                <span className="opacity-60 ml-0.5">({l.trainerName})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button onClick={navigatePrev} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Today</button>
          <button onClick={navigateNext} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
          <h3 className="text-sm font-semibold text-gray-900 ml-2 min-w-[140px]">{headerLabel}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[{ key: 'month', icon: Grid3X3 }, { key: 'week', icon: LayoutList }, { key: 'day', icon: Sun }].map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)}
                className={`p-1.5 rounded-md transition-all ${viewMode === v.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <v.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          {!trainerView && (
            <select value={filterTrainer} onChange={e => setFilterTrainer(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Trainers</option>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Status</option>
            <option value="scheduled">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {batches.map(b => <option key={b} value={b}>{b === 'all' ? 'All Batches' : b}</option>)}
          </select>
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {divisions.map(d => <option key={d} value={d}>{d === 'all' ? 'All Divisions' : `Div ${d}`}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 md:px-6 py-2 flex items-center gap-4 border-b border-gray-100 bg-gray-50/50">
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className={`w-2 h-2 rounded-full ${val.dot}`} />{val.label}
          </div>
        ))}
        <span className="text-[11px] text-gray-400 ml-auto">Click any lecture for details</span>
      </div>

      {/* Calendar Views */}
      <div className="p-4 md:p-6">
        {viewMode === 'month' && <MonthView days={calendarDays} LectureCompact={LectureCompact} currentDate={currentDate} />}
        {viewMode === 'week' && <WeekView days={weekDays} LectureCard={LectureCard} />}
        {viewMode === 'day' && <DayView lectures={filteredLectures} currentDate={currentDate} onSelect={setSelectedLecture} />}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <LectureFormModal editing={editingLecture} form={form} setForm={setForm} trainers={trainers}
          onClose={() => { setShowCreateModal(false); setEditingLecture(null); }} onSubmit={handleFormSubmit} />
      )}
      {showRecurringModal && (
        <RecurringFormModal form={recurringForm} setForm={setRecurringForm} trainers={trainers}
          toggleDay={toggleDay} onClose={() => setShowRecurringModal(false)} onSubmit={handleRecurringSubmit} />
      )}
      {selectedLecture && (
        <LectureDetailModal lecture={selectedLecture} onClose={() => setSelectedLecture(null)}
          canSchedule={canSchedule} onEdit={handleOpenEdit} onCancel={handleCancel}
          onReschedule={handleReschedule} onDelete={handleDelete} />
      )}
    </div>
  );
};

const MonthView = ({ days, LectureCompact, currentDate }) => (
  <div>
    <div className="grid grid-cols-7 mb-1">
      {DAYS.map(d => (
        <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-2 uppercase">{d}</div>
      ))}
    </div>
    <div className="grid grid-cols-7 border-l border-t border-gray-200 rounded-xl overflow-hidden">
      {days.map((day, i) => {
        const today = day.date && isToday(day.date);
        const isCurrent = day.date?.getMonth() === currentDate.getMonth();
        // Group co-teaching lectures within this cell
        const cellGroups = {};
        (day.lectures || []).forEach(l => {
          const key = `${l.topic}||${l.startTime || '--'}||${l.batch || ''}`;
          if (!cellGroups[key]) {
            cellGroups[key] = { lectures: [l], trainerNames: [l.trainerName] };
          } else {
            cellGroups[key].lectures.push(l);
            if (!cellGroups[key].trainerNames.includes(l.trainerName)) {
              cellGroups[key].trainerNames.push(l.trainerName);
            }
          }
        });
        const grouped = Object.values(cellGroups).map(g => ({
          ...g.lectures[0],
          trainerNamesLabel: g.trainerNames.join(' & '),
          allLectures: g.lectures
        }));

        return (
          <div key={i} className={`min-h-[90px] md:min-h-[110px] border-r border-b border-gray-200 p-1.5 transition-colors
            ${today ? 'bg-indigo-50/50' : ''} ${!isCurrent ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/50'}`}>
            {day.date && <>
              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                ${today ? 'bg-indigo-600 text-white' : isCurrent ? 'text-gray-700' : 'text-gray-400'}`}>{day.day}</div>
              <div className="space-y-0.5">
                {grouped.slice(0, 3).map(l => <LectureCompact key={l.id} lecture={l} />)}
                {grouped.length > 3 && <div className="text-[10px] text-gray-400 font-medium pl-1">+{grouped.length - 3} more</div>}
              </div>
            </>}
          </div>
        );
      })}
    </div>
  </div>
);

const WeekView = ({ days, LectureCard }) => (
  <div>
    <div className="grid grid-cols-7 mb-1 gap-1">
      {days.map((d, i) => (
        <div key={i} className={`text-center py-2 rounded-lg ${isToday(d.date) ? 'bg-indigo-50' : ''}`}>
          <div className="text-[11px] font-semibold text-gray-400 uppercase">{DAYS[i]}</div>
          <div className={`text-lg font-bold ${isToday(d.date) ? 'text-indigo-600' : 'text-gray-800'}`}>{d.date.getDate()}</div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {days.map((d, i) => {
        // Group co-teaching lectures within this cell
        const cellGroups = {};
        (d.lectures || []).forEach(l => {
          const key = `${l.topic}||${l.startTime || '--'}||${l.batch || ''}`;
          if (!cellGroups[key]) {
            cellGroups[key] = { lectures: [l], trainerNames: [l.trainerName] };
          } else {
            cellGroups[key].lectures.push(l);
            if (!cellGroups[key].trainerNames.includes(l.trainerName)) {
              cellGroups[key].trainerNames.push(l.trainerName);
            }
          }
        });
        const grouped = Object.values(cellGroups).map(g => ({
          ...g.lectures[0],
          trainerNamesLabel: g.trainerNames.join(' & '),
          allLectures: g.lectures
        }));

        return (
          <div key={i} className={`min-h-[200px] md:min-h-[300px] p-1.5 rounded-xl border ${isToday(d.date) ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-200 bg-white'}`}>
            <div className="space-y-1">
              {grouped.length === 0 && <div className="text-[10px] text-gray-300 text-center py-8">No lectures</div>}
              {grouped.map(l => <LectureCard key={l.id} lecture={l} />)}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const DayView = ({ lectures, currentDate, onSelect }) => {
  const dayLectures = lectures.filter(l => isSameDay(getLectureDate(l), currentDate))
    .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

  // Group co-teaching lectures by (topic, time, batch)
  const groupMap = {};
  dayLectures.forEach(l => {
    const key = `${l.topic}||${l.startTime || '--'}||${l.batch || ''}`;
    if (!groupMap[key]) {
      groupMap[key] = { lectures: [l], trainerNames: [l.trainerName] };
    } else {
      groupMap[key].lectures.push(l);
      if (!groupMap[key].trainerNames.includes(l.trainerName)) {
        groupMap[key].trainerNames.push(l.trainerName);
      }
    }
  });
  const grouped = Object.values(groupMap).map(g => ({
    ...g.lectures[0],
    trainerNamesLabel: g.trainerNames.join(' & '),
    allLectures: g.lectures
  }));

  // Group by hour for display
  const hourGroups = {};
  grouped.forEach(l => {
    const h = (l.startTime || '00:00').split(':')[0];
    if (!hourGroups[h]) hourGroups[h] = [];
    hourGroups[h].push(l);
  });

  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-sm font-semibold text-gray-900">{formatDate(currentDate)}</div>
        <div className="text-xs text-gray-500">{dayLectures.length} lecture{dayLectures.length !== 1 ? 's' : ''}</div>
      </div>
      <div className="max-h-[500px] overflow-y-auto space-y-0.5 pr-2">
        {HOURS.map(hour => {
          const slot = hourGroups[hour] || [];
          return (
            <div key={hour} className="flex gap-3 min-h-[48px]">
              <div className="w-14 text-right text-[11px] text-gray-400 font-medium pt-1.5 shrink-0">{hour}</div>
              <div className="flex-1 border-t border-gray-100 py-1">
                {slot.length > 0 ? (
                  <div className="space-y-1">
                    {slot.map(l => {
                      const s = getStatusStyle(l);
                      const displayTrainers = l.trainerNamesLabel || l.trainerName || '';
                      return (
                        <div key={l.id} onClick={() => onSelect(l)}
                          className={`flex items-center gap-3 p-2 rounded-lg border ${s.border} ${s.bg} cursor-pointer`}>
                          <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{l.topic}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-2">
                              <span>{displayTrainers}</span>
                              {l.batch && <span>{l.batch}</span>}
                            </div>
                          </div>
                          <span className={`text-[10px] font-medium ${s.text}`}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-200 pt-1.5">&mdash;</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LectureFormModal = ({ editing, form, setForm, trainers, onClose, onSubmit }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Lecture' : 'Schedule Lecture'}</h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assign Trainers *</label>
            <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl">
              {trainers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No trainers available</p>
              ) : trainers.map(t => {
                const checked = form.trainerIds.includes(t.id);
                return (
                  <label key={t.id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-indigo-50' : 'hover:bg-gray-100'}`}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      const next = checked ? form.trainerIds.filter(id => id !== t.id) : [...form.trainerIds, t.id];
                      setForm({ ...form, trainerIds: next });
                    }} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700">{t.name}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{form.trainerIds.length} trainer{form.trainerIds.length !== 1 ? 's' : ''} selected</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Batch</label>
            <select value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <option value="">All batches</option>
              <option value="Basic">Basic</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Division</label>
            <select value={form.division} onChange={e => setForm({ ...form, division: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <option value="">All divisions</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Topic *</label>
          <input required value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="e.g. Arrays & Hashing" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" rows={2} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
          <input type="date" required value={form.lectureDate} onChange={e => setForm({ ...form, lectureDate: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
            <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
            <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.notesRequired === false} onChange={e => setForm({ ...form, notesRequired: !e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
            <div>
              <span className="text-xs font-medium text-gray-700">Mark as Optional (no notes required)</span>
              <p className="text-[10px] text-gray-500">Check this if notes upload is NOT mandatory for this lecture</p>
            </div>
          </label>
        </div>
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">Cancel</button>
          <button type="submit"
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm active:scale-95">
            {editing ? 'Update' : 'Schedule'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const RecurringFormModal = ({ form, setForm, trainers, toggleDay, onClose, onSubmit }) => {
  const dayLabels = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
  const activeDays = Object.entries(form.daysOfWeek).filter(([_, v]) => v).length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recurring Weekly Schedule</h3>
            <p className="text-xs text-gray-500">Create lectures on repeat for selected days</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign Trainers *</label>
              <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                {trainers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">No trainers available</p>
                ) : trainers.map(t => {
                  const checked = form.trainerIds.includes(t.id);
                  return (
                    <label key={t.id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-indigo-50' : 'hover:bg-gray-100'}`}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        const next = checked ? form.trainerIds.filter(id => id !== t.id) : [...form.trainerIds, t.id];
                        setForm({ ...form, trainerIds: next });
                      }} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">{t.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{form.trainerIds.length} trainer{form.trainerIds.length !== 1 ? 's' : ''} selected</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Batch</label>
              <select value={recurringForm.batch} onChange={e => setRecurringForm({ ...recurringForm, batch: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                <option value="">All batches</option>
                <option value="Basic">Basic</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Division</label>
              <select value={recurringForm.division} onChange={e => setRecurringForm({ ...recurringForm, division: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                <option value="">All divisions</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Topic *</label>
            <input required value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="e.g. Arrays & Hashing" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Repeat on *</label>
            <div className="flex gap-1.5">
              {Object.entries(dayLabels).map(([key, label]) => (
                <button key={key} type="button" onClick={() => toggleDay(key)}
                  className={`w-10 h-10 rounded-xl text-xs font-medium transition-all ${form.daysOfWeek[key] ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            {activeDays === 0 && <p className="text-[10px] text-red-500 mt-1">Select at least one day</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Occurrences (default: 12)</label>
            <input type="number" min="1" max="100" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.notesRequired === false} onChange={e => setForm({ ...form, notesRequired: !e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
              <div>
                <span className="text-xs font-medium text-gray-700">Mark as Optional (no notes required)</span>
                <p className="text-[10px] text-gray-500">Check this if notes upload is NOT mandatory for these lectures</p>
              </div>
            </label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">Cancel</button>
            <button type="submit" disabled={activeDays === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm shadow-sm active:scale-95">Create Schedule</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LectureDetailModal = ({ lecture, onClose, canSchedule, onEdit, onCancel, onReschedule, onDelete }) => {
  if (!lecture) return null;
  const s = getStatusStyle(lecture);
  // Derive co-trainer info if present from grouped display
  const trainerLabel = lecture.trainerNamesLabel || lecture.trainerName || '';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{lecture.topic}</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2 text-gray-600"><Users className="w-4 h-4 text-gray-400" /><span>{trainerLabel}</span></div>
          <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" /><span>{formatDate(getLectureDate(lecture))}</span></div>
          {lecture.startTime && (
            <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-gray-400" /><span>{lecture.startTime}{lecture.endTime ? ` - ${lecture.endTime}` : ''}</span></div>
          )}
          {lecture.batch && <div><span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{lecture.batch}</span></div>}
          {lecture.description && <p className="text-gray-500 text-xs mt-2 p-3 bg-gray-50 rounded-lg">{lecture.description}</p>}
        </div>
        {canSchedule && (
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => { onClose(); onEdit(lecture); }}
              className="flex items-center gap-1.5 px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm font-medium"><Edit className="w-3.5 h-3.5" /> Edit</button>
            {lecture.status !== 'cancelled' && (
              <button onClick={() => onCancel(lecture)}
                className="flex items-center gap-1.5 px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl text-sm font-medium"><XCircle className="w-3.5 h-3.5" /> Cancel</button>
            )}
            <button onClick={() => onReschedule(lecture)}
              className="flex items-center gap-1.5 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-medium"><RotateCcw className="w-3.5 h-3.5" /> Reschedule</button>
            <button onClick={() => { if (window.confirm('Delete?')) onDelete(lecture.id); }}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DsaTimetable;
