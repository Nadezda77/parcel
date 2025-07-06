import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-danger px-3">
      <NavLink className="navbar-brand" to="/">
        mts IoT Dashboard
      </NavLink>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' active' : '')
              }
            >
              Dashboard <small>(Access with token)</small>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' active' : '')
              }
            >
              Login
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/new_device"
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' active' : '')
              }
            >
              New Device
            </NavLink>
          </li>
         
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
