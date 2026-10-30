// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// --- PUBLIC PAGES ---
import LandingPage from './pages/customer/LandingPage';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import ProductPage from './pages/customer/ProductPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import AboutPage from './pages/customer/AboutPage';
import ServicesPage from './pages/customer/ServicesPage';

// --- CUSTOMER PORTAL (Requires Login) ---
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerAppointments from './pages/customer/CustomerAppointments';
import CustomerTransactions from './pages/customer/CustomerTransactions';
import CartPage from './pages/customer/CartPage';
import WishlistPage from './pages/customer/WishlistPage';
import ItemStatusPage from './pages/customer/ItemStatusPage';

// --- ADMIN PAGES ---
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AppointmentPage from './pages/admin/AppointmentPage';
import CustomersPage from './pages/admin/CustomersPage';
import InventoryPage from './pages/admin/InventoryPage';
import SalesPage from './pages/admin/SalesPage';
import PatientRecordPage from './pages/admin/PatientRecordPage';
import CustomerHistoryPage from './pages/admin/CustomerHistoryPage';
import AllTransactionsPage from './pages/admin/AllTransactionsPage';
import AllAppointmentsPage from './pages/admin/AllAppointmentsPage';
import ReportsPage from './pages/admin/ReportsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          
          {/* =========================================
              PUBLIC ROUTES (No Login Required)
          ========================================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route path="/customer/products" element={<ProductPage />} />
          <Route path="/customer/products/:productId" element={<ProductDetailPage />} />
          <Route path="/customer/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />

          {/* =========================================
              CUSTOMER PORTAL (Login Required)
              All pages here share the Sidebar Layout
          ========================================= */}
          <Route path="/customer" element={
            <PrivateRoute allowedRoles={['customer']}>
              <CustomerLayout />
            </PrivateRoute>
          }>
            {/* The default page when navigating to /customer */}
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="appointments" element={<CustomerAppointments />} />
            <Route path="transactions" element={<CustomerTransactions />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="item-status" element={<ItemStatusPage />} />
          </Route>

          {/* =========================================
              ADMIN / STAFF PORTAL
          ========================================= */}
          <Route path="/admin/login" element={<Login />} />
          
          <Route path="/admin/dashboard" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/admin/appointments" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <AppointmentPage />
            </PrivateRoute>
          } />
          
          <Route path="/admin/customers" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <CustomersPage />
            </PrivateRoute>
          } />
          
          <Route path="/admin/inventory" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <InventoryPage />
            </PrivateRoute>
          } />
          
          <Route path="/admin/sales" element={
            <PrivateRoute allowedRoles={['admin']}>
              <SalesPage />
            </PrivateRoute>
          } />

          <Route path="/admin/transactions" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <AllTransactionsPage />
            </PrivateRoute>
          } />

          <Route path="/admin/patient-record/:customerId" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <PatientRecordPage />
            </PrivateRoute>
          } />

          <Route path="/admin/all-appointments" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <AllAppointmentsPage />
            </PrivateRoute>
          } />

          <Route path="/admin/customer-history/:customerId" element={
            <PrivateRoute allowedRoles={['admin', 'staff']}>
              <CustomerHistoryPage />
            </PrivateRoute>
          } />

          <Route path="/admin/reports" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ReportsPage />
            </PrivateRoute>
          } />
          
          {/* =========================================
              CATCH-ALL (Redirects unknown URLs to Home)
          ========================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;