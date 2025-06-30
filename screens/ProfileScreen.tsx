import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Avatar from '../components/UI/Avatar';
import Modal from '../components/UI/Modal';
import { MAX_FIRST_DEGREE_FRIENDS } from '../backend/src/constants';

interface ProfileScreenProps {
  onBack: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { currentUser, updateUser, allUsers } = useAppContext();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profileImageUrl, setProfileImageUrl] = useState(currentUser?.profileImageUrl || '');
  const [friendIds, setFriendIds] = useState<string[]>(currentUser?.firstDegreeFriendIds || []);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setBio(currentUser.bio);
      setProfileImageUrl(currentUser.profileImageUrl);
      setFriendIds(currentUser.firstDegreeFriendIds);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    setFriendIds(prev => prev.filter(id => id !== friendId));
  };

  const handleToggleFriendInModal = (friendId: string) => {
    setFriendIds(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        if (prev.length >= MAX_FIRST_DEGREE_FRIENDS) {
          alert(`You can have a maximum of ${MAX_FIRST_DEGREE_FRIENDS} friends.`);
          return prev;
        }
        return [...prev, friendId];
      }
    });
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setMessage('');
    
    if (!name.trim()) {
        setMessage('Name cannot be empty.');
        setIsLoading(false);
        return;
    }
    
    try {
      await updateUser(currentUser.id, {
        profileData: { name, bio, profileImageUrl },
        friendIds: friendIds,
      });
      setMessage('Profile and connections updated successfully!');
    } catch (error: any) {
        setMessage(`Update failed: ${error.message}`);
    } finally {
        setIsLoading(false);
        setTimeout(() => setMessage(''), 3000);
    }
  };

  const potentialFriends = allUsers.filter(u => 
      u.id !== currentUser.id && 
      !friendIds.includes(u.id) &&
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4">
        <div className="w-full max-w-2xl">
          <header className="flex items-center justify-between p-4 relative">
              <Button onClick={onBack} variant="ghost" className="absolute left-0">
                &larr; Back
              </Button>
              <h1 className="text-2xl font-bold text-sky-400 mx-auto">Edit Profile</h1>
          </header>

          <main className="p-6 bg-slate-800 rounded-lg shadow-xl mt-4">
              <div className="space-y-6">
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                  />
                  <div className="flex flex-col items-center space-y-3">
                      <div onClick={handleAvatarClick} className="cursor-pointer relative group">
                          <Avatar src={profileImageUrl} alt="Your profile picture" size="xl" name={name} />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-slate-200 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                              <span className="text-lg">Change</span>
                          </div>
                      </div>
                  </div>

                  <Input
                      label="Name"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                  />
                  
                  <Input
                      label="Bio"
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={100}
                  />
                  
                  <Input
                      label="Phone Number (cannot be changed)"
                      id="phone"
                      value={currentUser.phoneNumber}
                      disabled
                      className="cursor-not-allowed bg-slate-700/50"
                  />
              </div>

              {/* Connections Management */}
              <div className="space-y-4 pt-6 mt-6 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-200">
                    1st Degree Connections ({friendIds.length}/{MAX_FIRST_DEGREE_FRIENDS})
                  </h3>
                  <Button onClick={() => setIsAddFriendModalOpen(true)} size="sm" variant="secondary" disabled={friendIds.length >= MAX_FIRST_DEGREE_FRIENDS}>
                    + Add
                  </Button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {friendIds.length > 0 ? (
                    allUsers
                      .filter(u => friendIds.includes(u.id))
                      .map(friend => (
                        <div key={friend.id} className="flex items-center justify-between bg-slate-700/80 p-2 rounded-md">
                          <div className="flex items-center gap-3">
                            <Avatar src={friend.profileImageUrl} name={friend.name} size="md" />
                            <span className="font-medium">{friend.name}</span>
                          </div>
                          <button onClick={() => handleRemoveFriend(friend.id)} title={`Remove ${friend.name}`} className="text-red-400 hover:text-red-300 font-bold text-xl px-2">&times;</button>
                        </div>
                      ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">You haven't added any connections yet.</p>
                  )}
                </div>
              </div>


              {message && <p className={`mt-6 text-center py-2 rounded-md ${message.includes('successfully') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{message}</p>}

              <div className="pt-6 mt-6 border-t border-slate-700 flex justify-end">
                  <Button onClick={handleSaveChanges} disabled={isLoading} size="lg">
                      {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
              </div>
          </main>
        </div>
      </div>

      <Modal isOpen={isAddFriendModalOpen} onClose={() => setIsAddFriendModalOpen(false)} title="Add New Friends" size="md">
        <div className="space-y-4">
          <Input 
            placeholder="Search for people..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
            {potentialFriends.length > 0 ? (
              potentialFriends.map(user => {
                const isFriend = friendIds.includes(user.id);
                return (
                  <div 
                    key={user.id} 
                    onClick={() => handleToggleFriendInModal(user.id)}
                    className={`flex items-center p-3 rounded-lg transition-all ${isFriend ? 'bg-sky-600 ring-2 ring-sky-400' : 'bg-slate-700 hover:bg-slate-600 cursor-pointer'}`}
                  >
                    <Avatar src={user.profileImageUrl} name={user.name} size="md" className="mr-4"/>
                    <div>
                      <p className="font-semibold text-slate-100">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.bio}</p>
                    </div>
                     {isFriend && <span className="ml-auto text-sky-300 text-2xl">✓</span>}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-400 py-4">No users found.</p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsAddFriendModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProfileScreen;