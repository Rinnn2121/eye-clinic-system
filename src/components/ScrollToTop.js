// src/components/ScrollToTop.js

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Whenever the URL path changes, scroll to the top of the window
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}