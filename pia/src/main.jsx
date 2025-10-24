import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Pages/Login.jsx';
import MapSection from './Components/MapSection.jsx';
import AdminDashboard from './Components/AdminDashboard.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/login' element={<Login />} />

        <Route
          path='/map'
          element={
            <ProtectedRoute>
              <MapSection />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-dashboard'
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path='/MapSection' element={<Login />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
