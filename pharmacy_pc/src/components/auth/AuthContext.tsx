import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffService, StaffPermission } from '../../services/staffService';
import { getPharmacyId } from '../../config/development';

interface User {
  id: number;
  name: string;
  role: string;
  isStaff?: boolean;
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (key: string) => boolean;
  isOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: [],
  loading: true,
  hasPermission: () => false,
  isOwner: () => false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          
          if (userData.isStaff) {
            const staffId = userData.id;
            try {
              const perms = await StaffService.getPermissions(staffId);
              setPermissions(perms.filter((p: StaffPermission) => p.granted).map((p: StaffPermission) => p.permission_key));
            } catch (err) {
              console.error('Failed to load permissions', err);
            }
          } else if (userData.role === 'OWNER') {
             // OWNER has all permissions implicitly, or handled by isOwner()
             // Not setting permissions string array
          }
        }
      } catch (err) {
        console.error('Error parsing user data', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  const hasPermission = (key: string) => {
    if (user?.role === 'OWNER' || user?.role?.toUpperCase() === 'ADMIN') return true;
    return permissions.includes(key);
  };

  const isOwner = () => {
    return user?.role === 'OWNER' || user?.role?.toUpperCase() === 'ADMIN';
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, hasPermission, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
};
