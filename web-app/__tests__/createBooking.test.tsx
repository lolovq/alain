import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateBookingPage from '../createBooking';
import { auth, db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { serviceId: 'test-service-id' },
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
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      title: 'Test Service',
      description: 'Test Description',
      price: 100,
      category: 'Test Category',
      ownerId: 'other-uid',
    }),
  })),
}));

describe('CreateBookingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create booking form', async () => {
    render(<CreateBookingPage />);

    expect(await screen.findByText(/Booking Service: Test Service/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Booking/i })).toBeInTheDocument();
  });

  it('allows creating a new booking', async () => {
    render(<CreateBookingPage />);

    fireEvent.change(screen.getByLabelText(/Date:/i), { target: { value: '2024-08-01' } });
    fireEvent.change(screen.getByLabelText(/Time:/i), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Booking/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        serviceId: 'test-service-id',
        bookerId: 'test-uid',
        providerId: 'other-uid',
        date: '2024-08-01',
        time: '10:00',
        status: 'pending',
      }));
    });
  });
});
