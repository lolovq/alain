import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServicesPage from '../services';
import { auth, db } from '../../firebase';
import algoliasearch from 'algoliasearch/lite';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Firebase auth
jest.mock('../../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'test-uid', email: 'test@example.com' }); // Simulate logged-in user
      return jest.fn(); // Return unsubscribe function
    }),
    currentUser: { uid: 'test-uid' },
  },
  db: {
    collection: jest.fn(() => ({
      addDoc: jest.fn(),
      doc: jest.fn(() => ({
        delete: jest.fn(),
      })),
    })),
  },
}));

// Mock Algolia search client
jest.mock('algoliasearch/lite', () => jest.fn(() => ({
  initIndex: jest.fn(() => ({
    search: jest.fn(() => Promise.resolve({
      hits: [
        { objectID: '1', title: 'Test Service 1', description: 'Desc 1', price: 10, category: 'Cat1', ownerId: 'test-uid' },
        { objectID: '2', title: 'Test Service 2', description: 'Desc 2', price: 20, category: 'Cat2', ownerId: 'other-uid' },
      ],
    })),
  })),
})));

// Mock environment variables
process.env.NEXT_PUBLIC_ALGOLIA_APP_ID = 'test-app-id';
process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

describe('ServicesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search box and service hits', async () => {
    render(<ServicesPage />);

    expect(await screen.findByPlaceholderText(/Search.../i)).toBeInTheDocument();
    expect(await screen.findByText(/Test Service 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Service 2/i)).toBeInTheDocument();
  });

  it('renders edit and delete buttons for owned services', async () => {
    render(<ServicesPage />);

    expect(await screen.findByText(/Test Service 1/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it("renders book service link for other users' services", async () => {
    render(<ServicesPage />);

    expect(await screen.findByText(/Test Service 2/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Book Service/i })).toBeInTheDocument();
  });

  it('allows deleting a service', async () => {
    render(<ServicesPage />);

    window.confirm = jest.fn(() => true); // Mock window.confirm

    fireEvent.click(await screen.findByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(db.collection('services').doc('1').delete).toHaveBeenCalled();
    });
  });
});
