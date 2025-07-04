import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  ownerId: string;
}

interface UserProfile {
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
}

const UserProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userId } = router.query; // Get userId from URL query parameter

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchProfileAndServices = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user profile
        const userDocRef = doc(db, "users", userId as string);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setProfileUser(userDocSnap.data() as UserProfile);

          // Fetch services for this user
          const q = query(collection(db, "services"), where("ownerId", "==", userId));
          const unsubscribeServices = onSnapshot(q, (snapshot) => {
            const servicesData: Service[] = [];
            snapshot.forEach((doc) => {
              servicesData.push({ id: doc.id, ...doc.data() } as Service);
            });
            setServices(servicesData);
            setLoading(false);
          });
          return () => unsubscribeServices();
        } else {
          setError("User not found.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching profile or services:", err);
        setError(err.message || "Failed to load profile.");
        setLoading(false);
      }
    };

    fetchProfileAndServices();
  }, [userId]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!profileUser) {
    return <p>No profile data available.</p>;
  }

  return (
    <div>
      <h1>User Profile: {profileUser.displayName || profileUser.email}</h1>
      {profileUser.photoURL && <img src={profileUser.photoURL} alt="Profile" width="100" height="100" />}
      <p>Email: {profileUser.email}</p>
      <p>Role: {profileUser.role || 'User'}</p>

      <h2>Services Offered by {profileUser.displayName || profileUser.email}</h2>
      {services.length === 0 ? (
        <p>No services offered yet.</p>
      ) : (
        <ul>
          {services.map((service) => (
            <li key={service.id}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <p>Price: {service.price}</p>
              <p>Category: {service.category}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserProfilePage;

