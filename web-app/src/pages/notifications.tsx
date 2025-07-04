import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

interface Notification {
  id: string;
  userId: string;
  type: string;
  bookingId?: string;
  newStatus?: string;
  read: boolean;
  createdAt: any;
}

const NotificationsPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(20) // Limit to last 20 notifications
        );
        const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          const notificationsData: Notification[] = [];
          snapshot.forEach((doc) => {
            notificationsData.push({ id: doc.id, ...doc.data() } as Notification);
          });
          setNotifications(notificationsData);
          setLoading(false);
        });
        return () => unsubscribeNotifications();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message || 'Failed to mark notification as read.');
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h1>My Notifications</h1>

      {notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id} style={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
              <p><strong>Type:</strong> {notification.type}</p>
              {notification.bookingId && <p>Booking ID: {notification.bookingId}</p>}
              {notification.newStatus && <p>New Status: {notification.newStatus}</p>}
              <p>Received At: {new Date(notification.createdAt.toDate()).toLocaleString()}</p>
              {!notification.read && (
                <button onClick={() => markAsRead(notification.id)}>Mark as Read</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
