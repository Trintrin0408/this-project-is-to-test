'use client';

import { useAuthContext } from '../context/AuthContext';

/**
 * Convenience hook exposing auth state and actions.
 */
export const useAuth = () => {
  return useAuthContext();
};
