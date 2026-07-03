import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Cpu, HardDrive, Activity, Database, Server, RefreshCw, RotateCcw, CheckCircle, XCircle, AlertTriangle, Zap, Monitor, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';

const POLL_INTERVAL = 15000;

const StatusBadge = ({ status }) => {
  const config = {
    healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Healthy' },
    busy: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Busy' },
    down: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Down' },
    unknown: { icon: AlertTriangle, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Unknown' }
  };
  const c = config[status] || config.unknown;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.color}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

const MetricCard = ({ icon: Icon, title, value, sub, status, color = 'indigo' }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 bg-${color}-100 rounded-lg`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      {status !== undefined && <StatusBadge status={status} />}
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
    <p className="text-gray-600 text-sm">{title}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const MonitoringDashboard = () => {
  const { userDetails } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [judge0, setJudge0] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const authToken = localStorage.getItem('token') || '';
  const netdataUrl = `/api/admin/monitoring/netdata?token=${encodeURIComponent(authToken)}`;

  const fetchData = useCallback(async (showToast = false) => {
    try {
      const [metricsRes, judge0Res] = await Promise.all([
        adminService.getSystemStatus(),
        adminService.getJudge0Status()
      ]);

      if (metricsRes?.success) setMetrics(metricsRes.data);
      if (judge0Res?.success) setJudge0(judge0Res.data);

      setLoading(false);
      if (showToast) toast.success('Status refreshed');
    } catch (error) {
      if (showToast) toast.error('Failed to refresh');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleRestartWorkers = async () => {
    if (!window.confirm('Restart all Judge0 workers? This will interrupt running submissions.')) return;
    try {
      const res = await adminService.restartJudge0Workers();
      if (res?.success) {
        toast.success(res.data?.message || 'Workers restarted');
        fetchData();
      } else {
        toast.error(res?.error || 'Failed to restart workers');
      }
    } catch (error) {
      toast.error('Failed to restart workers');
    }
  };

  const handleRestartServer = async () => {
    if (!window.confirm('Restart Judge0 API server? This will interrupt ALL code execution.')) return;
    try {
      const res = await adminService.restartJudge0Server();
      if (res?.success) {
        toast.success(res.data?.message || 'Server restarted');
        fetchData();
      } else {
        toast.error(res?.error || 'Failed to restart server');
      }
    } catch (error) {
      toast.error('Failed to restart server');
    }
  };

  if (userDetails?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only Super Admin can access server monitoring.</p>
          <Link to="/admin/dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  const m = metrics || {};
  const j = judge0 || {};
  const diskNum = parseInt(m.diskPct) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Monitor className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-800">Server Monitoring</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                  autoRefresh
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => fetchData(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* System Resources */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">System Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Cpu} title="CPU Usage" value={m.cpu || 'N/A'} sub={`${m.cores || '?'} cores`} color="blue" />
          <MetricCard icon={HardDrive} title="RAM Usage" value={m.ram || 'N/A'} sub={`Used: ${m.ramUsed || '?'} / ${m.ramTotal || '?'}`} color="purple" />
          <MetricCard icon={Server} title="Disk Usage" value={m.diskPct || 'N/A'} sub={`Free: ${m.diskAvail || '?'}`} color={diskNum > 85 ? 'red' : 'green'} />
          <MetricCard icon={Activity} title="Load Average" value={m.loadAvg ? m.loadAvg[0] : 'N/A'} sub={`5m: ${m.loadAvg ? m.loadAvg[1] : '?'} | 15m: ${m.loadAvg ? m.loadAvg[2] : '?'}`} color="orange" />
        </div>

        {/* Service Health */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Zap} title="Node.js API" value="Running" sub={`Port ${m.uptime ? '3000' : '?'}`} status={m.nodeStatus || 'healthy'} color="indigo" />
          <MetricCard icon={Database} title="Database" value={m.dbStatus === 'healthy' ? 'Connected' : 'Down'} status={m.dbStatus || 'unknown'} color="blue" />
          <MetricCard icon={Server} title="Judge0 API" value={m.judge0Version || '?'} sub={j.judge0Url || ''} status={m.judge0Status || 'unknown'} color={m.judge0Status === 'healthy' ? 'green' : 'red'} />
          <MetricCard
            icon={AlertTriangle}
            title="Disk Alert"
            value={diskNum > 85 ? 'WARNING' : 'OK'}
            sub={diskNum > 85 ? `${100 - diskNum}% remaining` : 'Enough space'}
            status={diskNum > 85 ? 'down' : 'healthy'}
            color={diskNum > 85 ? 'red' : 'green'}
          />
        </div>

        {/* Judge0 Workers */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Judge0 Workers</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestartWorkers}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-100 transition border border-orange-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Workers
            </button>
            <button
              onClick={handleRestartServer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition border border-red-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Server
            </button>
          </div>
        </div>

        {/* Worker Cards */}
        {(!j.workerContainers || j.workerContainers.length === 0) ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center mb-8">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-gray-600">No worker containers detected</p>
            <p className="text-xs text-gray-400 mt-1">Docker socket may not be accessible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {j.workerContainers.map((c, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 text-sm truncate">{c.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.running ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {c.running ? 'Running' : 'Stopped'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>CPU:</span>
                    <span className="font-medium text-gray-800">{c.cpu || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Memory:</span>
                    <span className="font-medium text-gray-800">{c.memory || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Health:</span>
                    <StatusBadge status={c.health || (c.running ? 'healthy' : 'down')} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Netdata iframe */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Netdata Dashboard</h2>
            <a href="http://localhost:19999" target="_blank" rel="noopener noreferrer"
               className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Open in new tab →
            </a>
          </div>
          <iframe
            src={netdataUrl}
            className="w-full border-0"
            style={{ height: '600px' }}
            title="Netdata Dashboard"
            loading="lazy"
          />
        </div>

        {/* Server Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Server Info</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Hostname:</span>
              <p className="font-medium text-gray-800">{m.hostname || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Uptime:</span>
              <p className="font-medium text-gray-800">{m.uptime ? `${Math.floor(m.uptime / 3600)}h ${Math.floor((m.uptime % 3600) / 60)}m` : 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Judge0 URL:</span>
              <p className="font-medium text-gray-800 truncate">{j.judge0Url || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <p className="font-medium text-gray-800">{m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
