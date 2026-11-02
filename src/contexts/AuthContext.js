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

  // ✅ Updated signup function to save initial customer data
  const signup = async (email, password, customerData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // 1. Create the User Role document
    await setDoc(doc(db, 'users', email), {
      email: email,
      role: 'customer',
      name: `${customerData.firstName} ${customerData.lastName}`,
      createdAt: new Date().toISOString()
    });

    // 2. Create a "Pending" Customer document
    // We use the email as the temporary ID. When they link a Reference ID,
    // the system will merge this data into the official clinic record.
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

  const logout = async () => {
    await signOut(auth);
  };

  // ✅ Add this function to update the profile picture
  const updateProfilePicture = async (newPhotoUrl) => {
    if (!currentUser?.email) return;
    
    // Update Firestore
    await updateDoc(doc(db, 'users', currentUser.email), {
      photoUrl: newPhotoUrl
    });
    
    // Update local state so the UI changes immediately
    setUserData(prev => ({ ...prev, photoUrl: newPhotoUrl }));
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
    updateProfilePicture 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}