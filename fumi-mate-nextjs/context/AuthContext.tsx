'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'student' | 'teacher' | 'admin';

interface User {
  isAuthenticated: boolean;
  userRole?: UserRole;
  username?: string;
}

interface AuthContextType {
  user: User;
  loading: boolean;
  login: (userData: Omit<User, 'isAuthenticated'>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({ isAuthenticated: false });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (userData: Omit<User, 'isAuthenticated'>) => {
      console.log('AUTH LOGIN CALLED WITH:', userData);
    const updatedUser: User = { ...userData, isAuthenticated: true };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser({ isAuthenticated: false });
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
