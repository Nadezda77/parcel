// src/globals.d.ts
export {}; // this makes it a module

declare global {
  interface Window {
    __TP_SERVICE_ACCOUNT__?: {
      username: string;
      password: string;
    };
  }
}
