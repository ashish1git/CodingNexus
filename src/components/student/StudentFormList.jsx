import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { studentService } from '../../services/studentService';
import toast from 'react-hot-toast';

const StudentFormList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchForms(); }, []);

  const fetchForms = async () => {
    try {
      const res = await studentService.getForms();
      if (res.success) setForms(res.data || []);
    } catch (e) { toast.error('Failed to load forms'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0b0b1a] flex items-center justify-center"><div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-[#0b0b1a] text-[#e2e8f0]">
      <div className="sticky top-0 z-50 bg-[#0f0a23]/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/student/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5"/>Dashboard</Link>
          <h1 className="text-lg font-bold">Forms & Surveys</h1>
          <div className="w-16"/>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {forms.length === 0 ? (
          <div className="text-center py-20 text-slate-500"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>No forms available</p></div>
        ) : (
          <div className="space-y-3">
            {forms.map(f => (
              <Link key={f.id} to={`/student/forms/${f.id}`} className="block bg-white/[0.04] border border-indigo-500/15 rounded-xl p-5 hover:border-indigo-500/30 transition">
                <div className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-indigo-400 mt-0.5"/>
                  <div>
                    <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold">{f.title}</h3><span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 text-[0.65rem] rounded-full">{f.formType}</span></div>
                    {f.description && <p className="text-sm text-slate-400">{f.description}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFormList;
