'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Check,
  Loader2,
  Smartphone,
  Printer,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { generateQRCode, getScanUrl } from '@/lib/utils';
import { useMerchant } from '@/contexts/MerchantContext';

export default function QRDownloadPage() {
  const { merchant, loading } = useMerchant();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [scanUrl, setScanUrl] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate QR code when merchant data is available
  useEffect(() => {
    if (!merchant?.scan_code) return;
    const url = getScanUrl(merchant.scan_code);
    setScanUrl(url);
    generateQRCode(url).then(setQrCodeUrl);
  }, [merchant?.scan_code]);

  const saveQrImage = () => {
    if (!qrCodeUrl || !merchant) return;

    const link = document.createElement('a');
    link.download = `qr-${merchant.slug}.png`;
    link.href = qrCodeUrl;
    link.click();

    // Track QR download for onboarding checklist (fire and forget)
    fetch('/api/onboarding/status', { method: 'POST' }).catch(() => {});

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          Mon QR code
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
          Montrez-le à vos client(e)s depuis votre téléphone
        </p>
      </div>

      {/* QR Card */}
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${merchant?.primary_color || '#4b0082'}15, ${merchant?.secondary_color || '#7c3aed'}15)`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: merchant?.primary_color || '#4b0082' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: merchant?.secondary_color || '#7c3aed' }}
        />

        <div className="relative px-6 py-8 md:px-10 md:py-12 flex flex-col items-center text-center">
          {/* Shop name */}
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            {merchant?.shop_name}
          </h2>

          {/* CTA above QR */}
          <p className="mt-2 text-sm md:text-base text-gray-500">
            Ajoutez votre carte de fidélité en 15 secondes
          </p>

          {/* QR code */}
          <div className="mt-6 bg-white rounded-2xl p-4 md:p-6 shadow-lg">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48 md:w-56 md:h-56"
              />
            ) : (
              <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
              </div>
            )}
          </div>

          {/* Scannez-moi */}
          <p className="mt-5 text-lg md:text-xl font-bold text-gray-900">
            Scannez-moi !
          </p>

          {/* Branding */}
          <p className="mt-3 text-xs text-gray-400">
            Propulsé par <span className="font-semibold">Qarte</span>
          </p>
        </div>
      </div>

      {/* Test button */}
      {scanUrl && (
        <a
          href={scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-xl text-indigo-700 font-semibold text-sm transition-all hover:shadow-md"
        >
          <Play className="w-4 h-4" />
          Tester l&apos;expérience client
        </a>
      )}

      {/* Save button */}
      <div className="mt-6">
        <Button
          onClick={saveQrImage}
          disabled={!qrCodeUrl}
          className="w-full h-12 md:h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all text-sm md:text-base"
        >
          {downloadSuccess ? (
            <Check className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          ) : (
            <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          )}
          {downloadSuccess ? 'Enregistré !' : 'Enregistrer l\'image'}
        </Button>
      </div>

      {/* Info Message */}
      <div className="mt-4 p-3 md:p-4 bg-indigo-50 rounded-xl md:rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
          </div>
          <p className="text-xs md:text-sm text-indigo-800">
            Gardez-le sur votre téléphone et montrez-le à vos client(e)s au moment de payer
          </p>
        </div>
      </div>

      {/* Social Kit Banner */}
      <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-purple-100">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
            <Printer className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm md:text-base">Pour le comptoir ou la vitrine</h3>
            <p className="text-xs md:text-sm text-gray-600">Imprimez votre kit fidélité ou partagez-le sur Instagram</p>
          </div>
          <Link
            href="/dashboard/social-kit"
            className="px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-xs md:text-sm whitespace-nowrap"
          >
            Voir le kit
          </Link>
        </div>
      </div>
    </div>
  );
}
