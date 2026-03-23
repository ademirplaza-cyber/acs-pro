import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const usePageTracking = (page: string, action: string) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      api.logActivity(user.id, user.name, action, page);
    }
  }, []);
};
