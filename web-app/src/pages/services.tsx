import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, useSearchBox, useHits, useRefinementList } from 'react-instantsearch-hooks';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';

// Configure these using Next.js Environment Variables (e.g., .env.local)
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY as string
);

const Hit = ({ hit }: { hit: any }) => (
  <div>
    <h3>{hit.title}</h3>
    <p>{hit.description}</p>
    <p>Price: {hit.price}</p>
    <p>Category: {hit.category}</p>
    {hit.ownerId === auth.currentUser?.uid ? (
      <div>
        <Link href={`/editService/${hit.objectID}`}>Edit</Link>
        <button onClick={() => handleDeleteService(hit.objectID)}>Delete</button>
      </div>
    ) : (
      <Link href={`/createBooking?serviceId=${hit.objectID}`}>Book Service</Link>
    )}
  </div>
);

const handleDeleteService = async (serviceId: string) => {
  if (confirm('Are you sure you want to delete this service?')) {
    try {
      await deleteDoc(doc(db, "services", serviceId));
      alert('Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service.');
    }
  }
};

const ServicesPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const MySearchBox = () => {
    const { query, refine } = useSearchBox();

    return (
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => refine(e.currentTarget.value)}
      />
    );
  };

  const MyRefinementList = ({ attribute }: { attribute: string }) => {
    const { items, refine } = useRefinementList({ attribute });

    return (
      <ul>
        {items.map((item) => (
          <li key={item.value}>
            <a
              href="#"
              style={{ fontWeight: item.isRefined ? 'bold' : 'normal' }}
              onClick={(event) => {
                event.preventDefault();
                refine(item.value);
              }}
            >
              {item.label} ({item.count})
            </a>
          </li>
        ))}
      </ul>
    );
  };

  const MyHits = () => {
    const { hits } = useHits();

    return (
      <div>
        {hits.map((hit: any) => (
          <Hit key={hit.objectID} hit={hit} />
        ))}
      </div>
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Services</h1>
      <InstantSearch searchClient={searchClient} indexName="services">
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <h2>Search</h2>
            <MySearchBox />

            <h2>Categories</h2>
            <MyRefinementList attribute="category" />

            <h2>Price</h2>
                        {/* <RangeSlider attribute="price" /> */}
          </div>
          <div style={{ flex: 3 }}>
            <h2>Results</h2>
            <MyHits />
          </div>
        </div>
      </InstantSearch>
    </div>
  );
};

export default ServicesPage;
