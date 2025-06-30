import React, { useState } from 'react';
import { useAppContext } from './contexts/AppContext';
import OnboardingFlow from './screens/OnboardingFlow';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';

const App: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'profile'>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-sky-400 text-xl font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <OnboardingFlow />;
  }
  
  if (activeScreen === 'profile') {
      return <ProfileScreen onBack={() => setActiveScreen('dashboard')} />;
  }

  return <DashboardScreen onProfileClick={() => setActiveScreen('profile')} />;
};

export default App;