import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const EditServicePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { serviceId } = router.query; // Get serviceId from URL query parameter

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
    if (!serviceId) return;

    const fetchService = async () => {
      setLoading(true);
      setError(null);
      try {
        const serviceDocRef = doc(db, "services", serviceId as string);
        const serviceDocSnap = await getDoc(serviceDocRef);

        if (serviceDocSnap.exists()) {
          const data = serviceDocSnap.data();
          setTitle(data?.title || '');
          setDescription(data?.description || '');
          setPrice(data?.price || 0);
          setCategory(data?.category || '');
        } else {
          setError("Service not found.");
        }
      } catch (err: any) {
        console.error("Error fetching service:", err);
        setError(err.message || "Failed to load service.");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user || !serviceId) {
      setError('You must be logged in and a service ID must be provided.');
      setLoading(false);
      return;
    }

    if (!title || !description || price <= 0 || !category) {
      setError('Please fill in all fields correctly.');
      setLoading(false);
      return;
    }

    try {
      const serviceDocRef = doc(db, "services", serviceId as string);
      await updateDoc(serviceDocRef, {
        title,
        description,
        price,
        category,
        updatedAt: serverTimestamp(),
      });
      alert('Service updated successfully!');
      router.push('/services'); // Redirect back to services list
    } catch (err: any) {
      console.error('Error updating service:', err);
      setError(err.message || 'Failed to update service.');
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
      <h1>Edit Service</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            required
            min="0"
          />
        </div>
        <div>
          <label htmlFor="category">Category:</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Service'}
        </button>
      </form>
    </div>
  );
};

export default EditServicePage;
