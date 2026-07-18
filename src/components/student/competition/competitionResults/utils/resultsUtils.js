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
    // Use toLocaleString with explicit timezone to get parts, which handles DST correctly
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
    // toLocaleString produces e.g. "17 Jul 26, 4:28:42 pm"
    // Ensure seconds are present by appending :00 if missing
    const timeMatch = parts.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      const hh = timeMatch[1].padStart(2, '0');
      const mm = timeMatch[2];
      const ss = timeMatch[3] || '00';
      const ampm = timeMatch[4].toLowerCase();
      const rest = parts.replace(/\d{1,2}:\d{2}(?::\d{2})?\s*am\/pm/i, '').trim();
      return `${rest}, ${hh}:${mm}:${ss} ${ampm}`;
    }
    return parts;
  } catch { return String(dateStr); }
};
