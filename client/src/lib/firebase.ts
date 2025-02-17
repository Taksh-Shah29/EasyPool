import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export interface FirebaseNotification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'ride_request' | 'ride_response';
  read: boolean;
  createdAt: string;
  relatedRideId?: number;
  relatedBookingId?: number;
}

export const notificationsRef = (userId: number) => 
  ref(database, `notifications/${userId}`);

export const sendNotification = async (notification: Omit<FirebaseNotification, 'id' | 'createdAt'>) => {
  const newNotificationRef = push(notificationsRef(notification.userId));
  await set(newNotificationRef, {
    ...notification,
    id: newNotificationRef.key,
    createdAt: new Date().toISOString(),
  });
};

export const subscribeToNotifications = (userId: number, callback: (notifications: FirebaseNotification[]) => void) => {
  const userNotificationsRef = notificationsRef(userId);

  const unsubscribe = onValue(userNotificationsRef, (snapshot) => {
    const data = snapshot.val();
    const notifications = data ? Object.values(data) : [];
    callback(notifications as FirebaseNotification[]);
  });

  return unsubscribe;
};

export { app, database, auth };