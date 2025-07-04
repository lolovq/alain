import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationsPage from '../notifications';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

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
      doc: jest.fn(() => ({
        update: jest.fn(),
      })),
    })),
  },
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((q, callback) => {
    // Simulate some notification data
    const mockNotifications = [
      { id: 'n1', userId: 'test-uid', type: 'booking_status_update', bookingId: 'b1', newStatus: 'accepted', read: false, createdAt: { toDate: () => new Date() } },
      { id: 'n2', userId: 'test-uid', type: 'new_booking', bookingId: 'b2', read: true, createdAt: { toDate: () => new Date() } },
    ];
    callback({ forEach: (cb: any) => mockNotifications.forEach(item => cb({ id: item.id, data: () => item })) });
    return jest.fn(); // Return unsubscribe function
  }),
  orderBy: jest.fn(),
  limit: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notifications for the user', async () => {
    render(<NotificationsPage />);

    expect(await screen.findByText(/Type: booking_status_update/i)).toBeInTheDocument();
    expect(screen.getByText(/Type: new_booking/i)).toBeInTheDocument();
  });

  it('allows marking a notification as read', async () => {
    render(<NotificationsPage />);

    const markAsReadButton = await screen.findByRole('button', { name: /Mark as Read/i });
    fireEvent.click(markAsReadButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { read: true });
    });
  });
});
