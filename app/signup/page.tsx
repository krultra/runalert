import SignupForm from '@/app/components/auth/SignupForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - RunAlert',
  description: 'Create a new RunAlert account',
};

export default function SignupPage() {
  return <SignupForm />;
}
