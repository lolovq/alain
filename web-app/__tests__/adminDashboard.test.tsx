import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboardPage from '../adminDashboard';
import { auth, db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
      callback({ uid: 'admin-uid', email: 'admin@example.com' }); // Simulate logged-in admin user
      return jest.fn(); // Return unsubscribe function
    }),
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: () => true,
          data: () => ({ role: 'admin' }), // Simulate an admin user
        })),
      })),
    })),
  },
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn((docRef, callback) => {
    // Simulate some stats data
    const mockStats = {
      totalUsers: 10,
      totalBookings: 50,
      completedBookings: 30,
      pendingBookings: 20,
    };
    callback({ exists: () => true, data: () => mockStats });
    return jest.fn(); // Return unsubscribe function
  }),
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin dashboard with statistics', async () => {
    render(<AdminDashboardPage />);

    expect(await screen.findByText(/Admin Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Users: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Bookings: 50/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed Bookings: 30/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Bookings: 20/i)).toBeInTheDocument();
  });
});
