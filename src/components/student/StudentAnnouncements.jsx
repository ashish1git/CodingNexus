import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { studentService } from '../../services/studentService';

/**
 * Convert plain-text URLs into clickable <a> elements.
 */
const linkify = (text) => {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300 break-all">{part}</a>;
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
};

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(announcements);
    } else {
      const q = search.toLowerCase();
      setFiltered(announcements.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q)
      ));
    }
  }, [announcements, search]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await studentService.getAnnouncements();
      if (res.success && res.data) {
        setAnnouncements(res.data.map(a => ({
          ...a,
          createdAt: new Date(a.createdAt)
        })));
      }
    } catch (e) {
      console.error('Failed to load announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#0b0b1a] text-[#e2e8f0]">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#0f0a23]/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/student/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </Link>
          <h1 className="text-lg font-bold">📢 Announcements</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text" placeholder="Search announcements…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-indigo-500/25 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{search ? 'No matching announcements' : 'No announcements yet'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(ann => {
              const body = ann.message || ann.content || '';
              const expanded = expandedIds[ann.id];
              const isLong = body.length > 200;
              const displayBody = expanded ? body : body.substring(0, 200);

              return (
                <div key={ann.id}
                  className="bg-white/[0.04] border border-indigo-500/15 rounded-xl p-5 hover:border-indigo-500/30 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <Bell className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold">{ann.title}</h3>
                        {ann.batch && ann.batch !== 'all' && (
                          <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 text-[0.65rem] font-semibold rounded-full">
                            {ann.batch}
                          </span>
                        )}
                        {ann.division && (
                          <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 text-[0.65rem] font-semibold rounded-full">
                            🎓 {ann.division}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 leading-relaxed">
                        {linkify(displayBody)}
                        {isLong && !expanded && <span className="text-slate-600">…</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-slate-600">
                          {ann.createdAt?.toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {isLong && (
                          <button
                            onClick={() => toggleExpand(ann.id)}
                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            {expanded ? 'Collapse' : 'Read more'}
                            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back to top */}
        {filtered.length > 10 && (
          <div className="text-center mt-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Back to top ↑
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncements;
