import React, { useState, useEffect } from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'


import {BrowserRouter , Route, Routes, NavLink} from 'react-router';
import Home from "./pages/Home";
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewDevice from './pages/NewDevice';
import NotFound from './pages/NotFound';
import ExportCSV from './pages/DownloadData';


import PrivateRoutes from './utils/PrivateRoute';
import PublicRoutes from './utils/PublicRoute';

import axios from 'axios';

import { getToken, removeUserSession, setUserSession } from './utils/Common';

function App() {

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    axios.get(`http://localhost:1234/verifyToken?token=${token}`).then(response => {
      setUserSession(response.data.access_token, response.data.expires_in, response.data.token_type, response.data.refresh_expires_in, response.data.scope, response.data.not_before_policy);
      setAuthLoading(false);
    }).catch(error => {
      removeUserSession();
      setAuthLoading(false);
    });
  }, []);

  if (authLoading && getToken()) {
    return <div className="content">Checking Authentication...</div>
  }

 
  return (
    <BrowserRouter>
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
          <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
              Login <small>(Access without token )</small>
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard <small>(Access with token )</small>
            </NavLink>
            <NavLink to="/new_device" className={({ isActive }) => isActive ? 'active' : ''}>
              New device <small>(Access with token)</small>
            </NavLink>
            <NavLink to="/export_csv" className={({ isActive }) => isActive ? 'active' : ''}>
              Download data <small>(Access with token)</small>
            </NavLink>
            </nav>  
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route index element={<Home />} />
            <Route element={<PublicRoutes />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<PrivateRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} /> 
              <Route path="/new_device" element={<NewDevice />} />
              <Route path="/export_csv" element={<ExportCSV />} />
           </Route>


          </Routes>
      
          </BrowserRouter>
  );
}
export {App};