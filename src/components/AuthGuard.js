// src/components/AuthGuard.js
import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }) {
  const { loading } = useAuth();
  const hasLoadedOnce = useRef(false);

  if (!loading) hasLoadedOnce.current = true;

  // Show spinner only on the very first load
  if (loading && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return children;
}