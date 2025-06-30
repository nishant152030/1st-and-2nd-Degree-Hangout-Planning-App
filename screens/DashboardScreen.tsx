import React, { useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { User, Hangout } from '../backend/src/types';
import ConnectionGraph from '../components/Connections/ConnectionGraph';
import CreateHangoutForm from '../components/Hangouts/CreateHangoutForm';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Avatar from '../components/UI/Avatar';

const getStatusPill = (status: Hangout['status']) => {
  switch (status) {
    case 'pending_approval':
      return <span className="capitalize font-medium text-yellow-400">{status.replace('_', ' ')}</span>;
    case 'pending':
      return <span className="capitalize font-medium text-sky-400">{status}</span>;
    case 'confirmed':
      return <span className="capitalize font-medium text-green-400">{status}</span>;
    case 'cancelled':
      // This case might not be rendered in the list anymore, but kept for completeness
      return <span className="capitalize font-medium text-slate-500">{status}</span>;
    default:
      return <span className="capitalize font-medium">{status}</span>;
  }
}

interface DashboardScreenProps {
  onProfileClick: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onProfileClick }) => {
  const { currentUser, logout, createHangout, cancelHangout, acceptHangout, rejectHangout, connectionRequests, handleConnectionApproval, hangouts, allUsers } = useAppContext();
  const [selectedHangoutParticipants, setSelectedHangoutParticipants] = useState<User[]>([]);
  const [isCreateHangoutModalOpen, setIsCreateHangoutModalOpen] = useState(false);
  const [hangoutToCancel, setHangoutToCancel] = useState<Hangout | null>(null);

  const handleToggleParticipant = useCallback((user: User, type: 'first-degree' | 'second-degree') => {
    setSelectedHangoutParticipants(prev => {
      if (prev.some(p => p.id === user.id)) {
        return prev.filter(p => p.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  }, []);

  const handleCreateHangoutSubmit = (activityDescription: string, details: string) => {
    if (!currentUser) return;
    createHangout({
      participants: selectedHangoutParticipants,
      activityDescription,
      details,
    });
    setSelectedHangoutParticipants([]);
    setIsCreateHangoutModalOpen(false);
  };
  
  const handleLogout = () => {
    logout();
  };

  const handleConfirmCancel = () => {
    if (hangoutToCancel) {
      cancelHangout(hangoutToCancel.id);
      setHangoutToCancel(null);
    }
  };

  if (!currentUser) {
    return <div className="p-8 text-center text-red-400">Error: No current user data. Please try logging in again.</div>;
  }

  const userHangouts = hangouts.filter(h => 
    h.status !== 'cancelled' && 
    (h.hostId === currentUser.id || h.participants.some(p => p.id === currentUser.id))
  );

  const myPendingApprovalRequests = connectionRequests.filter(req => 
    req.approverId === currentUser.id && req.status === 'pending'
  );

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 pb-20">
      <header className="bg-slate-900 shadow-lg p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center cursor-pointer group" onClick={onProfileClick}>
          <Avatar src={currentUser.profileImageUrl} name={currentUser.name} size="md" className="mr-3 border-2 border-sky-400 group-hover:border-sky-300 transition-colors"/>
          <div>
            <h1 className="text-xl font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">Hey, {currentUser.name}!</h1>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Click to view/edit profile.</p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="ghost" size="sm">Logout</Button>
      </header>

      <main className="container mx-auto px-2 py-6">
        {myPendingApprovalRequests.length > 0 && (
          <div className="mb-8 p-4 md:p-6 bg-slate-700/50 rounded-lg shadow-lg border border-yellow-500">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Action Required: Connection Requests</h2>
              <div className="space-y-4">
                {myPendingApprovalRequests.map(req => {
                  const requester = allUsers.find(u => u.id === req.requesterId);
                  const requested = allUsers.find(u => u.id === req.requestedId);
                  const hangout = hangouts.find(h => h.id === req.hangoutId);
                  if (!requester || !requested) return null;

                  return (
                    <div key={req.id} className="bg-slate-800 p-4 rounded-md flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-center sm:text-left">
                        <Avatar src={requester.profileImageUrl} name={requester.name} size="md" />
                        <p className="text-slate-300">
                          <strong className="font-semibold text-sky-400">{requester.name}</strong> wants to connect with <strong className="font-semibold text-teal-400">{requested.name}</strong>
                          {hangout && <span className="block text-xs text-slate-400">for hangout: "{hangout.activityDescription}"</span>}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        <Button onClick={() => handleConnectionApproval(req.id, 'approved')} variant="primary" size="sm">Approve</Button>
                        <Button onClick={() => handleConnectionApproval(req.id, 'rejected')} variant="danger" size="sm">Reject</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}

        <ConnectionGraph 
          currentUser={currentUser}
          selectedHangoutParticipants={selectedHangoutParticipants}
          onToggleParticipant={handleToggleParticipant}
        />

        {selectedHangoutParticipants.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] z-30 border-t border-slate-700">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-grow w-full sm:w-auto">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-slate-200">Selected ({selectedHangoutParticipants.length}):</p>
                  <button
                    onClick={() => setSelectedHangoutParticipants([])}
                    title="Deselect all"
                    aria-label="Deselect all participants"
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 hover:bg-red-500 text-slate-300 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <span className="text-xl leading-none pb-0.5">&times;</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedHangoutParticipants.slice(0,5).map(p => (
                    <span key={p.id} className="text-xs bg-sky-600 px-2 py-0.5 rounded-full">{p.name}</span>
                  ))}
                  {selectedHangoutParticipants.length > 5 && <span className="text-xs bg-sky-600 px-2 py-0.5 rounded-full">+{selectedHangoutParticipants.length - 5} more</span>}
                </div>
              </div>
              <div className="w-full sm:w-auto flex-shrink-0">
                <Button onClick={() => setIsCreateHangoutModalOpen(true)} size="lg" fullWidth>
                  Create Hangout ({selectedHangoutParticipants.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        <Modal 
          isOpen={isCreateHangoutModalOpen} 
          onClose={() => setIsCreateHangoutModalOpen(false)}
          title="Plan Your Hangout"
          size="md"
        >
          <CreateHangoutForm 
            participants={selectedHangoutParticipants}
            onSubmit={handleCreateHangoutSubmit}
            onClose={() => setIsCreateHangoutModalOpen(false)}
          />
        </Modal>

        <Modal
          isOpen={!!hangoutToCancel}
          onClose={() => setHangoutToCancel(null)}
          title="Confirm Cancellation"
          size="sm"
        >
          {hangoutToCancel && (
            <div className="space-y-6 text-center">
              <p className="text-slate-300">
                Are you sure you want to cancel the hangout: <br />
                <strong className="font-semibold text-sky-300">"{hangoutToCancel.activityDescription}"</strong>?
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="ghost" onClick={() => setHangoutToCancel(null)}>
                  Keep Hangout
                </Button>
                <Button variant="danger" onClick={handleConfirmCancel}>
                  Confirm Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {userHangouts.length > 0 && (
          <div className="mt-12 p-4 md:p-6 bg-[#162133] rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-sky-300 mb-6 text-center">Your Hangouts</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {userHangouts.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(hangout => {
                 const memberMap = new Map<string, User>();
                 const host = allUsers.find(u => u.id === hangout.hostId);
                 if (host) {
                   memberMap.set(host.id, host);
                 }
                 hangout.participants.forEach(p => {
                   memberMap.set(p.id, p);
                 });
                 const allHangoutMembers = Array.from(memberMap.values());
                
                 const isParticipant = hangout.participants.some(p => p.id === currentUser.id);
                 const hasAccepted = hangout.acceptedBy.includes(currentUser.id);
                 
                 let canRespond = false;
                 if (isParticipant) {
                   const isFirstDegreeWithHost = host ? host.firstDegreeFriendIds.includes(currentUser.id) : false;

                   // A user can always change their mind if the hangout is confirmed
                   if (hangout.status === 'confirmed') {
                     canRespond = true;
                   // 1st-degree friends can respond to pending_approval or pending
                   } else if (isFirstDegreeWithHost && (hangout.status === 'pending' || hangout.status === 'pending_approval')) {
                     canRespond = true;
                   // 2nd-degree friends can only respond to pending (after approval)
                   } else if (!isFirstDegreeWithHost && hangout.status === 'pending') {
                     canRespond = true;
                   }
                 }

                return (
                  <div key={hangout.id} className="p-4 bg-slate-700 rounded-lg shadow-md flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-sky-400">{hangout.activityDescription}</h3>
                      {hangout.details && (
                        <p className="text-sm text-slate-300 mb-2"><span className="font-semibold text-sky-300">Details:</span> {hangout.details}</p>
                      )}
                      <p className="text-xs text-slate-400 mb-3">Status: {getStatusPill(hangout.status)} | {hangout.timestamp.toLocaleString()}</p>
                      
                      <div>
                        <p className="text-xs text-slate-300 font-semibold mb-2">
                          Responses ({hangout.acceptedBy.length}/{allHangoutMembers.length} accepted):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {allHangoutMembers.map(p => {
                            const hasUserAccepted = hangout.acceptedBy.includes(p.id);
                            const hasUserRejected = hangout.rejectedBy?.includes(p.id);
                            
                            let statusClass = 'bg-slate-600 text-slate-400';
                            let opacityClass = 'opacity-50';
                            let title = `${p.name} (pending)`;

                            if (hasUserAccepted) {
                                statusClass = 'bg-green-500/30 text-green-300';
                                opacityClass = 'opacity-100';
                                title = `${p.name} (Accepted)`;
                            } else if (hasUserRejected) {
                                statusClass = 'bg-red-500/30 text-red-300';
                                opacityClass = 'opacity-100';
                                title = `${p.name} (Rejected)`;
                            }

                            return (
                              <span key={p.id} title={title} className={`flex items-center text-xs px-2 py-0.5 rounded-full transition-all ${statusClass}`}>
                                <Avatar src={p.profileImageUrl} name={p.name} size="sm" className={`w-4 h-4 mr-1.5 transition-opacity ${opacityClass}`} />
                                {p.name}
                                {p.id === hangout.hostId && <span className="ml-1 text-yellow-400" title="Host">★</span>}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-end gap-2 w-full sm:w-auto">
                        { hangout.hostId === currentUser.id && hangout.status !== 'cancelled' && (
                          <Button onClick={() => setHangoutToCancel(hangout)} variant="danger" size="sm" className="w-full sm:w-auto">Cancel</Button>
                        )}
                        {canRespond && (
                          hasAccepted ? (
                            <Button onClick={() => rejectHangout(hangout.id)} variant="danger" size="sm" className="w-full sm:w-auto">Reject</Button>
                          ) : (
                            <Button onClick={() => acceptHangout(hangout.id)} variant="primary" size="sm" className="w-full sm:w-auto">Accept</Button>
                          )
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardScreen;