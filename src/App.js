// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/AdminLayout';
import ScrollToTop from './components/ScrollToTop';

// --- PUBLIC PAGES ---
import LandingPage from './pages/customer/LandingPage';
import Login from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import ProductPage from './pages/customer/ProductPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import AboutPage from './pages/customer/AboutPage';
import ServicesPage from './pages/customer/ServicesPage';

// --- CUSTOMER PORTAL ---
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerAppointments from './pages/customer/CustomerAppointments';
import CustomerTransactions from './pages/customer/CustomerTransactions';
import CartPage from './pages/customer/CartPage';
import WishlistPage from './pages/customer/WishlistPage';
import ItemStatusPage from './pages/customer/ItemStatusPage';

// --- ADMIN PAGES ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AppointmentPage from './pages/admin/AppointmentPage';
import CustomersPage from './pages/admin/CustomersPage';
import CatalogPage from './pages/admin/CatalogPage';
import SalesPage from './pages/admin/SalesPage';
import PatientRecordPage from './pages/admin/PatientRecordPage';
import CustomerHistoryPage from './pages/admin/CustomerHistoryPage';
import AllTransactionsPage from './pages/admin/AllTransactionsPage';
import AllAppointmentsPage from './pages/admin/AllAppointmentsPage';
import ReportsPage from './pages/admin/ReportsPage';
import CustomerAccountsPage from './pages/admin/CustomerAccountsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import LabOrdersPage from './pages/admin/LabOrdersPage';

// Wrapper that decides whether to show the top Navbar
function AppShell({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell>
          <ScrollToTop /> 
          <Routes>
            {/* =========================================
                PUBLIC ROUTES
            ========================================= */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/customer/products" element={<ProductPage />} />
            <Route path="/customer/products/:productId" element={<ProductDetailPage />} />
            <Route path="/customer/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />

            {/* =========================================
                CUSTOMER PORTAL
            ========================================= */}
            <Route path="/customer" element={
              <PrivateRoute allowedRoles={['customer']}>
                <CustomerLayout />
              </PrivateRoute>
            }>
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
                ADMIN / STAFF PORTAL — wrapped in AdminLayout
            ========================================= */}
            <Route path="/admin" element={
              <PrivateRoute allowedRoles={['admin', 'staff']}>
                <AdminLayout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="appointments" element={<AppointmentPage />} />
              <Route path="all-appointments" element={<AllAppointmentsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customer-history/:customerId" element={<CustomerHistoryPage />} />
              <Route path="patient-record/:customerId" element={<PatientRecordPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="transactions" element={<AllTransactionsPage />} />
              <Route path="/admin/lab-orders" element={
              <PrivateRoute allowedRoles={['admin', 'staff']}>
                <LabOrdersPage />
              </PrivateRoute>
            } />
              <Route path="/admin/accounts" element={
              <PrivateRoute allowedRoles={['admin']}>
                <CustomerAccountsPage />
              </PrivateRoute>
            } />
            <Route path="/admin/profile" element={
              <PrivateRoute allowedRoles={['admin', 'staff']}>
                <AdminProfilePage />
              </PrivateRoute>
            } />
              <Route path="sales" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <SalesPage />
                </PrivateRoute>
              } />
              <Route path="reports" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ReportsPage />
                </PrivateRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </Router>
  );
}

export default App;