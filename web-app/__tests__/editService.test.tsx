import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditServicePage from '../editService/[serviceId]';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: () => true,
          data: () => ({
            title: 'Existing Service',
            description: 'Existing Description',
            price: 50,
            category: 'Existing Category',
            ownerId: 'test-uid',
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
      title: 'Existing Service',
      description: 'Existing Description',
      price: 50,
      category: 'Existing Category',
      ownerId: 'test-uid',
    }),
  })),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
}));

describe('EditServicePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the edit service form with existing data', async () => {
    render(<EditServicePage />);

    expect(await screen.findByLabelText(/Title:/i)).toHaveValue('Existing Service');
    expect(screen.getByLabelText(/Description:/i)).toHaveValue('Existing Description');
    expect(screen.getByLabelText(/Price:/i)).toHaveValue(50);
    expect(screen.getByLabelText(/Category:/i)).toHaveValue('Existing Category');
    expect(screen.getByRole('button', { name: /Update Service/i })).toBeInTheDocument();
  });

  it('allows updating a service', async () => {
    render(<EditServicePage />);

    fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Updated Service' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Service/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        title: 'Updated Service',
      }));
    });
  });
});
