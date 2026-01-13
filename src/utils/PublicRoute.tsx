import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { getToken } from './Common';
 
// handle the public routes
const PublicRoute = () => {
    return !getToken() ? <Outlet /> : <Navigate to="/dashboard" replace />
  }
 
export default PublicRoute;