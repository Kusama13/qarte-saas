'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Mail,
  User,
  MessageSquare,
  Send,
  Check,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { validateEmail } from '@/lib/utils';

const subjectOptions = [
  { value: 'question', label: 'Question générale' },
  { value: 'bug', label: 'Signaler un bug' },
  { value: 'feature', label: 'Demande de fonctionnalité' },
  { value: 'other', label: 'Autre' },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    if (!formData.subject) {
      setError('Veuillez sélectionner un sujet');
      return;
    }

    if (formData.message.length < 10) {
      setError('Votre message doit contenir au moins 10 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-green-100">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Message envoyé !
          </h1>
          <p className="text-gray-600 mb-8">
            Merci pour votre message. Nous vous répondrons dans les plus brefs
            délais.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-primary">
            <ArrowLeft className="w-5 h-5 inline mr-1" />
            Retour
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 mx-auto max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contactez-nous</h1>
          <p className="mt-2 text-gray-600">
            Une question ? Un problème ? Nous sommes là pour vous aider.
          </p>
        </div>

        <div className="p-8 bg-white shadow-xl rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl">
                {error}
              </div>
            )}

            <div className="relative">
              <Input
                type="text"
                label="Nom"
                placeholder="Votre nom"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <User className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
            </div>

            <div className="relative">
              <Input
                type="email"
                label="Email"
                placeholder="votre@email.fr"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <Mail className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
            </div>

            <Select
              label="Sujet"
              placeholder="Sélectionnez un sujet"
              options={subjectOptions}
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
            />

            <div className="relative">
              <Textarea
                label="Message"
                placeholder="Décrivez votre demande en détail..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                maxLength={1000}
                showCount
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              <Send className="w-5 h-5 mr-2" />
              Envoyer le message
            </Button>
          </form>
        </div>

        {/* WhatsApp Quick Contact */}
        <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Réponse plus rapide ?</p>
              <p className="text-sm text-gray-600">Contactez-nous sur WhatsApp</p>
            </div>
          </div>
          <a
            href="https://wa.me/33612345678?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20Qarte"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            <MessageCircle className="w-5 h-5" />
            Discuter sur WhatsApp
          </a>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Ou contactez-nous par email :{' '}
            <a
              href="mailto:contact@getqarte.com"
              className="text-primary hover:underline"
            >
              contact@getqarte.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
