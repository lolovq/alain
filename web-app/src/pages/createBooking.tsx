import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  ownerId: string;
}

const CreateBookingPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const { serviceId: queryServiceId } = router.query;
    if (queryServiceId) {
      setServiceId(queryServiceId as string);
      const fetchService = async () => {
        setLoading(true);
        setError(null);
        try {
          const serviceDocRef = doc(db, "services", queryServiceId as string);
          const serviceDocSnap = await getDoc(serviceDocRef);
          if (serviceDocSnap.exists()) {
            setService({ id: serviceDocSnap.id, ...serviceDocSnap.data() } as Service);
          } else {
            setError("Service not found.");
          }
        } catch (err: any) {
          console.error("Error fetching service:", err);
          setError(err.message || "Failed to load service details.");
        } finally {
          setLoading(false);
        }
      };
      fetchService();
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user || !serviceId || !date || !time || !service) {
      setError('Please fill in all fields and select a service.');
      setLoading(false);
      return;
    }

    if (user.uid === service.ownerId) {
      setError('You cannot book your own service.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        serviceId: service.id,
        bookerId: user.uid,
        providerId: service.ownerId,
        date,
        time,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      alert('Booking created successfully!');
      router.push('/bookings'); // Redirect to bookings list
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Create New Booking</h1>
      {service ? (
        <div>
          <h2>Booking Service: {service.title}</h2>
          <p>Description: {service.description}</p>
          <p>Price: {service.price}</p>
          <p>Provider: {service.ownerId} (TODO: Fetch provider name)</p>
        </div>
      ) : (
        <p>Select a service to book.</p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="time">Time:</label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
};

export default CreateBookingPage;
