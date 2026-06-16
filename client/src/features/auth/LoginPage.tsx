import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { getSetupStatus } from '@/api/auth';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function LoginPage() {
  const { login, registerFirstAdmin } = useAuth();
  const navigate = useNavigate();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSetupStatus()
      .then((s) => setNeedsSetup(s.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (needsSetup) {
        await registerFirstAdmin(name, email, password);
        toast.success('Admin account created');
      } else {
        await login(email, password);
        toast.success('Welcome back');
      }
      navigate('/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Authentication failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-700">Sazia Garments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {needsSetup ? 'Create the first admin account' : 'Sign in to your CRM'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {needsSetup && (
            <Input
              id="name"
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Admin"
            />
          )}
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@sazia.local"
          />
          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Please wait…' : needsSetup ? 'Create admin' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
