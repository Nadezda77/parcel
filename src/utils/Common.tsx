// return the user data from the session storage
export const getUser = () => {
    const userStr = sessionStorage.getItem('client_id');
    if (userStr) return JSON.parse(userStr);
    else return null;
  }
   
  // return the token from the session storage
export const getToken = () => {
  return sessionStorage.getItem('access_token') || null;
  }
 
  
  // remove the token and user from the session storage
export const removeUserSession = () => {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('expires_in');
  sessionStorage.removeItem('refresh_expires_in');
  sessionStorage.removeItem('token_type');
  sessionStorage.removeItem('not_before_policy');
  sessionStorage.removeItem('scope');
  }

  // set the token and user from the session storage


  export const setUserSession = (
    token: string,
    expires_in: number,
    refresh_expires_in: number,
    token_type: string,
    not_before_policy: string | number,
    scope: string
  ): void => {
    sessionStorage.setItem('access_token', token);
    sessionStorage.setItem('expires_in', expires_in.toString());
    sessionStorage.setItem('refresh_expires_in', refresh_expires_in.toString());
    sessionStorage.setItem('token_type', token_type);
    sessionStorage.setItem('not_before_policy', not_before_policy.toString());
    sessionStorage.setItem('scope', scope);
    
      }


  