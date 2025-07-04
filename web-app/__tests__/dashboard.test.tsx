import { render, screen } from '@testing-library/react';
import DashboardPage from '../dashboard';

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
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: () => true,
          data: () => ({ role: 'user' }), // Simulate a regular user
        })),
      })),
    })),
  },
  requestForToken: jest.fn(),
}));

describe('DashboardPage', () => {
  it('renders welcome message for logged-in user', async () => {
    render(<DashboardPage />);

    // Wait for the loading state to resolve
    expect(await screen.findByText(/Welcome, test@example.com/i)).toBeInTheDocument();
  });

  it('renders admin dashboard link for admin user', async () => {
    // Mock the user role to be admin
    jest.mock('../../firebase', () => ({
      auth: {
        onAuthStateChanged: jest.fn((callback) => {
          callback({ uid: 'test-uid', email: 'test@example.com' });
          return jest.fn();
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
      requestForToken: jest.fn(),
    }));

    render(<DashboardPage />);

    // Wait for the admin dashboard link to appear
    expect(await screen.findByText(/Admin Dashboard/i)).toBeInTheDocument();
  });
});
