import { render, screen, waitFor } from '@testing-library/react';
import UserProfilePage from '../profile/[userId]';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { userId: 'test-uid' },
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
        get: jest.fn(() => Promise.resolve({
          exists: () => true,
          data: () => ({
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'user',
          }),
        })),
      })),
    })),
  },
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    }),
  })),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((q, callback) => {
    // Simulate some services data
    const mockServices = [
      { id: 's1', title: 'Service 1', description: 'Desc 1', price: 10, category: 'Cat1', ownerId: 'test-uid' },
    ];
    callback({ forEach: (cb: any) => mockServices.forEach(item => cb({ id: item.id, data: () => item })) });
    return jest.fn(); // Return unsubscribe function
  }),
}));

describe('UserProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user profile and services', async () => {
    render(<UserProfilePage />);

    expect(await screen.findByText(/User Profile: Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/Email: test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Role: user/i)).toBeInTheDocument();
    expect(screen.getByText(/Services Offered by Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/Service 1/i)).toBeInTheDocument();
  });
});
