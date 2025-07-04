import { render, screen } from '@testing-library/react';
import LoginPage from '../login';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Firebase auth
jest.mock('../../firebase', () => ({
  auth: {},
}));

// Mock signInWithEmailAndPassword
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

describe('LoginPage', () => {
  it('renders a login form', () => {
    render(<LoginPage />);

    // Check if the email and password input fields are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    // Check if the login button is rendered
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
});
