// src/components/shared/Card.jsx
import { classNames } from '../../utils/helpers';

const Card = ({ 
  children, 
  title, 
  subtitle,
  icon: Icon,
  className = '',
  headerAction,
  hover = false,
  onClick
}) => {
  return (
    <div 
      className={classNames(
        'bg-white rounded-lg shadow-md overflow-hidden transition-all',
        hover && 'hover:shadow-lg cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(title || Icon || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAction && (
            <div>{headerAction}</div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;