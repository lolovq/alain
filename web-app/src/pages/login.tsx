import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, analytics } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { logEvent } from 'firebase/analytics';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validateEmail = (email: string) => {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (analytics) {
        logEvent(analytics, 'login', { method: 'email_password' }); // Log login event
      }
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Failed to log in.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again later.';
      }
      setError(errorMessage);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Log In</button>
      </form>
      <p>
        Don't have an account? <Link href="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
