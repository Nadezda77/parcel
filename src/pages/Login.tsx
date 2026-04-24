// src/pages/Login.tsx
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import { setUserSession } from '../utils/Common';

const useFormInput = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);
  return { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value) };
};

function Login() {
  const navigate = useNavigate();
  const username = useFormInput('');
  const password = useFormInput('');
  const otp = useFormInput('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);



  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const resp = await api.post(
        '/api/login',
        { username: username.value, password: password.value },
        { withCredentials: true }
      );


      // ✅ BRANCHA ZA MFA
      if (resp.data?.status === 'MFA_REQUIRED') {
        setLoading(false);
        setMfaRequired(true);
        setMfaMessage(resp.data?.message || 'Enter your one-time password.');
        return; // ⛔ ne nastavljaj na dashboard
      }


      const token = resp.data;

      setUserSession(token.access_token, token.expires_in, token.token_type);

      setLoading(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setLoading(false);
      if (err.response) {
        setError(`Login failed: ${err.response.status} - ${err.response.data?.error || err.response.data?.message}`);
      } else {
        setError('Login failed. Network error or CORS issue.');
      }
    }
  };


const handleVerifyOtp = async () => {
    setError(null);
    setLoading(true);

    try {
      const resp = await api.post(
        '/api/login/mfa',
        { code: otp.value },
        { withCredentials: true }
      );

      const token = resp.data;
      setUserSession(token.access_token, token.expires_in, token.token_type);

      setLoading(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setLoading(false);
      if (err.response) {
        setError(`MFA failed: ${err.response.status} - ${err.response.data?.error || err.response.data?.message}`);
      } else {
        setError('MFA failed. Network error or CORS issue.');
      }
    }
  };


  return (
    <form onSubmit={(e) => { e.preventDefault(); mfaRequired ? handleVerifyOtp() : handleLogin(); }}>
       <h2>{mfaRequired ? 'MFA Verification' : 'Login'}</h2>

     
 {!mfaRequired ? (
        <>
          <div>
            Username<br />
            <input id="username" type="text" {...username} autoComplete="username" />
          </div>

          <div style={{ marginTop: 10 }}>
            Password<br />
            <input id="password" type="password" {...password} autoComplete="current-password" />
          </div>
        </>
      ) : (
        <>
          {mfaMessage && <div style={{ marginBottom: 8 }}>{mfaMessage}</div>}
          <div>
            OTP code<br />
            <input id="otp" type="text" {...otp} autoComplete="one-time-code" />
          </div>
        </>
      )}

      {error && <>
        <small style={{ color: 'red' }}>{error}</small><br />
      </>}

      <br />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : (mfaRequired ? 'Verify' : 'Login')}
      </button>
    </form>
  );
}

export default Login;
