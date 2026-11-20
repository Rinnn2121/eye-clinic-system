// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, 
  onAuthStateChanged, setPersistence, browserLocalPersistence, sendEmailVerification 
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('browser_alive', 'true');
    const handleBeforeUnload = () => sessionStorage.removeItem('browser_alive');
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    try {
      const userDoc = await getDoc(doc(db, 'users', email));
      if (userDoc.exists()) {
        const role = userDoc.data().role || 'customer';
        localStorage.setItem('userRoleCache', role);
        setUserRole(role);
      }
    } catch (err) {
      console.error("Login role fetch error:", err);
    }
    
    return result;
  };

  const logout = async () => {
    localStorage.removeItem('userRoleCache');
    sessionStorage.removeItem('activeRole'); // ✅ Bug 5 Fix
    await signOut(auth);
  };

  const signup = async (email, password, customerData) => {
    // 1. Create account (this logs them in temporarily)
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // ✅ Wrapped in try/catch to prevent silent failure if rate-limited
    try {
      await sendEmailVerification(result.user);
    } catch (err) {
      console.error('Verification email failed to send:', err);
    }
    
    // 2. Save to Firestore
    await setDoc(doc(db, 'users', email), {
      email: email, 
      role: 'customer', 
      name: `${customerData.firstName} ${customerData.lastName}`, 
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
    
    // 3. Sign them out immediately
    await signOut(auth);
    localStorage.removeItem('userRoleCache');
    
    return result;
  };

  const resendVerification = async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  };

  const updateProfilePicture = async (newPhotoUrl) => {
    if (!currentUser?.email) return;
    await updateDoc(doc(db, 'users', currentUser.email), { photoUrl: newPhotoUrl });
    setUserData(prev => ({ ...prev, photoUrl: newPhotoUrl }));
  };

  const refreshUserData = async () => {
    if (!currentUser?.email) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.email));
      if (userDoc.exists()) {
        const role = userDoc.data().role || 'customer';
        setUserRole(role);
        setUserData(userDoc.data());
        localStorage.setItem('userRoleCache', role);
      }
    } catch (err) { console.error("Error:", err); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ✅ Bug 1 Fix: Fetch the role BEFORE verifying, so we don't block admins
        let realRole = 'customer';
        let fetchedData = null;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.email));
          if (userDoc.exists()) {
            realRole = userDoc.data().role || 'customer';
            fetchedData = userDoc.data();
          } else {
            // Create missing user doc
            const newUserData = { email: user.email, role: 'customer', name: user.email.split('@')[0], createdAt: new Date().toISOString() };
            await setDoc(doc(db, 'users', user.email), newUserData);
            realRole = 'customer';
            fetchedData = newUserData;
          }
        } catch (error) {
          console.error("Role fetch error:", error);
          const cachedRole = localStorage.getItem('userRoleCache');
          if (cachedRole) realRole = cachedRole;
        }

        // ✅ Bug 1 Fix: ONLY block CUSTOMERS with unverified emails
        if (realRole === 'customer' && !user.emailVerified) {
          await signOut(auth);
          setCurrentUser(null);
          setUserRole(null);
          setUserData(null);
          localStorage.removeItem('userRoleCache');
          sessionStorage.removeItem('activeRole'); // ✅ Bug 5 Fix
          setLoading(false);
          return;
        }

        // ✅ Safe to set everything now
        setCurrentUser(user);
        setUserRole(realRole);
        setUserData(fetchedData);
        localStorage.setItem('userRoleCache', realRole);
      } else {
        // Logged out
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
        localStorage.removeItem('userRoleCache');
        sessionStorage.removeItem('activeRole'); // ✅ Bug 5 Fix
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser, userRole, userData, login, signup, logout, loading, resendVerification, updateProfilePicture, refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}