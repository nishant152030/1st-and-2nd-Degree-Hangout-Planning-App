
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  name?: string; // Used for fallback initials
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'User avatar', size = 'md', className = '', name }) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm': sizeClasses = 'w-8 h-8 text-xs'; break;
    case 'md': sizeClasses = 'w-12 h-12 text-sm'; break;
    case 'lg': sizeClasses = 'w-16 h-16 text-base'; break;
    case 'xl': sizeClasses = 'w-24 h-24 text-xl'; break;
  }

  const getInitials = (userName?: string) => {
    if (!userName) return '';
    const names = userName.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`rounded-full flex items-center justify-center bg-slate-600 text-slate-200 overflow-hidden ${sizeClasses} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;
