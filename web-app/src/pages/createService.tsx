import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreateServicePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError('You must be logged in to create a service.');
      setLoading(false);
      return;
    }

    if (!title || !description || price <= 0 || !category) {
      setError('Please fill in all fields correctly.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "services"), {
        title,
        description,
        price,
        category,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      alert('Service created successfully!');
      setTitle('');
      setDescription('');
      setPrice(0);
      setCategory('');
    } catch (err: any) {
      console.error('Error creating service:', err);
      setError(err.message || 'Failed to create service.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Create New Service</h1>
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
          {loading ? 'Creating...' : 'Create Service'}
        </button>
      </form>
    </div>
  );
};

export default CreateServicePage;
