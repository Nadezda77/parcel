import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useNavigate } from 'react-router';
import axios from 'axios';
//import api from '../api/axios';

import { setUserSession } from '../utils/Common';


const useFormInput = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return { value, onChange: handleChange };
};

function Login() {
  const navigate = useNavigate();
  const username = useFormInput('');
  const password = useFormInput('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    

    try {
      // 1️⃣ Authenticate via backend LDAP proxy
     const resp = await axios.post(
  'http://localhost:4000/api/login',
  {
    username: username.value,
    password: password.value,
  },
  { withCredentials: true }
);



  

        console.log('LOGIN RESPONSE:', resp.data);

              const  token  = resp.data;


              
      // 2️⃣ Store TP service account and token in session
      setUserSession(
        
        token.access_token,
        token.expires_in,
         token.token_type
        
       
      );

      setLoading(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setLoading(false);

      if (err.response) {
        console.error('Login failed:', err.response.data);
        setError(
          `Login failed: ${err.response.status} - ${
            err.response.data.error || err.response.data.message
          }`
        );
      } else {
        console.error('Login failed:', err);
        setError('Login failed. Network error or CORS issue.');
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <h2>Login</h2>

      <div>
        Username
        <br />
        <input id="username" type="text" {...username} autoComplete="new-password" />
      </div>

      <div style={{ marginTop: 10 }}>
        Password
        <br />
        <input id="password" type="password" {...password} autoComplete="new-password" />
      </div>

      {error && (
        <>
          <small style={{ color: 'red' }}>{error}</small>
          <br />
        </>
      )}
      <br />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
      <br />
    </form>
  );
}

export default Login;