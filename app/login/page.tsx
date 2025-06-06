import LoginForm from '@/app/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - RunAlert',
  description: 'Sign in to your RunAlert account',
};

export default function LoginPage() {
  return <LoginForm />;
}
