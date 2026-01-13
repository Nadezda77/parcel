import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken, isTokenExpired } from './Common';

const PrivateRoute = () => {
  const token = getToken();

   if (!token || (isTokenExpired && isTokenExpired())) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};


console.log('PrivateRoute token:', getToken());
export default PrivateRoute;
