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
  if (!dateStr) return 'Pending';
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'short',
    timeStyle: 'short'
  });
};
