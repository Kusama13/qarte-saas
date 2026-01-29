'use client';

import { useState, useEffect, useCallback } from 'react';

type EmailType = 'ebook' | 'qrcode';

export default function TestEmailsPage() {
  const [selectedEmail, setSelectedEmail] = useState<EmailType>('ebook');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadEmail = useCallback(async (type: EmailType) => {
    setSelectedEmail(type);
    setLoading(true);
    try {
      const res = await fetch(`/api/test-emails?type=${type}`);
      const data = await res.json();
      setHtmlContent(data.html);
    } catch (error) {
      console.error('Error loading email:', error);
      setHtmlContent('<p>Erreur lors du chargement</p>');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEmail('ebook');
  }, [loadEmail]);

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

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => loadEmail('ebook')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedEmail === 'ebook'
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📚 Ebook Email
          </button>
          <button
            onClick={() => loadEmail('qrcode')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedEmail === 'qrcode'
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📱 QR Code Email
          </button>
        </div>

        {/* Email Preview */}
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
                <span className="text-gray-900">
                  {selectedEmail === 'ebook'
                    ? '📚 Votre guide de fidelisation est pret !'
                    : '📱 Votre QR code menu est pret !'}
                </span>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="p-6">
            {!htmlContent && !loading && (
              <div className="text-center py-20 text-gray-500">
                Cliquez sur un template pour le previsualiser
              </div>
            )}
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
