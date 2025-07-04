import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoicesPage from '../invoices';
import { auth, db, functions } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((q, callback) => {
    // Simulate an empty snapshot initially
    callback({ forEach: (cb: any) => {} });
    return jest.fn(); // Return unsubscribe function
  }),
  serverTimestamp: jest.fn(() => ({})),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Mock Firebase functions callable
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { pdf: 'base64pdf' } }))),
}));

describe('InvoicesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the invoice creation form', async () => {
    render(<InvoicesPage />);

    expect(await screen.findByText(/Create New Invoice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Invoice Number:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Customer ID:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Issue Date:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Invoice/i })).toBeInTheDocument();
  });

  it('allows adding a new invoice', async () => {
    render(<InvoicesPage />);

    fireEvent.change(screen.getByLabelText(/Invoice Number:/i), { target: { value: 'INV-001' } });
    fireEvent.change(screen.getByLabelText(/Customer ID:/i), { target: { value: 'CUST-001' } });
    fireEvent.change(screen.getByLabelText(/Issue Date:/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/Due Date:/i), { target: { value: '2024-01-31' } });

    // Simulate adding an item
    fireEvent.click(screen.getByRole('button', { name: /Add Item/i }));
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText(/Quantity:/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Unit Price:/i), { target: { value: '100' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Invoice/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
      }));
    });
  });
});
