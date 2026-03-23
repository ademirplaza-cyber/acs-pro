import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserRole } from '../types';

export const usePageTracking = (page: string, action: string) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      api.logActivity(user.id, user.name, action, page);
    }
  }, []);
};