import React from 'react';

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  inline?: boolean; // If true, render as block in flow
}

const typeStyles: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-black',
};

const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose, inline }) => {
  const className = inline
    ? `w-full px-4 py-2 rounded mb-2 flex items-center gap-3 ${typeStyles[type]}`
    : `fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg flex items-center gap-3 ${typeStyles[type]}`;
  return (
    <div className={className} role="alert">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-lg font-bold focus:outline-none">&times;</button>
    </div>
  );
};

export default Alert;
