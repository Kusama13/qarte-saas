'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Search,
  Wallet,
  Loader2,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { formatPhoneNumber, validateFrenchPhone } from '@/lib/utils';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    const savedPhone = getCookie('customer_phone');
    if (savedPhone) {
      // Already has phone saved, go to cards
      router.replace('/customer/cards');
    } else {
      setChecking(false);
    }
  }, [router]);

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateFrenchPhone(phoneNumber)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Verify phone has cards
      const response = await fetch(`/api/customers/cards?phone=${encodeURIComponent(formattedPhone)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      // Save phone to cookie regardless of whether cards exist
      // They might scan a QR later
      setCookie('customer_phone', formattedPhone, 30);

      // Redirect to cards page
      router.push('/customer/cards');
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors de la recherche');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Background decorations */}
      <div className="absolute top-[-10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] -right-[10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
            <span className="text-white font-black italic text-lg">Q</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Qarte</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-[2rem] bg-white shadow-2xl shadow-indigo-100 text-indigo-600 ring-1 ring-gray-100">
              <Wallet className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Mes cartes de fidélité
            </h1>
            <p className="mt-3 text-lg text-gray-500 font-medium">
              Entrez votre numéro pour retrouver vos cartes de fidélité
            </p>
          </div>

          <div className="p-8 bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Numéro de mobile</label>
                <div className="relative group">
                  <Input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    autoFocus
                    className="h-14 text-lg pl-12 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-2xl transition-all shadow-sm"
                  />
                  <Phone className="absolute w-5 h-5 text-gray-400 left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-5 h-5 mr-2" />
                Continuer
              </Button>
            </form>
          </div>

          <div className="mt-12 p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100/50 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              Nouveau ici ? <span className="font-bold text-emerald-600">Scannez un QR code</span> chez un commerçant partenaire pour créer votre première carte.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="text-[11px] font-medium text-gray-400">Créé avec</span>
          <span className="text-sm">❤️</span>
          <span className="text-[11px] font-medium text-gray-400">en France</span>
        </div>
        <span className="text-xs font-medium text-gray-300">Qarte • Fidélisez mieux</span>
      </footer>
    </div>
  );
}
