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
  const history = useNavigate();
  const username = useFormInput('');
  const password = useFormInput('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Store refresh token timer
  // const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  // const clearRefreshTimer = () => {
  //   if (refreshTimer.current) {
  //     clearTimeout(refreshTimer.current);
  //     refreshTimer.current = null;
  //   }
  // };

  // Login handler - get tokens from backend
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
        setUserSession(response.data.access_token, response.data.expires_in, response.data.refresh_expires_in, response.data.token_type, response.data.scope, response.data.not_before_policy );


        history('/dashboard');

      }).catch(error => {
        setLoading(false);  
      });
  };


  return (
    <form>
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
       <input type="button"
        value={loading ? 'Loading...' : 'Login'} onClick={handleLogin}
        disabled={loading} />
      <br />
    </form>
  );
}

export default Login;
