import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BankPage from '../bank';
import { auth, db, functions } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
    })),
  },
  functions: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((q, callback) => {
    // Simulate an empty snapshot initially
    callback({ forEach: (cb: any) => {} });
    return jest.fn(); // Return unsubscribe function
  }),
}));

// Mock Firebase functions callable
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { message: 'Sync successful!' } }))),
}));

describe('BankPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sync transactions button', async () => {
    render(<BankPage />);

    expect(await screen.findByText(/Sync Bank Transactions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sync Transactions/i })).toBeInTheDocument();
  });

  it('allows syncing transactions', async () => {
    render(<BankPage />);

    fireEvent.click(screen.getByRole('button', { name: /Sync Transactions/i }));

    await waitFor(() => {
      expect(httpsCallable).toHaveBeenCalledWith(functions, 'syncBankTransactions');
    });
  });
});
