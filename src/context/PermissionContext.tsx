'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS, PermissionKey } from '@/constants/permissions';

interface PermissionContextValue {
  can: (key: PermissionKey) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const value = useMemo<PermissionContextValue>(
    () => ({
      can: (key: PermissionKey) => (user ? (PERMISSIONS[key]?.includes(user.role.roleName) ?? false) : false),
    }),
    [user]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermissionContext = (): PermissionContextValue => {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermissionContext must be used within PermissionProvider');
  return context;
};
