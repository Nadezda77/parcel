import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from './Common';

const PrivateRoute = () => {
  const token = getToken();

   console.log('PrivateRoute token:', token);

  // Only redirect if token is missing
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;