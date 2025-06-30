import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User, Hangout, ConnectionApprovalRequest } from '../backend/src/types';

interface AppContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (userData: Omit<User, 'id' | 'approvedSecondDegreeConnections'>) => Promise<boolean>;
  allUsers: User[];
  hangouts: Hangout[];
  createHangout: (hangoutData: Pick<Hangout, 'participants' | 'activityDescription'> & { details?: string }) => Promise<void>;
  cancelHangout: (hangoutId: string) => Promise<void>;
  acceptHangout: (hangoutId: string) => Promise<void>;
  rejectHangout: (hangoutId: string) => Promise<void>;
  updateUser: (userId: string, data: { profileData?: Partial<Pick<User, 'name' | 'bio' | 'profileImageUrl'>>; friendIds?: string[] }) => Promise<void>;
  connectionRequests: ConnectionApprovalRequest[];
  handleConnectionApproval: (requestId: string, decision: 'approved' | 'rejected') => Promise<void>;
  fetchAllUsersPublic: () => Promise<void>; // <-- Added type definition here
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [hangouts, setHangouts] = useState<Hangout[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ message: string; type?: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // --- API Helper ---
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // ensure cookies are sent if needed
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'An API error occurred');
      }
      return response.status === 204 ? null : response.json();
    } catch (error) {
      console.error(`API call failed: ${options.method || 'GET'} ${url}`, error);
      throw error;
    }
  };
  
  // --- Data Hydration ---
  const fetchAppData = useCallback(async (user: User) => {
    try {
      const [usersData, hangoutsData, requestsData] = await Promise.all([
        apiCall('/api/users'),
        apiCall('/api/hangouts'),
        apiCall('/api/connection-requests')
      ]);

      setAllUsers(usersData);
      setHangouts(hangoutsData.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
      setConnectionRequests(requestsData);

      // Restore Set from array that comes from JSON
      const userWithSet = { ...user, approvedSecondDegreeConnections: new Set<string>(user.approvedSecondDegreeConnections || []) };
      setCurrentUser(userWithSet);

    } catch (error) {
      console.error("Failed to fetch app data:", error);
      setCurrentUser(null); // Log out user if essential data fails
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const sessionUser = await apiCall('/api/session');
        if (sessionUser) {
          await fetchAppData(sessionUser);
        }
      } catch (error) {
        console.log("No active session.");
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [fetchAppData]);


  // --- Auth Functions ---
  const login = useCallback(async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      const user = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, password })
      });
      if (user.token) {
        localStorage.setItem('token', user.token);
      }
      await fetchAppData(user);
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      return false;
    }
  }, [fetchAppData]);

  const logout = useCallback(async () => {
    try {
      await apiCall('/api/logout', { method: 'POST' });
    } catch (error) {
      // ...
    } finally {
      localStorage.removeItem('token');
      setCurrentUser(null);
      setAllUsers([]);
      setHangouts([]);
      setConnectionRequests([]);
    }
  }, []);

  const signup = useCallback(async (userData: Omit<User, 'id' | 'approvedSecondDegreeConnections'>): Promise<boolean> => {
    try {
        const newUser = await apiCall('/api/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (newUser.token) {
          localStorage.setItem('token', newUser.token);
        }
        // Fetch fresh data after signup to ensure dashboard is up-to-date
        const sessionUser = await apiCall('/api/session');
        if (sessionUser) {
          await fetchAppData(sessionUser);
        }
        return true;
    } catch (error) {
        localStorage.removeItem('token');
        return false;
    }
  }, [fetchAppData, apiCall]);

  // --- User Profile Functions ---
  const updateUser = useCallback(async (userId: string, data: { profileData?: Partial<Pick<User, 'name' | 'bio' | 'profileImageUrl'>>; friendIds?: string[] }) => {
    const updatedUser = await apiCall(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    // Restore Set from array
    const userWithSet = { ...updatedUser, approvedSecondDegreeConnections: new Set<string>(updatedUser.approvedSecondDegreeConnections || []) };
    setCurrentUser(userWithSet);
    // Also update the user in the allUsers list
    setAllUsers(prev => prev.map(u => u.id === userId ? userWithSet : u));
  }, []);

  // --- Hangout Functions ---
  const createHangout = useCallback(async (hangoutData: Pick<Hangout, 'participants' | 'activityDescription'> & { details?: string }) => {
    await apiCall('/api/hangouts', {
        method: 'POST',
        body: JSON.stringify(hangoutData)
    });
    // Refetch hangouts and connection requests as new ones may have been created
    const [refreshedHangouts, refreshedRequests] = await Promise.all([
        apiCall('/api/hangouts'),
        apiCall('/api/connection-requests')
    ]);
    setHangouts(refreshedHangouts.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
    setConnectionRequests(refreshedRequests);
    // alert('Hangout request sent!');
    setAlert({ message: 'Hangout request sent!', type: 'success' });
  }, []);

  const cancelHangout = useCallback(async (hangoutId: string) => {
    await apiCall(`/api/hangouts/${hangoutId}`, { method: 'DELETE' });
    setHangouts(prev => prev.filter(h => h.id !== hangoutId));
    // Also remove any pending connection requests associated with it
    setConnectionRequests(prev => prev.filter(req => req.hangoutId !== hangoutId));
  }, []);

  const acceptHangout = useCallback(async (hangoutId: string) => {
    const updatedHangout = await apiCall(`/api/hangouts/${hangoutId}/accept`, { method: 'PUT' });
    setHangouts(prev => prev.map(h => h.id === hangoutId ? { ...updatedHangout, timestamp: new Date(updatedHangout.timestamp) } : h));
  }, []);
  
  const rejectHangout = useCallback(async (hangoutId: string) => {
    const updatedHangout = await apiCall(`/api/hangouts/${hangoutId}/reject`, { method: 'PUT' });
    setHangouts(prev => prev.map(h => h.id === hangoutId ? { ...updatedHangout, timestamp: new Date(updatedHangout.timestamp) } : h));
  }, []);

  // --- Connection Approval Functions ---
  const handleConnectionApproval = useCallback(async (requestId: string, decision: 'approved' | 'rejected') => {
      await apiCall(`/api/connection-requests/${requestId}`, {
          method: 'PUT',
          body: JSON.stringify({ decision })
      });
      // Refetch all data as this can have wide-ranging effects
      if(currentUser) {
          await fetchAppData(currentUser);
      }
  }, [currentUser, fetchAppData]);

  // --- Public Fetch All Users (no auth) ---
  const fetchAllUsersPublic = useCallback(async () => {
    try {
      const usersData = await fetch('/api/users/allusers').then(res => res.json());
      setAllUsers(usersData);
    } catch (error) {
      setAllUsers([]);
    }
  }, []);

  const contextValue = {
    currentUser,
    isLoading,
    login,
    logout,
    signup,
    allUsers,
    hangouts,
    createHangout,
    cancelHangout,
    acceptHangout,
    rejectHangout,
    updateUser,
    connectionRequests,
    handleConnectionApproval,
    fetchAllUsersPublic, // expose public fetch
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};