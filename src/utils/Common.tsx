// return the user data from the session storage
import axios from 'axios';


export const getUser = () => {
    const userStr = sessionStorage.getItem('client_id');
    if (userStr) return JSON.parse(userStr);
    else return null;
  }
   
  // return the token from the session storage
export const getToken = () => sessionStorage.getItem('access_token') || null;
 
  
export const removeUserSession = () => {
  sessionStorage.clear();
};

  


  export const setUserSession = (
    access_token: string,
    expires_in: number,
    // refresh_token: string,
    refresh_expires_in: number,
    token_type: string,
    //not_before_policy: string | number,
    scope: string,
    username?: string,
    password?: string
  ): void => {
    sessionStorage.setItem('access_token', access_token);
if (expires_in !== undefined) {
  sessionStorage.setItem('expires_in', expires_in.toString());
}

    //sessionStorage.setItem('expires_in', expires_in.toString());
    // sessionStorage.setItem('refresh_token', refresh_token); // 
    sessionStorage.setItem('refresh_expires_in', refresh_expires_in.toString());
    sessionStorage.setItem('token_type', token_type);
    //sessionStorage.setItem('not_before_policy', not_before_policy.toString());
    sessionStorage.setItem('scope', scope);
    sessionStorage.setItem('stored_at', Date.now().toString());
    
if (username && password) {
    sessionStorage.setItem('auth_username', username);
    sessionStorage.setItem('auth_password', password);
  }

      }


 export const isTokenExpired = () => {
  const expiresIn = sessionStorage.getItem('expires_in');
  const storedAt = sessionStorage.getItem('stored_at');
  if (!expiresIn || !storedAt) return true;

  const now = Date.now();
  const expiryTime = parseInt(storedAt) + parseInt(expiresIn) * 1000;
  const buffer = 60 * 1000; // 1-minute buffer before expiry

  return now + buffer > expiryTime;
};

export const reAuthenticate = async () => {
  const username = sessionStorage.getItem('auth_username');
  const password = sessionStorage.getItem('auth_password');

  if (!username || !password) return false;

  const authHeader = 'Basic ' + btoa(`${username}:${password}`);

  try {
    const response = await axios.post(
      'https://iot.mts.rs/users-auth/protocol/openid-connect/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

   setUserSession(
      response.data.access_token,
      response.data.expires_in,
      response.data.refresh_expires_in,
      response.data.token_type,
      //response.data.not_before_policy,
      response.data.scope,
      username,
      password
    );
    return true;

  } catch (error) {
    console.error('Re-authentication failed', error);
    return false;
  }
};
