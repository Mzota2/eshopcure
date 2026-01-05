/**
 * reCAPTCHA component for client-side integration
 * Uses reCAPTCHA v3 (invisible)
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { getRecaptchaSiteKey } from '@/lib/security/recaptcha';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (element: HTMLElement, options: { sitekey: string; callback?: (token: string) => void }) => number;
      reset: (widgetId: number) => void;
    };
  }
}

interface RecaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  action?: string;
}

export const Recaptcha: React.FC<RecaptchaProps> = ({ onVerify, onError, action = 'login' }) => {
  const siteKey = getRecaptchaSiteKey();
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!siteKey) {
      console.warn('reCAPTCHA site key not configured');
      // In development, allow without reCAPTCHA
      if (process.env.NODE_ENV === 'development') {
        onVerify('dev-token');
      }
      return;
    }

    // Check if script is already loaded
    if (window.grecaptcha && scriptLoadedRef.current) {
      // Script already loaded, execute immediately
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token) => {
            onVerify(token);
          })
          .catch((error) => {
            console.error('reCAPTCHA error:', error);
            onError?.(error.message || 'reCAPTCHA verification failed');
          });
      });
      return;
    }

    // Load reCAPTCHA script if not already loaded
    if (!scriptLoadedRef.current) {
      const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
      if (existingScript) {
        scriptLoadedRef.current = true;
        // Script exists, wait for it to be ready
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            window.grecaptcha
              .execute(siteKey, { action })
              .then((token) => {
                onVerify(token);
              })
              .catch((error) => {
                console.error('reCAPTCHA error:', error);
                onError?.(error.message || 'reCAPTCHA verification failed');
              });
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            window.grecaptcha
              .execute(siteKey, { action })
              .then((token) => {
                onVerify(token);
              })
              .catch((error) => {
                console.error('reCAPTCHA error:', error);
                onError?.(error.message || 'reCAPTCHA verification failed');
              });
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [siteKey, action, onVerify, onError]);

  // This component doesn't render anything visible (invisible reCAPTCHA v3)
  return null;
};

