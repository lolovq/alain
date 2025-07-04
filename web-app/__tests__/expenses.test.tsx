import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpensesPage from '../expenses';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// Mock Firebase Storage functions
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve({ ref: {} })),
  getDownloadURL: jest.fn(() => Promise.resolve('http://example.com/download-url')),
}));

describe('ExpensesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the expense upload section', async () => {
    render(<ExpensesPage />);

    expect(await screen.findByText(/Upload Expense Receipt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload Receipt/i)).toBeInTheDocument();
  });

  it('allows uploading a file', async () => {
    render(<ExpensesPage />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Upload Receipt/i);

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Upload Receipt/i }));

    await waitFor(() => {
      expect(uploadBytes).toHaveBeenCalledWith(expect.anything(), file, expect.objectContaining({
        customMetadata: { userId: 'test-uid' },
      }));
    });
  });
});
