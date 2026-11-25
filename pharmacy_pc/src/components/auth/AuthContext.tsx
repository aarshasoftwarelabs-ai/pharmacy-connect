import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StaffService, StaffPermission } from '../../services/staffService';

interface User {
  id: number;
  name: string;
  role: string;
  isStaff?: boolean;
  pharmacyId?: number;
  pharmacyName?: string;
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  refreshAuth: () => Promise<void>;
  hasPermission: (key: string) => boolean;
  isOwner: () => boolean;
}

function readStoredUser(): User | null {
  try {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr && userDataStr !== 'undefined' && userDataStr !== 'null') {
      return JSON.parse(userDataStr);
    }
  } catch (err) {
    console.error('Error parsing stored user data', err);
  }
  return null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: [],
  loading: true,
  refreshAuth: async () => {},
  hasPermission: () => false,
  isOwner: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    const initial = readStoredUser();
    return Boolean(initial?.isStaff);
  });

  const loadAuth = useCallback(async () => {
    const userData = readStoredUser();
    setUser(userData);

    if (!userData) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    if (userData.isStaff) {
      setLoading(true);
      try {
        const perms = await StaffService.getPermissions(userData.id);
        setPermissions(
          perms.filter((p: StaffPermission) => p.granted).map((p: StaffPermission) => p.permission_key)
        );
      } catch (err) {
        console.error('Failed to load staff permissions', err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuth();
    const handleAuthChange = () => {
      void loadAuth();
    };
    window.addEventListener('auth_updated', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth_updated', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [loadAuth]);

  const hasPermission = (key: string) => {
    const activeUser = user ?? readStoredUser();
    if (!activeUser) return false;
    if (!activeUser.isStaff) return true;
    if (activeUser.role === 'OWNER' || activeUser.role?.toUpperCase() === 'ADMIN') return true;
    return permissions.includes(key);
  };

  const isOwner = () => {
    const activeUser = user ?? readStoredUser();
    if (activeUser && !activeUser.isStaff) return true;
    return activeUser?.role === 'OWNER' || activeUser?.role?.toUpperCase() === 'ADMIN';
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, refreshAuth: loadAuth, hasPermission, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
};
