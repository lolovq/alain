import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FiscalAdvicePage from '../fiscalAdvice';
import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase functions callable
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { advice: 'Test advice' } }))),
}));

// Mock Firebase functions
jest.mock('../../firebase', () => ({
  functions: {},
}));

describe('FiscalAdvicePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the fiscal advice input and button', () => {
    render(<FiscalAdvicePage />);

    expect(screen.getByPlaceholderText(/Ask a question about fiscal matters.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Advice/i })).toBeInTheDocument();
  });

  it('displays advice after getting it', async () => {
    render(<FiscalAdvicePage />);

    fireEvent.change(screen.getByPlaceholderText(/Ask a question about fiscal matters.../i), { target: { value: 'What about taxes?\n' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Advice/i }));

    await waitFor(() => {
      expect(screen.getByText(/Test advice/i)).toBeInTheDocument();
    });
  });
});
