
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ImportSpreadsheetPage from './pages/ImportSpreadsheetPage.jsx';
import CreatorsPage from './pages/CreatorsPage.jsx';
import PendenciesPage from './pages/PendenciesPage.jsx';
import MessageSendingPage from './pages/MessageSendingPage.jsx';
import MessageHistoryPage from './pages/MessageHistoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><ImportSpreadsheetPage /></ProtectedRoute>} />
          <Route path="/creators" element={<ProtectedRoute><CreatorsPage /></ProtectedRoute>} />
          <Route path="/pendencies" element={<ProtectedRoute><PendenciesPage /></ProtectedRoute>} />
          <Route path="/send-messages" element={<ProtectedRoute><MessageSendingPage /></ProtectedRoute>} />
          <Route path="/message-history" element={<ProtectedRoute><MessageHistoryPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
