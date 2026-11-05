// src/components/NotificationBell.js

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function NotificationBell({ align = 'sidebar', isExpanded }) {
  const { currentUser, userRole, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = userRole === 'admin' || userRole === 'staff';
  const recipientId = isAdmin ? 'admin' : currentUser?.email?.toLowerCase();

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (authLoading) return; 
    if (!recipientId) {
      setNotifications([]);
      return;
    }

    const q = query(collection(db, 'notifications'), where('recipient', '==', recipientId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);
    }, (error) => {
      console.error("Notification Error: ", error);
    });

    return () => unsubscribe();
  }, [recipientId, authLoading]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markOneAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await updateDoc(doc(db, 'notifications', notification.id), { isRead: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-4 h-4";
    if (type === 'booking') {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  };

  const dropdownPosition = align === 'sidebar' ? 'absolute left-full bottom-0 ml-4' : 'absolute right-0 top-full mt-2';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      
      {/* ✅ The Clickable Area */}
      <div 
        onClick={handleToggle} 
        className={`flex items-center gap-3 w-full rounded-xl transition-all duration-200 ${
          isExpanded ? 'px-4 py-3 justify-start' : 'p-3 justify-center'
        } text-gray-700 hover:bg-white/50 cursor-pointer`}
      >
        {/* ✅ The Bell Icon */}
        <div className="relative flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Red Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#b8cff2]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        
        {/* ✅ The Text (Shows when expanded) */}
        <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 block font-medium' : 'opacity-0 hidden'}`}>
          Notifications
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className={`${dropdownPosition} w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[999] overflow-hidden flex flex-col max-h-[70vh]`}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-[#4A90E2] hover:underline font-medium">
                Mark all as read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 min-h-[150px]">
            {authLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm animate-pulse">Checking...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  onClick={() => { markOneAsRead(n); setIsOpen(false); }}
                  className={`block p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'booking' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                      <p className={`text-xs mt-1 ${!n.isRead ? 'text-gray-700' : 'text-gray-500'}`}>{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}