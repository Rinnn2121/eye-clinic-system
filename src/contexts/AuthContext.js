import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,  // ✅ Added
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

  // Set session persistence
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

  // ✅ LOGIN
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  // ✅ SIGNUP (Added)
  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  };

  // ✅ LOGOUT
  const logout = async () => {
    localStorage.clear();
    await signOut(auth);
  };

  // ✅ AUTH STATE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email === 'admin@eyeclinic.com') {
          setUserRole('admin');
        } else {
          setUserRole('customer');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ✅ VALUE OBJECT (includes signup)
  const value = {
    currentUser,
    userRole,
    login,
    signup,      // ✅ Added
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}