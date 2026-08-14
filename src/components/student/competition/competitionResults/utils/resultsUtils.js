// Smoothly scroll to an element by id (used to bring the student's
// leaderboard row / reviewed problem into view)
export const scrollToId = (id, options = {}) => {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center', ...options });
  return true;
};

export const getStatusColor = (status) => {
  const colors = {
    'accepted': 'text-green-600 bg-green-50',
    'wrong-answer': 'text-red-600 bg-red-50',
    'tle': 'text-yellow-600 bg-yellow-50',
    'runtime-error': 'text-orange-600 bg-orange-50',
    'compile-error': 'text-purple-600 bg-purple-50',
    'pending': 'text-gray-600 bg-gray-50',
    'judging': 'text-blue-600 bg-blue-50',
    'completed': 'text-green-600 bg-green-50',
    'failed': 'text-red-600 bg-red-50'
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
};

export const getStatusIcon = (status) => {
  const icons = {
    'accepted': '✅',
    'wrong-answer': '❌',
    'tle': '⏱️',
    'runtime-error': '⚠️',
    'compile-error': '🔧',
    'pending': '⏳',
    'judging': '🔄',
    'completed': '✅',
    'failed': '❌'
  };
  return icons[status] || '•';
};

export const formatTime = (ms) => {
  if (!ms) return 'N/A';
  return `${(ms / 1000).toFixed(3)}s`;
};

export const formatMemory = (kb) => {
  if (!kb) return 'N/A';
  return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb} KB`;
};

export const getDifficultyStyle = (difficulty) => {
  const styles = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };
  return styles[difficulty] || 'bg-gray-100 text-gray-800';
};

export const formatIST = (dateStr) => {
  if (!dateStr) return '\u2014';
  try {
    // Use toLocaleString with explicit timezone — this already produces e.g.
    // "13 Aug 26, 10:01:50 am" in en-IN, so we just normalize it without
    // re-appending the time (which caused "10:01:50 am, 10:01:50 am").
    const parts = new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    // Ensure seconds are present by appending :00 if missing
    const timeMatch = parts.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      if (timeMatch[3]) return parts;
      const hh = timeMatch[1].padStart(2, '0');
      const mm = timeMatch[2];
      const ampm = timeMatch[4].toLowerCase();
      const rest = parts.replace(/\d{1,2}:\d{2}(?::\d{2})?\s*am\/pm/i, '').trim();
      return `${rest}, ${hh}:${mm}:00 ${ampm}`;
    }
    return parts;
  } catch { return String(dateStr); }
};
