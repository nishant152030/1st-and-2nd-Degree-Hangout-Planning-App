import React from 'react';
import { User } from '../../backend/src/types';
import Avatar from '../UI/Avatar';
import Button from '../UI/Button';

interface UserCardProps {
  user: User;
  type: 'me' | 'first-degree' | 'second-degree';
  isSelected?: boolean;
  onSelect?: (user: User, type: 'first-degree' | 'second-degree') => void;
  isGraphNode?: boolean;
  secondDegreeStatus?: 'approved' | 'needs_request';
  connectionVia?: User; // The 1st degree friend connecting to this 2nd degree user
}

const UserCard: React.FC<UserCardProps> = ({ 
    user, 
    type, 
    isSelected, 
    onSelect, 
    isGraphNode = false,
    secondDegreeStatus,
    connectionVia 
}) => {
  let borderColor = 'border-slate-600';
  let bgColor = 'bg-slate-700 hover:bg-slate-600';
  let cursor = 'cursor-pointer';

  if (isSelected) {
    borderColor = 'border-green-400 ring-2 ring-green-400';
    bgColor = 'bg-slate-600';
  } else if (type === 'me') {
    borderColor = 'border-sky-400';
  } else if (type === 'first-degree') {
    borderColor = 'border-pink-500';
  } else if (type === 'second-degree') {
    switch (secondDegreeStatus) {
      case 'approved':
        borderColor = 'border-teal-400';
        break;
      case 'needs_request':
        borderColor = 'border-yellow-500';
        break;
      default:
        borderColor = 'border-slate-600';
    }
  }

  const handleCardClick = () => {
    if (onSelect && (type === 'first-degree' || type === 'second-degree')) {
        onSelect(user, type);
    }
  };

  const getSecondDegreeLabel = () => {
    switch(secondDegreeStatus) {
        case 'approved':
            return <span className="text-xs px-2 py-0.5 bg-teal-500 text-white rounded-full">2nd (Approved)</span>;
        case 'needs_request':
            return <span className="text-xs px-2 py-0.5 bg-yellow-600 text-white rounded-full">Needs Approval</span>;
        default:
            return null;
    }
  }

  const baseClasses = `shadow-md border-2 ${borderColor} ${bgColor} transition-all duration-150 flex flex-col items-center justify-center text-center transform hover:scale-105`;
  const layoutClasses = isGraphNode 
    ? `rounded-full w-24 h-24 md:w-28 md:h-28 p-2 ${onSelect ? 'cursor-pointer' : 'cursor-default'}`
    : `rounded-lg w-full max-w-xs p-3 ${cursor}`;
  
  return (
    <div 
      className={`${baseClasses} ${layoutClasses}`}
      onClick={handleCardClick}
    >
        <Avatar src={user.profileImageUrl} name={user.name} size={isGraphNode ? 'sm' : 'lg'} className="mb-1" />
        <h3 className={`font-semibold text-slate-100 ${isGraphNode ? 'text-xs' : 'text-lg'} w-full truncate`}>{user.name}</h3>
        {!isGraphNode && <p className="text-xs text-slate-400 mb-1">{user.bio.substring(0,30)}{user.bio.length > 30 ? '...' : ''}</p>}
        {type === 'second-degree' && connectionVia && !isGraphNode && (
            <p className="text-xs text-slate-500 italic">via {connectionVia.name}</p>
        )}
        <>
          {!isGraphNode && (
            <div className="mt-1">
              {type === 'me' && <span className="text-xs px-2 py-0.5 bg-sky-500 text-white rounded-full">Me</span>}
              {type === 'first-degree' && <span className="text-xs px-2 py-0.5 bg-pink-500 text-white rounded-full">1st Degree</span>}
              {type === 'second-degree' && getSecondDegreeLabel()}
            </div>
          )}
          {isGraphNode && type === 'me' && (
            <div className="mt-1 scale-75">
              <span className="text-xs px-2 py-0.5 bg-sky-500 text-white rounded-full">Me</span>
            </div>
          )}
        </>
    </div>
  );
};

export default UserCard;
