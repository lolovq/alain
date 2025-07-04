import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateServicePage from '../createService';
import { auth, db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
}));

describe('CreateServicePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create service form', async () => {
    render(<CreateServicePage />);

    expect(await screen.findByLabelText(/Title:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Service/i })).toBeInTheDocument();
  });

  it('allows creating a new service', async () => {
    render(<CreateServicePage />);

    fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Test Service' } });
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Test Category' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Service/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        title: 'Test Service',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        ownerId: 'test-uid',
      }));
    });
  });
});
