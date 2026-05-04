import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Field, PrimaryButton } from './UI';
import { Mail } from 'lucide-react';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const sendLink = async () => {
    if (!email) return;
    setSending(true); setErr('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setSending(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8F4ED' }}>
      <div className="bg-[#FDFBF7] rounded-lg border border-stone-200 max-w-md w-full p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="display-italic text-3xl tracking-tight" style={{ color: '#6B1F2E' }}>Lumière</div>
          <div className="text-[10px] tracking-[0.3em] text-stone-500 mt-1 uppercase">Wedding Studio</div>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Mail size={20} className="text-emerald-700" />
            </div>
            <div className="display text-xl text-stone-900 mb-2">Check your inbox</div>
            <div className="text-sm text-stone-600 mb-1">Magic link sent to</div>
            <div className="text-sm text-stone-900">{email}</div>
            <button onClick={() => { setSent(false); setEmail(''); }} className="mt-6 text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900">
              Use different email
            </button>
          </div>
        ) : (
          <>
            <div className="text-xs uppercase tracking-[0.25em] text-stone-500 mb-2 text-center">Sign in</div>
            <h2 className="display text-2xl text-stone-900 mb-6 text-center">Welcome back</h2>

            <div className="space-y-4">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@studio.com" />
              {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2.5">{err}</div>}
              <PrimaryButton onClick={sendLink} disabled={!email || sending}>
                {sending ? 'Sending…' : 'Send magic link'}
              </PrimaryButton>
            </div>
            <p className="text-[11px] text-stone-500 mt-6 text-center leading-relaxed">
              We'll email you a link to sign in. No password needed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
