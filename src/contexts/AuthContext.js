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
        // ✅ Save to localStorage before the new tab even loads
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
    await signOut(auth);
  };

  const signup = async (email, password, customerData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem('userRoleCache', 'customer');
    await setDoc(doc(db, 'users', email), {
      email: email, role: 'customer', name: `${customerData.firstName} ${customerData.lastName}`, createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'onlineAccounts', email), {
      firstName: customerData.firstName, lastName: customerData.lastName, nickname: customerData.nickname || '',
      phone: customerData.phone, email: email, createdAt: new Date().toISOString(), totalVisits: 0,
    });
    setUserRole('customer');
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
        setCurrentUser(user);
        
        // ✅ 1. IMMEDIATELY set role from cache (prevents flash)
        const cachedRole = localStorage.getItem('userRoleCache');
        if (cachedRole) {
          setUserRole(cachedRole); 
        }
        
        // ✅ 2. Fetch the real role from Firestore (this overrides the cache if different)
        try {
          const userDoc = await getDoc(doc(db, 'users', user.email));
          if (userDoc.exists()) {
            const realRole = userDoc.data().role || 'customer';
            setUserRole(realRole);
            setUserData(userDoc.data());
            localStorage.setItem('userRoleCache', realRole);
          } else {
            // Only create a new doc if it genuinely doesn't exist
            const newUserData = { email: user.email, role: 'customer', name: user.email.split('@')[0], createdAt: new Date().toISOString() };
            await setDoc(doc(db, 'users', user.email), newUserData);
            setUserRole('customer');
            setUserData(newUserData);
            localStorage.setItem('userRoleCache', 'customer');
          }
        } catch (error) {
          // ✅ If Firestore fails, DO NOT wipe the role. Keep the cached one.
          console.error("AuthState role fetch error:", error);
          if (!cachedRole) setUserRole('customer'); 
        }
      } else {
        // Only clear if actually signed out (no cached role)
        if (!localStorage.getItem('userRoleCache')) {
          setCurrentUser(null);
          setUserRole(null);
          setUserData(null);
        }
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