import { render, screen } from '@testing-library/react';
import RegisterPage from '../register';

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

// Mock createUserWithEmailAndPassword
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

describe('RegisterPage', () => {
  it('renders a registration form', () => {
    render(<RegisterPage />);

    // Check if the email and password input fields are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    // Check if the register button is rendered
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });
});
