import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { getAccessToken } from './Common';
 
// handle the public routes
const PublicRoute = () => {
    return !getAccessToken() ? <Outlet /> : <Navigate to="/dashboard" replace />
  }
 
export default PublicRoute;