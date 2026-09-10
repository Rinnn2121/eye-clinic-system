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
import { doc, getDoc, setDoc } from 'firebase/firestore';  // ✅ Added

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);  // ✅ Store full user data
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

  // ✅ SIGNUP with role assignment
  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // ✅ Create user document in Firestore with 'customer' role
    await setDoc(doc(db, 'users', email), {
      email: email,
      role: 'customer',
      name: email.split('@')[0],  // Use email prefix as name
      createdAt: new Date().toISOString()
    });
    
    return result;
  };

  // ✅ LOGOUT
  const logout = async () => {
    localStorage.clear();
    await signOut(auth);
  };

  // ✅ ROLE DETECTION - Better version
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user);
    
    if (user) {
      let role = user.email === 'admin@eyeclinic.com' ? 'admin' : 'customer';
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.email));
        if (userDoc.exists()) {
          role = userDoc.data().role || role;
        }
      } catch (error) {
        console.log('Using email-based role');
      }
      
      setUserRole(role);
    } else {
      setUserRole(null);
    }
    
    // ✅ Set loading to false ONLY after role is set
    setLoading(false);
  });
  return unsubscribe;
}, []);

  const value = {
    currentUser,
    userRole,
    userData,  // ✅ Export full user data
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

  return (
  <AuthContext.Provider value={value}>
    {!loading && children}
  </AuthContext.Provider>
);
}