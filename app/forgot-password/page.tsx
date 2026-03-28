'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { validateEmail } from '@/lib/sanitization';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kaari-cream/30 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-kaari-dark/60 hover:text-kaari-dark transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <h1 className="font-display text-3xl text-foreground mb-2">Forgot Password?</h1>
        <p className="text-muted-foreground mb-8">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-lg">
            <p className="font-semibold mb-1">Check your email</p>
            <p className="text-sm">
              If an account exists for this email, you will receive a password reset link shortly.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-body text-sm text-kaari-dark mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-kaari-dark/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-kaari-dark/20 rounded-lg focus:outline-none focus:border-kaari-dark"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-kaari-dark text-kaari-cream font-body text-sm uppercase tracking-widest hover:bg-kaari-dark/90 disabled:bg-kaari-dark/50 transition-colors rounded-lg flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
            </form>
          </>
        )}

        <p className="text-center text-kaari-dark/60 mt-6 text-sm">
          Remember your password?{' '}
          <Link
            href="/login"
            className="text-kaari-dark font-semibold hover:text-kaari-gold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
