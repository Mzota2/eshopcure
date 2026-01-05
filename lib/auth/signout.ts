/**
 * Sign out functions
 */

import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { AuthenticationError } from '@/lib/utils/errors';

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new AuthenticationError(error.message || 'Failed to sign out');
  }
};

/**
 * Check if user is signed in
 */
export const isSignedIn = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Get current Firebase Auth user
 */
export const getCurrentFirebaseUser = () => {
  return auth.currentUser;
};

