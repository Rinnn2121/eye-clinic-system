// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import LandingPage from './pages/customer/LandingPage';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProductPage from './pages/customer/ProductPage';
import AboutPage from './pages/customer/AboutPage';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AppointmentPage from './pages/admin/AppointmentPage';
import CustomersPage from './pages/admin/CustomersPage';
import InventoryPage from './pages/admin/InventoryPage';
import SalesPage from './pages/admin/SalesPage';
import PatientRecordPage from './pages/admin/PatientRecordPage';
import CustomerHistoryPage from './pages/admin/CustomerHistoryPage';
import CustomerRegister from './pages/customer/CustomerRegister';
import AllTransactionsPage from './pages/admin/AllTransactionsPage';
import AllAppointmentsPage from './pages/admin/AllAppointmentsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/products" element={<ProductPage />} />
          <Route path="/customer/about" element={<AboutPage />} />
          
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
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;