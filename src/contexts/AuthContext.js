import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set session persistence (logout when browser closes)
  useEffect(() => {
    const configurePersistence = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (error) {
        console.error('Error setting persistence:', error);
      }
    };
    configurePersistence();
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  const logout = async () => {
    localStorage.clear();
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email === 'admin@eyeclinic.com') {
          setUserRole('admin');
        } else {
          setUserRole('staff');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}