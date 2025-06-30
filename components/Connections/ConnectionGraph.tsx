import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../backend/src/types';
import { useAppContext } from '../../contexts/AppContext';
import UserCard from './UserCard';
import Button from '../UI/Button';

interface ConnectionGraphProps {
  currentUser: User;
  selectedHangoutParticipants: User[];
  onToggleParticipant: (user: User, type: 'first-degree' | 'second-degree') => void;
}

const ConnectionGraph: React.FC<ConnectionGraphProps> = ({ 
  currentUser, 
  selectedHangoutParticipants, 
  onToggleParticipant
}) => {
  const { allUsers } = useAppContext();
  const [centerNodeId, setCenterNodeId] = useState<string>(currentUser.id);
  
  const getRadius = () => {
    if (typeof window === 'undefined') return 220;
    if (window.innerWidth < 768) return 130; // sm
    if (window.innerWidth < 1024) return 180; // md
    return 220; // lg+
  };
  
  const [radius, setRadius] = useState(getRadius());

  useEffect(() => {
    const handleResize = () => setRadius(getRadius());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const centerNode = useMemo(() => allUsers.find(u => u.id === centerNodeId)!, [centerNodeId, allUsers]);
  const isTopLevelView = centerNodeId === currentUser.id;

  const connections = useMemo(() => {
    if (!centerNode) return [];
    // When viewing another node, we don't want to show the current user as a selectable participant again
    const connectionIds = isTopLevelView ? centerNode.firstDegreeFriendIds : centerNode.firstDegreeFriendIds.filter(id => id !== currentUser.id);

    return connectionIds
      .map(id => allUsers.find(u => u.id === id))
      .filter((u): u is User => !!u);
  }, [centerNode, allUsers, isTopLevelView, currentUser.id]);

  const handleNodeClick = (user: User) => {
    if (isTopLevelView && currentUser.firstDegreeFriendIds.includes(user.id)) {
      setCenterNodeId(user.id);
    }
  };

  const resetView = () => {
    setCenterNodeId(currentUser.id);
  };
  
  const isSelected = (user: User) => selectedHangoutParticipants.some(p => p.id === user.id);

  const getSecondDegreeStatus = (secondDegreeUser: User): 'approved' | 'needs_request' => {
    return currentUser.approvedSecondDegreeConnections.has(secondDegreeUser.id) ? 'approved' : 'needs_request';
  };

  const ConnectorLine: React.FC<{ angle: number; length: number }> = ({ angle, length }) => (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${length}px`,
        height: '2px',
        backgroundColor: '#38bdf8', // sky-500
        transformOrigin: '0% 0%',
        transform: `rotate(${angle}deg)`,
        zIndex: 1,
      }}
    />
  );
  
  if (!centerNode) return null;

  const numNodes = connections.length;
  const angleStep = numNodes > 0 ? 360 / numNodes : 0;

  return (
    <div className="flex flex-col items-center space-y-4 my-8">
      <h2 className="text-2xl font-bold text-sky-300 text-center">
        {isTopLevelView ? "Your Connections" : `Connections of ${centerNode.name}`}
      </h2>
       <div className="relative w-full min-h-[320px] md:min-h-[450px] flex items-center justify-center">
        {/* Render Lines */}
        {connections.map((_, i) => {
          const angle = angleStep * i - 90;
          return <ConnectorLine key={`line-${i}`} angle={angle} length={radius} />;
        })}

        {/* Render Center Node */}
        <div className="absolute z-20" >
           <div className={!isTopLevelView ? 'cursor-pointer' : ''} onClick={() => !isTopLevelView && resetView()}>
              <UserCard
                user={centerNode}
                type={isTopLevelView ? 'me' : 'first-degree'}
                isSelected={isSelected(centerNode)}
                onSelect={undefined} // FIX: Prevent "go back" click from toggling selection.
                isGraphNode
              />
           </div>
        </div>
        
        {/* Render Orbiting Nodes */}
        {connections.map((conn, i) => {
          const angle = (angleStep * i - 90) * (Math.PI / 180); // radians for JS Math
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          const style: React.CSSProperties = {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            zIndex: 10,
          };
          
          let nodeType: 'me' | 'first-degree' | 'second-degree' = 'second-degree';
          if (currentUser.firstDegreeFriendIds.includes(conn.id)) {
            nodeType = 'first-degree';
          }
          
          const secondDegreeStatus = nodeType === 'second-degree' ? getSecondDegreeStatus(conn) : undefined;
          
          return (
            <div
              key={conn.id}
              style={style}
              className={isTopLevelView ? 'cursor-pointer' : 'cursor-default'}
              onClick={() => handleNodeClick(conn)}
            >
              <UserCard
                user={conn}
                type={nodeType}
                isSelected={isSelected(conn)}
                onSelect={onToggleParticipant}
                isGraphNode
                secondDegreeStatus={secondDegreeStatus}
                connectionVia={isTopLevelView ? undefined : centerNode}
              />
            </div>
          );
        })}
      </div>
      <div className="text-center text-slate-400 mt-4 px-4">
        <p>
          {isTopLevelView 
            ? "Click a 1st degree friend to see their connections. Select people to start a hangout." 
            : `Viewing connections for ${centerNode.name}. Click their card to go back.`
          }
        </p>
      </div>
    </div>
  );
};

export default ConnectionGraph;