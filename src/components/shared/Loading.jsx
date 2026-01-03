// src/components/shared/Loading.jsx
import { Loader2 } from 'lucide-react';

const Loading = ({ 
  size = 'md', 
  fullScreen = false, 
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {content}
      </div>
    );
  }

  return content;
};

export const LoadingButton = ({ loading, children, ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${props.className} relative`}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin absolute left-4" />
      )}
      <span className={loading ? 'opacity-50' : ''}>{children}</span>
    </button>
  );
};

export default Loading;