'use client';

import { useState, useEffect } from 'react';

export default function TestEmailsPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmail() {
      try {
        const res = await fetch('/api/test-emails?type=qrcode');
        const data = await res.json();
        setHtmlContent(data.html);
      } catch (error) {
        console.error('Error loading email:', error);
        setHtmlContent('<p>Erreur lors du chargement</p>');
      }
      setLoading(false);
    }
    loadEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Test Email Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Previsualisation des templates emails
          </p>
        </div>
      </div>

      {/* Email Preview */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Email Header Info */}
          <div className="bg-gray-50 border-b px-6 py-4">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">From:</span>{' '}
                <span className="text-gray-900">Qarte &lt;noreply@getqarte.com&gt;</span>
              </div>
              <div>
                <span className="text-gray-500">Subject:</span>{' '}
                <span className="text-gray-900">Votre QR code fidelite est pret !</span>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="p-6">
            {loading && (
              <div className="text-center py-20 text-gray-500">
                Chargement...
              </div>
            )}
            {htmlContent && !loading && (
              <iframe
                srcDoc={htmlContent}
                className="w-full border-0"
                style={{ minHeight: '800px' }}
                title="Email Preview"
              />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Cette page est uniquement disponible en developpement
        </div>
      </div>
    </div>
  );
}
