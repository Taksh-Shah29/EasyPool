import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { FirebaseNotification, subscribeToNotifications } from '@/lib/firebase';

export function useFirebaseNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<FirebaseNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setLoading(false);
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount: notifications.filter(n => !n.read).length
  };
}
