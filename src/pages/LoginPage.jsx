import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex flex-col items-center justify-center p-4">

      {/* Brand */}
      <div className="text-center mb-8">
        <div className="brand-font text-2xl font-semibold tracking-[0.1em] text-stone-900 leading-none">
          WeddingQueen
        </div>
        <div className="text-[9px] uppercase tracking-[0.45em] text-stone-500 mt-2 font-light">
          Master Console
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#1C1917] rounded-2xl shadow-2xl border border-stone-800/60 overflow-hidden">

        {/* Card header accent */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#6B1F2E] to-transparent" />

        <div className="px-8 py-9">
          <div className="mb-7">
            <h1 className="display text-2xl text-stone-100 leading-tight">Welcome back</h1>
            <p className="text-stone-500 text-xs mt-1.5 tracking-wide">Sign in to access your studio</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-rose-950/40 border border-rose-800/40 rounded-lg">
              <p className="text-rose-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-stone-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@studio.com"
                className="w-full bg-stone-900/70 border border-stone-700/80 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-[#6B1F2E] focus:ring-1 focus:ring-[#6B1F2E]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-stone-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-stone-900/70 border border-stone-700/80 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-[#6B1F2E] focus:ring-1 focus:ring-[#6B1F2E]/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B1F2E] hover:bg-[#5a1926] active:bg-[#4a1520] text-white rounded-lg py-3 text-xs uppercase tracking-[0.2em] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-stone-400 text-[10px] mt-7 tracking-[0.15em] uppercase">
        Studio Access Only
      </p>
    </div>
  );
}
