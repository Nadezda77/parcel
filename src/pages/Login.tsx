import React, { useState, useRef } from 'react';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';
import { useNavigate } from 'react-router';
import axios from 'axios';
import queryString from 'query-string';
import { setUserSession } from '../utils/Common';

const useFormInput = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return {
    value,
    onChange: handleChange,
  };
};

function Login() {
  const navigate = useNavigate();
  const username = useFormInput('');
  const password = useFormInput('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  
  const handleLogin =  () => {
    setError(null);
    setLoading(true);

    const authHeader = 'Basic ' + btoa(`${username.value}:${password.value}`);

     axios.post('https://iot.mts.rs/users-auth/protocol/openid-connect/token',
      queryString.stringify({
        grant_type: 'client_credentials',
      }),

      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },

        withCredentials: false,
      }).then(response => {
        setLoading(false);
        setUserSession(response.data.access_token, response.data.expires_in, response.data.refresh_expires_in, response.data.token_type, response.data.scope, username.value,
  password.value);
  


        navigate('/dashboard', { replace: true }); 
      }).catch(error => {
  setLoading(false);
  if (error.response) {
    console.error('Login failed:', error.response.data);
    setError(`Login failed: ${error.response.status} - ${error.response.data.error_description || error.response.data.error}`);
  } else {
    console.error('Login failed:', error);
    setError('Login failed. Network error or CORS issue.');
  }
});
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
        <input id="client_id" type="text" {...username} autoComplete="new-password" />
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