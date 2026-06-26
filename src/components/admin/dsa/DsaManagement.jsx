import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Users, FileText, Upload, LayoutDashboard,
  Calendar, BarChart3
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import dsaService from '../../../services/dsaService';
import DsaTrainerManager from './DsaTrainerManager';
import DsaTimetable from './DsaTimetable';
import DsaNoteUpload from './DsaNoteUpload';
import DsaNoteReview from './DsaNoteReview';
import DsaTrainerDashboard from './DsaTrainerDashboard';
import DsaOperationsDashboard from './DsaOperationsDashboard';

const ROLE = {
  SUPERADMIN: 'superadmin',
  OPERATIONS: 'operations',
  TRAINER: 'trainer',
};

const TABS = {
  [ROLE.SUPERADMIN]: [
    { key: 'timetable',   label: 'Timetable',                icon: Calendar },
    { key: 'trainers',    label: 'Trainer Administration',    icon: Users },
    { key: 'review',      label: 'Review Notes',             icon: FileText },
  ],
  [ROLE.OPERATIONS]: [
    { key: 'opsdashboard', label: 'Operations Dashboard',     icon: BarChart3 },
    { key: 'timetable',    label: 'Schedule',                 icon: Calendar },
    { key: 'review',       label: 'Review Notes',             icon: FileText },
  ],
  [ROLE.TRAINER]: [
    { key: 'dashboard',   label: 'My Dashboard',              icon: LayoutDashboard },
    { key: 'myschedule',  label: 'My Schedule',               icon: Calendar },
    { key: 'upload',      label: 'Upload Notes',              icon: Upload },
  ],
};

const DsaManagement = () => {
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dsaRole, setDsaRole] = useState(null); // 'TRAINER' | 'OPERATIONS' | null
  const [roleReady, setRoleReady] = useState(false);

  // Determine the user's DSA role from the explicit role API
  useEffect(() => {
    const check = async () => {
      try {
        const res = await dsaService.getMyDsaRole();
        if (res.success) setDsaRole(res.role);
      } catch {}
      setRoleReady(true);
    };
    check();
  }, []);

  const role = useMemo(() => {
    if (!userDetails) return null;
    if (userDetails.role === 'superadmin' || userDetails.role === 'admin') return ROLE.SUPERADMIN;
    if (dsaRole === 'OPERATIONS') return ROLE.OPERATIONS;
    if (dsaRole === 'TRAINER') return ROLE.TRAINER;
    return null;
  }, [userDetails, dsaRole]);

  const currentTabs = useMemo(() => (role ? TABS[role] : []), [role]);

  // Set default tab when role is known
  useEffect(() => {
    if (roleReady && currentTabs.length > 0) {
      const defaultTab = currentTabs[0].key;
      if (!activeTab || !currentTabs.some(t => t.key === activeTab)) {
        setActiveTab(defaultTab);
      }
    }
  }, [roleReady, currentTabs, activeTab]);

  // Listen for internal navigation events (from Operations Dashboard)
  useEffect(() => {
    const handler = (e) => {
      const tab = e.detail?.tab;
      if (tab && currentTabs.some(t => t.key === tab)) setActiveTab(tab);
    };
    window.addEventListener('dsa-navigate', handler);
    return () => window.removeEventListener('dsa-navigate', handler);
  }, [currentTabs]);

  const handleTabClick = (tab) => {
    setActiveTab(tab.key);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'timetable':
        return <DsaTimetable key={refreshKey} trainerView={false} />;
      case 'myschedule':
        return <DsaTimetable key={refreshKey} trainerView={true} />;
      case 'trainers':
        return <DsaTrainerManager key={refreshKey} />;
      case 'opsdashboard':
        return <DsaOperationsDashboard key={refreshKey} />;
      case 'upload':
        return <DsaNoteUpload key={refreshKey} onSuccess={() => setRefreshKey(r => r + 1)} />;
      case 'review':
        return <DsaNoteReview key={refreshKey} onAction={() => setRefreshKey(r => r + 1)} />;
      case 'dashboard':
      default:
        return <DsaTrainerDashboard key={refreshKey} />;
    }
  };

  if (!roleReady) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Access Restricted</p>
          <p className="text-sm">You don't have access to DSA Management features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors mb-2 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          DSA Management
        </h1>
        <p className="text-gray-500 mt-1">
          {role === ROLE.TRAINER && 'View your schedule, upload notes, and track your progress'}
          {role === ROLE.OPERATIONS && 'Manage DSA trainers, schedules, notes, and daily operations'}
          {role === ROLE.SUPERADMIN && 'Full oversight of DSA trainers, schedules, and notes review'}
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {currentTabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabClick(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};

export default DsaManagement;
