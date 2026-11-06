// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc,updateDoc, setDoc } from 'firebase/firestore';

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


  const signup = async (email, password, customerData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

        // 1. Create the User Role document
    await setDoc(doc(db, 'users', email), {
      email: email,
      role: 'customer',
      firstName: customerData.firstName, // ✅ Save first name
      lastName: customerData.lastName,   // ✅ Save last name
      name: `${customerData.firstName} ${customerData.lastName}`, // Keep for backward compatibility
      createdAt: new Date().toISOString()
    });

  
    await setDoc(doc(db, 'onlineAccounts', email), {
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      nickname: customerData.nickname || '',
      phone: customerData.phone,
      email: email,
      createdAt: new Date().toISOString(),
      totalVisits: 0,
    });

    return result;
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };


  const updateProfilePicture = async (newPhotoUrl) => {
    if (!currentUser?.email) return;
    

    await updateDoc(doc(db, 'users', currentUser.email), {
      photoUrl: newPhotoUrl
    });
    

    setUserData(prev => ({ ...prev, photoUrl: newPhotoUrl }));
  };


    // Add this to force context to fetch the latest user data
  const refreshUserData = async () => {
    if (!currentUser?.email) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.email));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true); 
      
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
    loading,
    resendVerification,
    updateProfilePicture,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}