import { useEffect, useState } from 'react';
import { auth, db, functions } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface Booking {
  id: string;
  serviceId: string;
  bookerId: string;
  providerId: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: any;
}

const BookingsPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch bookings where user is either booker or provider
        const q = query(
          collection(db, "bookings"),
          where("bookerId", "==", user.uid)
        );
        const q2 = query(
          collection(db, "bookings"),
          where("providerId", "==", user.uid)
        );

        const unsubscribeBookings = onSnapshot(q, (snapshot) => {
          const bookingsData: Booking[] = [];
          snapshot.forEach((doc) => {
            bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
          });
          // Merge with provider bookings
          onSnapshot(q2, (snapshot2) => {
            snapshot2.forEach((doc2) => {
              if (!bookingsData.some(b => b.id === doc2.id)) {
                bookingsData.push({ id: doc2.id, ...doc2.data() } as Booking);
              }
            });
            setBookings(bookingsData);
            setLoading(false);
          });
        });
        return () => unsubscribeBookings();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    setError(null);
    setLoading(true);
    try {
      const updateBookingStatusCallable = httpsCallable(functions, 'updateBookingStatus');
      await updateBookingStatusCallable({ bookingId, newStatus });
      alert('Booking status updated successfully!');
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      setError(err.message || 'Error updating booking status.');
    } finally {
      setLoading(false);
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
      <h1>My Bookings</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <ul>
          {bookings.map((booking) => (
            <li key={booking.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <p><strong>Service ID:</strong> {booking.serviceId}</p>
              <p><strong>Booker ID:</strong> {booking.bookerId}</p>
              <p><strong>Provider ID:</strong> {booking.providerId}</p>
              <p><strong>Date:</strong> {booking.date} at {booking.time}</p>
              <p><strong>Status:</strong> {booking.status}</p>
              {booking.providerId === user.uid && booking.status === 'pending' && (
                <div>
                  <button onClick={() => handleStatusUpdate(booking.id, 'accepted')} disabled={loading}>Accept</button>
                  <button onClick={() => handleStatusUpdate(booking.id, 'rejected')} disabled={loading}>Reject</button>
                </div>
              )}
              {booking.providerId === user.uid && booking.status === 'accepted' && (
                <button onClick={() => handleStatusUpdate(booking.id, 'completed')} disabled={loading}>Mark as Completed</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookingsPage;

