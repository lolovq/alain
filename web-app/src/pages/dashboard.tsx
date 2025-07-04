import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db, requestForToken } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Check user role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data()?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        // Request FCM token
        requestForToken(user.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <nav>
        <ul>
          <li>
            <Link href={`/profile/${user.uid}`}>My Profile</Link>
          </li>
          <li>
            <Link href="/invoices">Invoices</Link>
          </li>
          <li>
            <Link href="/expenses">Expenses</Link>
          </li>
          <li>
            <Link href="/bank">Bank Reconciliation</Link>
          </li>
          <li>
            <Link href="/fiscalAdvice">Fiscal Advice (AI)</Link>
          </li>
          <li>
            <Link href="/services">Services</Link>
          </li>
          <li>
            <Link href="/createService">Create Service</Link>
          </li>
          <li>
            <Link href="/bookings">Bookings</Link>
          </li>
          <li>
            <Link href="/notifications">Notifications</Link>
          </li>
          {isAdmin && (
            <li>
              <Link href="/adminDashboard">Admin Dashboard</Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default DashboardPage;
