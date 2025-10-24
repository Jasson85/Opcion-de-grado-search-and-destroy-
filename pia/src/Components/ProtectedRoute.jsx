import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  let user = null;
  try {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (err) {
    console.error('Error al leer userData:', err);
    user = null;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.rol !== requiredRole) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default ProtectedRoute;
