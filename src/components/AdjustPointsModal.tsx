'use client';

import { useState } from 'react';
import { X, Plus, Minus, Loader2, Check } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';

interface AdjustPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerId: string;
  merchantId: string;
  loyaltyCardId: string;
  currentStamps: number;
  stampsRequired: number;
  onSuccess: () => void;
}

export function AdjustPointsModal({
  isOpen,
  onClose,
  customerName,
  customerId,
  merchantId,
  loyaltyCardId,
  currentStamps,
  stampsRequired,
  onSuccess,
}: AdjustPointsModalProps) {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleQuickAdjust = (value: number) => {
    setAdjustment(value);
  };

  const handleSubmit = async () => {
    if (adjustment === 0) {
      setError('Veuillez sélectionner un ajustement');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          merchant_id: merchantId,
          loyalty_card_id: loyaltyCardId,
          adjustment,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajustement');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajustement');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAdjustment(0);
    setReason('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const newStamps = Math.max(0, currentStamps + adjustment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
        <button
          onClick={handleClose}
          className="absolute p-2 transition-colors rounded-lg top-4 right-4 hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Ajuster les points
          </h2>
          <p className="text-gray-600 mb-6">{customerName}</p>

          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-100">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                Points ajustés avec succès !
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 mb-6 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Actuellement</span>
                  <span className="font-semibold text-gray-900">
                    {currentStamps} / {stampsRequired} passages
                  </span>
                </div>
                {adjustment !== 0 && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Après ajustement</span>
                    <span className={`font-semibold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {newStamps} / {stampsRequired} passages
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block mb-3 text-sm font-medium text-gray-700">
                  Ajustement rapide
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust(1)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                      adjustment === 1
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    +1 point
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust(-1)}
                    disabled={currentStamps === 0}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                      adjustment === -1
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Minus className="w-5 h-5" />
                    -1 point
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Ou entrez une valeur
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 2 ou -3"
                  value={adjustment === 0 ? '' : adjustment}
                  onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                  className="text-center text-lg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Valeurs positives pour ajouter, négatives pour retirer
                </p>
              </div>

              <div className="mb-6">
                <Textarea
                  label="Raison (optionnel)"
                  placeholder="Ex: Erreur de scan, geste commercial..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={100}
                  showCount
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={adjustment === 0}
                  className="flex-1"
                >
                  Valider
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
