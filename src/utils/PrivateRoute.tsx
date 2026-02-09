import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken, isTokenExpired } from './Common';

const PrivateRoute = () => {
  const token = getAccessToken();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};
export default PrivateRoute;
