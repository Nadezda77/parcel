import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'

import Navbar from './components/Navbar'
import {BrowserRouter , Route, Routes, NavLink, } from 'react-router-dom';
import Home from "./pages/Home";
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewDevice from './pages/NewDevice';
import NotFound from './pages/NotFound';
import ExportCSV from './pages/DownloadData';
import DeviceDetail from './pages/DeviceDetail';


import PrivateRoutes from './utils/PrivateRoute';
import PublicRoutes from './utils/PublicRoute';

import axios from 'axios';

import { getToken, removeUserSession, setUserSession, isTokenExpired, reAuthenticate  } from './utils/Common';

function App() {

  const [authLoading, setAuthLoading] = React.useState(true);

React.useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      if (isTokenExpired()) {
        const success = await reAuthenticate();
        if (!success) {
          removeUserSession();
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);




  if (authLoading ) {
    return <div className="content">Checking Authentication...</div>
  }

 
  return (
    <BrowserRouter>
      <Navbar />
        <div className="container mt-4">
          <Routes>
           
            <Route index element={<Home />} />
            <Route element={<PublicRoutes />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<PrivateRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} /> 
              <Route path="/new_device" element={<NewDevice />} />
              <Route path="/export_csv" element={<ExportCSV />} />
              <Route path="/device/:deviceEUI" element={<DeviceDetail />} />
           </Route>

 <Route path="*" element={<NotFound />} />
          </Routes>
</div>
          </BrowserRouter>
  );
}


console.log('Token:', getToken());
console.log('Is token expired?', isTokenExpired());

export {App};