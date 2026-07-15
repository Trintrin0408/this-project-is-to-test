'use client';

import { usePermissionContext } from '@/context/PermissionContext';

/**
 * Convenience hook exposing permission checks.
 */
export const usePermission = () => {
  return usePermissionContext();
};
