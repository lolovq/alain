import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface GlobalStats {
  totalUsers: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
}

const AdminDashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Check user role
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData && userData.role === 'admin') {
            setIsAdmin(true);
            // Fetch global stats
            const unsubscribeStats = onSnapshot(doc(db, "statistics", "overview"), (docSnapshot) => {
              if (docSnapshot.exists()) {
                setStats(docSnapshot.data() as GlobalStats);
                setLoading(false);
              } else {
                setError("Statistics document not found.");
                setLoading(false);
              }
            }, (err) => {
              console.error("Error fetching stats:", err);
              setError(err.message || "Failed to load statistics.");
              setLoading(false);
            });
            return () => unsubscribeStats();
          } else { // User is logged in, but not admin or user doc doesn't have role
            router.push('/dashboard'); // Redirect non-admins
          }
        } else { // User doc does not exist
          router.push('/dashboard'); // Redirect if user doc doesn't exist (shouldn't happen if createUserProfile works)
        }
      } else { // User is not logged in
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  if (loading || !user || !isAdmin) {
    return <div>Loading or unauthorized...</div>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <nav>
        <ul>
          <li>
            <Link href="/manageUsers">Manage Users</Link>
          </li>
        </ul>
      </nav>

      {stats ? (
        <div>
          <h2>Overall Statistics</h2>
          <p>Total Users: {stats.totalUsers || 0}</p>
          <p>Total Bookings: {stats.totalBookings || 0}</p>
          <p>Completed Bookings: {stats.completedBookings || 0}</p>
          <p>Pending Bookings: {stats.pendingBookings || 0}</p>
        </div>
      ) : (
        <p>No statistics available.</p>
      )}
    </div>
  );
};

export default AdminDashboardPage;