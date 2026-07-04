'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const justRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Login failed!');
        return;
      }

      toast.success('Welcome back!');
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-sm"
    >
      <div className="flex flex-col items-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
          className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-4"
        >
          <Lock className="w-5 h-5 text-primary-foreground" />
        </motion.div>
        <h1 className="text-xl font-semibold tracking-tight">Sign in to SkelVault</h1>
        <p className="text-sm text-muted-foreground mt-1">Access your encrypted vault</p>
      </div>

      <Card className="p-5 sm:p-6">
        {justRegistered && (
          <div className="mb-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
            Account created — sign in to continue.
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link href="/auth/register" className="font-medium text-foreground hover:underline underline-offset-4">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 py-10 sm:py-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
