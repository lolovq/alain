import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';

interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
}

const ManageUsersPage = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Check if current user is admin
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data()?.role === 'admin') {
          // Fetch all users
          const q = query(collection(db, "users"));
          const unsubscribeUsers = onSnapshot(q, (snapshot) => {
            const usersData: AppUser[] = [];
            snapshot.forEach((doc) => {
              usersData.push({ uid: doc.id, ...doc.data() } as AppUser);
            });
            setUsers(usersData);
            setLoading(false);
          });
          return () => unsubscribeUsers();
        } else {
          router.push('/dashboard'); // Redirect non-admins
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setError(null);
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      alert(`User ${userId} role updated to ${newRole}`);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role.');
    }
  };

  if (loading || !currentUser) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h1>Manage Users</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.uid} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Display Name:</strong> {user.displayName || 'N/A'}</p>
              <p><strong>Current Role:</strong> {user.role || 'user'}</p>
              {user.uid !== currentUser?.uid && ( // Prevent admin from changing their own role via this UI
                <div>
                  <button
                    onClick={() => handleRoleChange(user.uid, user.role === 'admin' ? 'user' : 'admin')}
                  >
                    Change to {user.role === 'admin' ? 'User' : 'Admin'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageUsersPage;
