import React, { useState, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { User } from '../backend/src/types';
import { MAX_FIRST_DEGREE_FRIENDS } from '../backend/src/constants';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Avatar from '../components/UI/Avatar';

// --- LoginForm Component Logic ---
const LoginForm: React.FC<{ onSwitchToSignup: () => void }> = ({ onSwitchToSignup }) => {
  const { login } = useAppContext();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Phone number validation
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    setIsLoading(true);
    const success = await login(phoneNumber, password);
    setIsLoading(false);
    if (!success) {
      setError('Invalid phone number or password.');
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">Login</h2>
      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
      <Input
        label="Phone Number"
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
        placeholder="e.g., 5550000001"
        disabled={isLoading}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="••••••••"
        disabled={isLoading}
      />
      <Button type="submit" fullWidth size="lg" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
      <div className="text-center mt-4">
        <Button variant="ghost" type="button" onClick={onSwitchToSignup} className="border-none">
          Don't have an account? Sign Up
        </Button>
      </div>
    </form>
  );
};

// --- SignupForm Component Logic ---
const SignupForm: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const { signup, allUsers, fetchAllUsersPublic } = useAppContext();
  const [step, setStep] = useState<'profile' | 'otp' | 'friends'>('profile');
  
  // Profile state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(`https://picsum.photos/seed/${Date.now()}/200/200`);
  
  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');

  // Friends state
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  
  // Control state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Phone number validation
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    console.log(`[DEMO] OTP for ${phoneNumber}: ${otp}`);
    setStep('otp');
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpInput === generatedOtp) {
      setStep('friends');
    } else {
      setError('Incorrect OTP. Please try again.');
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else if (newSet.size < MAX_FIRST_DEGREE_FRIENDS) {
        newSet.add(friendId);
      } else {
        alert(`You can select up to ${MAX_FIRST_DEGREE_FRIENDS} close friends.`);
      }
      return newSet;
    });
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError('');
    const newUser: Omit<User, 'id' | 'approvedSecondDegreeConnections'> = {
      name,
      bio,
      profileImageUrl,
      phoneNumber,
      password,
      firstDegreeFriendIds: Array.from(selectedFriendIds),
    };
    
    const success = await signup(newUser);
    setIsLoading(false);
    if (!success) {
      setError("Failed to create account. This phone number might already be taken.");
      setStep('profile');
    }
  };

  const renderProfileStep = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-4">
      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
      <div className="flex flex-col items-center space-y-3">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
        />
        <div onClick={handleAvatarClick} className="cursor-pointer relative group">
            <Avatar src={profileImageUrl} alt="Profile Preview" size="xl" name={name} />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-slate-200 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                <span className="font-semibold">Change</span>
            </div>
        </div>
      </div>
      <Input label="Name*" type="text" value={name} onChange={e => setName(e.target.value)} required />
      <Input label="Phone Number*" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="e.g., 555-123-4567"/>
      <Input label="Short Bio" type="text" value={bio} onChange={e => setBio(e.target.value)} />
      <Input label="Password*" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" />
      <Input label="Confirm Password*" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
      <Button type="submit" fullWidth size="lg">Next: Verify Phone</Button>
    </form>
  );

  const renderOtpStep = () => (
    <form onSubmit={handleOtpVerify} className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-sky-400 mb-2">Verify Your Number</h2>
        <p className="text-slate-300">
            An OTP was "sent" to <span className="font-semibold text-sky-400">{phoneNumber}</span>.
        </p>
      </div>

      <div className="bg-slate-900/70 p-3 rounded-lg text-center border border-slate-700">
          <p className="text-sm text-slate-400">For demonstration purposes, your OTP is:</p>
          <p className="text-2xl font-mono tracking-widest text-green-400 mt-1">{generatedOtp}</p>
      </div>

      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}

      <Input
          label="Enter 6-digit OTP"
          type="text"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
          required
          placeholder="••••••"
          maxLength={6}
          className="text-center text-2xl tracking-widest"
      />
      <Button type="submit" fullWidth size="lg">Verify & Continue</Button>
      <Button type="button" variant="ghost" onClick={() => { setError(''); setStep('profile'); }} fullWidth className="border-none">Back to Profile</Button>
    </form>
  );

  const renderFriendsStep = () => {
    const potentialFriends = allUsers.filter(u => u.phoneNumber !== phoneNumber);
    const filteredFriends = potentialFriends.filter(friend =>
      friend.name.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-sky-400 mb-2">Select Your Close Friends</h2>
        <p className="text-slate-300 mb-4">Choose up to {MAX_FIRST_DEGREE_FRIENDS} people.</p>

        <Input
            type="text"
            placeholder="Search for friends by name..."
            value={friendSearchQuery}
            onChange={e => setFriendSearchQuery(e.target.value)}
            aria-label="Search for friends"
        />

        <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2 border-t border-b border-slate-700 py-4">
          {filteredFriends.length > 0 ? (
            filteredFriends.map(friend => (
              <div 
                key={friend.id} 
                onClick={() => toggleFriendSelection(friend.id)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${selectedFriendIds.has(friend.id) ? 'bg-sky-600 ring-2 ring-sky-400' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                <Avatar src={friend.profileImageUrl} name={friend.name} size="md" className="mr-4"/>
                <div>
                  <p className="font-semibold text-slate-100">{friend.name}</p>
                  <p className="text-sm text-slate-400">{friend.bio}</p>
                </div>
                {selectedFriendIds.has(friend.id) && <span className="ml-auto text-sky-300 text-2xl">✓</span>}
              </div>
            ))
          ) : (
             <p className="text-center text-slate-400 py-4">No users found matching your search.</p>
          )}
        </div>
        <p className="text-sm text-slate-400">Selected: {selectedFriendIds.size} / {MAX_FIRST_DEGREE_FRIENDS}</p>
        <Button onClick={handleFinalSubmit} disabled={selectedFriendIds.size === 0 || isLoading} fullWidth size="lg">
          {isLoading ? 'Creating Account...' : 'Complete Signup'}
        </Button>
         <Button type="button" variant="ghost" onClick={() => setStep('profile')} fullWidth className="border-none">Back to Profile</Button>
      </div>
    );
  }
  
  const renderCurrentStep = () => {
    switch(step) {
      case 'profile':
        return renderProfileStep();
      case 'otp':
        return renderOtpStep();
      case 'friends':
        return renderFriendsStep();
      default:
        return renderProfileStep();
    }
  }

  // Fetch all users after OTP verification
  React.useEffect(() => {
    if (step === 'friends') {
      fetchAllUsersPublic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">Sign Up</h2>
      {renderCurrentStep()}
      <div className="text-center mt-6">
        <Button variant="ghost" type="button" onClick={onSwitchToLogin} className="border-none">
          Already have an account? Login
        </Button>
      </div>
    </div>
  );
};


// --- Main Auth Screen Component ---
const OnboardingFlow: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sky-400">Casual Hangout</h1>
          <p className="text-slate-300 mt-2">Connect with your friends, and friends of friends.</p>
        </div>
        <div className="bg-slate-800 shadow-2xl rounded-xl p-8">
          {isLoginView ? (
            <LoginForm onSwitchToSignup={() => setIsLoginView(false)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setIsLoginView(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;