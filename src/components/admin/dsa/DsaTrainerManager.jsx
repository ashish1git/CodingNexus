import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus, Trash2, Loader2, CheckCircle, XCircle, Users, ToggleLeft, ToggleRight,
  Search, Shield, UserCog, Briefcase
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import dsaService from '../../../services/dsaService';

const DsaTrainerManager = () => {
  const { userDetails } = useAuth();
  const [allRoles, setAllRoles] = useState([]); // all DsaTrainer records with role field
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [assignRole, setAssignRole] = useState('TRAINER'); // 'TRAINER' or 'OPERATIONS'
  const [selectedAdminId, setSelectedAdminId] = useState('');

  const canManage = useMemo(() =>
    userDetails?.role === 'superadmin' || userDetails?.role === 'admin', [userDetails]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, availableRes] = await Promise.all([
      dsaService.getTrainers(),
      dsaService.getAvailableAdmins()
    ]);
    if (rolesRes.success) setAllRoles(rolesRes.trainers);
    if (availableRes.success) setAvailable(availableRes.available);
    setLoading(false);
  };

  const trainers = useMemo(() => allRoles.filter(r => r.role === 'TRAINER'), [allRoles]);
  const operations = useMemo(() => allRoles.filter(r => r.role === 'OPERATIONS'), [allRoles]);

  const handleAssign = async () => {
    if (!selectedAdminId) return;
    const res = await dsaService.assignTrainer(selectedAdminId, assignRole);
    if (res.success) { setShowAssign(false); setSelectedAdminId(''); fetchData(); }
  };

  const handleRemove = async (id, name, role) => {
    if (!confirm(`Remove ${name} from ${role === 'OPERATIONS' ? 'DSA Operations' : 'DSA Trainers'}?`)) return;
    const res = await dsaService.removeTrainer(id);
    if (res.success) fetchData();
  };

  const handleToggle = async (id) => {
    const res = await dsaService.toggleTrainer(id);
    if (res.success) fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>;
  }

  const openAssign = (role) => {
    setAssignRole(role);
    setSelectedAdminId('');
    setShowAssign(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Trainer Administration
          </h2>
          <p className="text-sm text-gray-500">
            {trainers.length} trainer{trainers.length !== 1 ? 's' : ''} · {operations.length} operation{operations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── DSA Trainers Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <UserCog className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">DSA Trainers</span>
          <span className="text-xs text-gray-500 ml-2">Conduct lectures and upload notes</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">{trainers.length} assigned</span>
            {canManage && (
              <button onClick={() => openAssign('TRAINER')}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors">
                <UserPlus className="w-3.5 h-3.5" /> Assign
              </button>
            )}
          </div>
        </div>
        {trainers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No DSA trainers assigned</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {trainers.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}>{t.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{t.name}</span>
                      {t.isActive ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">Trainer</span>
                    </div>
                    <div className="text-xs text-gray-500">{t.email}</div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(t.id)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title={t.isActive ? 'Deactivate' : 'Activate'}>
                      {t.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleRemove(t.id, t.name, t.role)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DSA Operations Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-gray-800">DSA Operations</span>
          <span className="text-xs text-gray-500 ml-2">Schedule, review notes, manage workflow</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">{operations.length} assigned</span>
            {canManage && (
              <button onClick={() => openAssign('OPERATIONS')}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors">
                <UserPlus className="w-3.5 h-3.5" /> Assign
              </button>
            )}
          </div>
        </div>
        {operations.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No DSA Operations assigned</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {operations.map(op => (
              <div key={op.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-xs text-purple-700">
                    {op.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{op.name}</span>
                      {op.isActive ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">Operations</span>
                    </div>
                    <div className="text-xs text-gray-500">{op.email}</div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(op.id)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title={op.isActive ? 'Deactivate' : 'Activate'}>
                      {op.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleRemove(op.id, op.name, op.role)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Role Info Banner ── */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Role Assignment Guide</p>
            <ul className="text-xs text-gray-600 mt-1 space-y-0.5 list-disc list-inside">
              <li><strong>DSA Trainer</strong> — Sub-admin who conducts lectures and uploads notes. View-only schedule access.</li>
              <li><strong>DSA Operations</strong> — Sub-admin who schedules lectures, reviews notes, and manages daily workflow.</li>
              <li><strong>Mutually exclusive</strong> — Each sub-admin can hold only one DSA role at a time.</li>
              <li><strong>Capabilities</strong> — Permissions (like manageDsaNotes) define what a user can <em>do</em>, not who they <em>are</em>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Assign Role Modal ── */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              {assignRole === 'OPERATIONS' ? (
                <Shield className="w-5 h-5 text-purple-600" />
              ) : (
                <Briefcase className="w-5 h-5 text-indigo-600" />
              )}
              <h3 className="text-lg font-bold text-gray-900">
                Assign DSA {assignRole === 'OPERATIONS' ? 'Operations' : 'Trainer'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Select a sub-admin to assign as {assignRole === 'OPERATIONS' ? 'DSA Operations' : 'DSA Trainer'}.
              Each sub-admin can hold only one DSA role.
            </p>
            {available.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No eligible sub-admins available.</p>
                <p className="text-xs text-gray-400 mt-1">All available users already have a DSA role assigned.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={selectedAdminId} onChange={e => setSelectedAdminId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer">
                    <option value="">Select an admin...</option>
                    {available.map(a => (
                      <option key={a.adminId} value={a.adminId}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowAssign(false); setSelectedAdminId(''); }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedAdminId}
                className={`flex-1 px-4 py-2 text-white rounded-xl font-medium text-sm shadow-sm active:scale-95 disabled:opacity-50 ${
                  assignRole === 'OPERATIONS' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}>
                Assign {assignRole === 'OPERATIONS' ? 'Operations' : 'Trainer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DsaTrainerManager;
