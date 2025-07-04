import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingsPage from '../bookings';
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
    // Simulate some booking data
    const mockBookings = [
      { id: 'b1', serviceId: 's1', bookerId: 'test-uid', providerId: 'other-uid', date: '2024-08-01', time: '10:00', status: 'pending' },
      { id: 'b2', serviceId: 's2', bookerId: 'other-uid', providerId: 'test-uid', date: '2024-08-02', time: '11:00', status: 'accepted' },
    ];
    callback({ forEach: (cb: any) => mockBookings.forEach(item => cb({ id: item.id, data: () => item })) });
    return jest.fn(); // Return unsubscribe function
  }),
}));

// Mock Firebase functions callable
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { message: 'Status updated!' } }))),
}));

describe('BookingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders bookings for the user', async () => {
    render(<BookingsPage />);

    expect(await screen.findByText(/Service ID: s1/i)).toBeInTheDocument();
    expect(screen.getByText(/Service ID: s2/i)).toBeInTheDocument();
  });

  it('allows provider to update booking status', async () => {
    render(<BookingsPage />);

    // Find the accept button for the booking where current user is provider
    const acceptButton = await screen.findByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(httpsCallable).toHaveBeenCalledWith(functions, 'updateBookingStatus');
      expect(httpsCallable).toHaveBeenCalledWith(functions, 'updateBookingStatus', { bookingId: 'b1', newStatus: 'accepted' });
    });
  });
});
