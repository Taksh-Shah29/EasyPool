import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: `firebase-adminsdk-${process.env.FIREBASE_PROJECT_ID}@${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const app = initializeApp({
  credential: cert(serviceAccount as any),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
});

const database = getDatabase(app);

export const sendNotification = async (notification: {
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedRideId?: number;
  relatedBookingId?: number;
}) => {
  const notificationsRef = database.ref(`notifications/${notification.userId}`);
  const newNotificationRef = notificationsRef.push();

  await newNotificationRef.set({
    ...notification,
    id: newNotificationRef.key,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export { app, database };