// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', email), {
      email: email,
      role: 'customer',
      name: email.split('@')[0],
      createdAt: new Date().toISOString()
    });
    return result;
  };

  const logout = async () => {
    localStorage.clear();
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.email));
          
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'customer');
            setUserData(userDoc.data());
          } else {
            const newUserData = {
              email: user.email,
              role: 'customer',
              name: user.email.split('@')[0],
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.email), newUserData);
            setUserRole('customer');
            setUserData(newUserData);
          }
        } catch (error) {
          console.error('Error getting role:', error);
          setUserRole('customer');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}