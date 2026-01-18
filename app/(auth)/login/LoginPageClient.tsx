'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Button, Input } from '@/components/ui';
import { signIn, signInWithGoogle, sendVerificationEmail } from '@/lib/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { isValidReturnUrl } from '@/lib/utils/redirect';
import { Recaptcha } from '@/components/security/Recaptcha';
import { getRemainingAttempts } from '@/lib/security/rate-limit';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userRole } = useAuth();
  const fromAdmin = searchParams?.get('from') === 'admin';
  const returnUrl = searchParams?.get('returnUrl');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [checkingRateLimit, setCheckingRateLimit] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      if (fromAdmin) {
        // If coming from admin, check role
        if (userRole === UserRole.ADMIN || userRole === UserRole.STAFF) {
          router.push('/admin');
        }
        // If not admin/staff, stay on login page (error will be shown)
      } else if (returnUrl && isValidReturnUrl(returnUrl)) {
        // Redirect to the returnUrl if valid
        router.push(returnUrl);
      } else {
        router.push('/');
      }
    }
  }, [user, userRole, fromAdmin, returnUrl, router, isLoading]);

  // Check rate limit when email changes
  useEffect(() => {
    const checkRateLimit = async () => {
      if (!email || email.length < 3) {
        setRemainingAttempts(null);
        return;
      }

      setCheckingRateLimit(true);
      try {
        const response = await fetch('/api/auth/check-rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const data = await response.json();
          setRemainingAttempts(data.remainingAttempts);
          if (data.locked) {
            setError(data.message || 'Account is temporarily locked');
          }
        }
      } catch (error) {
        console.error('Error checking rate limit:', error);
      } finally {
        setCheckingRateLimit(false);
      }
    };

    const timeoutId = setTimeout(checkRateLimit, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleRecaptchaVerify = (token: string) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaError = (error: string) => {
    console.error('reCAPTCHA error:', error);
    // Don't block login in development
    if (process.env.NODE_ENV === 'production') {
      setError('Security verification failed. Please refresh and try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Get reCAPTCHA token if not already set
      let token = recaptchaToken;
      if (!token) {
        // Trigger reCAPTCHA verification
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        if (siteKey && window.grecaptcha) {
          await new Promise<void>((resolve) => {
            window.grecaptcha.ready(async () => {
              try {
                token = await window.grecaptcha.execute(siteKey, { action: 'login' });
                setRecaptchaToken(token);
                resolve();
              } catch (err) {
                console.error('reCAPTCHA execution error:', err);
                resolve(); // Continue without token in development
              }
            });
          });
        }
      }

      // Sign in with reCAPTCHA token
      await signIn({ email, password, recaptchaToken: token });
      
      // After sign in, check if email is verified
      const currentUser = auth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        // Email not verified - send verification email and redirect to verify page
        try {
          await sendVerificationEmail(currentUser);
        } catch (emailError) {
          // Don't fail if email sending fails, just log it
          console.error('Failed to send verification email:', emailError);
        }
        router.push('/verify?from=login');
        return;
      }
      
      // Email is verified, redirect based on context
      // Note: userRole might not be updated immediately, so we'll rely on the useEffect
      // to handle the redirect after the auth context updates
      if (fromAdmin) {
        // The useEffect will handle redirect after userRole updates
        // Just wait a moment for the context to update
        setTimeout(() => {
          router.push('/admin');
        }, 100);
      } else if (returnUrl && isValidReturnUrl(returnUrl)) {
        // Redirect to returnUrl if valid
        router.push(returnUrl);
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Redirect based on returnUrl or default
      if (returnUrl && isValidReturnUrl(returnUrl)) {
        router.push(returnUrl);
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up with Google.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-background-tertiary flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-1.5 sm:mb-2">Log Back In</h1>
        <p className="text-center text-xs sm:text-sm text-text-secondary mb-6 sm:mb-8">
          Get right back in and enjoy your online shopping experience
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="w-5 h-5" />}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<Lock className="w-5 h-5" />}
          />

          {remainingAttempts !== null && remainingAttempts < 5 && (
            <div className="bg-warning/10 border border-warning/20 text-warning px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm">
              {remainingAttempts > 0 
                ? `${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining before account lockout`
                : 'Account will be locked after next failed attempt'}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-xs sm:text-sm text-primary hover:text-primary-hover transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Invisible reCAPTCHA - executes automatically */}
          <Recaptcha 
            onVerify={handleRecaptchaVerify}
            onError={handleRecaptchaError}
            action="login"
          />

          <div className="flex flex-col gap-3 sm:gap-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Login with Google</span>
            </Button>
          </div>
        </form>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-text-secondary">
          You don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

