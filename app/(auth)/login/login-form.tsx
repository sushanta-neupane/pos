'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { FormCard } from '@/components/form-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (!res || res.error) {
      if (res?.error === 'CredentialsSignin') {
        toast.error('Invalid credentials');
      } else {
        toast.error(
          res?.error ? `Sign in failed: ${res.error}` : 'Sign in failed',
        );
      }
      return;
    }

    router.push(next ?? '/');
    router.refresh();
  }

  return (
    <FormCard title="Welcome back" description="Sign in to continue.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Email</div>
          <Input
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@local.test"
            autoComplete="email"
            className="h-11 rounded-md"
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Password</div>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            className="h-11 rounded-md"
          />
        </div>
        <Button className="w-full h-11" disabled={loading} type="submit">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link href="/register" className="text-primary underline underline-offset-4">
            Create one
          </Link>
        </div>
      </form>
    </FormCard>
  );
}
