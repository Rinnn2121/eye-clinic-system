import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CustomerContext = createContext();

export function useCustomer() {
  return useContext(CustomerContext);
}

export function CustomerProvider({ children }) {
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRefId = localStorage.getItem('customerRefId');
    if (storedRefId) {
      validateReferenceId(storedRefId);
    } else {
      setLoading(false);
    }
  }, []);

  const validateReferenceId = async (referenceId) => {
    const customerRef = doc(db, 'customers', referenceId);
    const customerSnap = await getDoc(customerRef);
    
    if (customerSnap.exists()) {
      const customerData = customerSnap.data();
      localStorage.setItem('customerRefId', referenceId);
      setCurrentCustomer(customerData);
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const logoutCustomer = () => {
    localStorage.removeItem('customerRefId');
    setCurrentCustomer(null);
  };

  return (
    <CustomerContext.Provider value={{ currentCustomer, loading, validateReferenceId, logoutCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}