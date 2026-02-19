'use client';

import { useState } from 'react';
import {
  Trash2,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { displayPhoneNumber } from '@/lib/utils';

export interface CustomerDangerZoneProps {
  loyaltyCardId: string;
  phoneNumber: string;
  customerName: string;
  onSuccess: (message: string) => void;
}

export function CustomerDangerZone({
  loyaltyCardId,
  phoneNumber,
  customerName,
  onSuccess,
}: CustomerDangerZoneProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [banConfirm, setBanConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banning, setBanning] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteCustomer = async () => {
    if (!deleteConfirm) {
      setError('Veuillez confirmer la suppression');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/customers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
          ban_number: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      onSuccess('Client supprime !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleBanNumber = async () => {
    if (!banConfirm) {
      setError('Veuillez confirmer le bannissement');
      return;
    }

    setBanning(true);
    setError('');

    try {
      const response = await fetch('/api/customers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
          ban_number: true,
          phone_number: phoneNumber,
          customer_name: customerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du bannissement');
      }

      onSuccess('Numero banni !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du bannissement');
    } finally {
      setBanning(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700">
            Ces actions sont irreversibles.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
          {error}
        </div>
      )}

      {/* Delete Customer */}
      <div className="p-3 border border-gray-200 rounded-xl space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Supprimer le client</p>
            <p className="text-xs text-gray-500">Carte et historique supprimes</p>
          </div>
        </div>

        <label className="flex items-center gap-2.5 p-2 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
          <input
            type="checkbox"
            checked={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.checked)}
            className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-xs text-red-700 font-medium">
            Je confirme vouloir supprimer ce client
          </span>
        </label>

        <Button
          onClick={handleDeleteCustomer}
          loading={deleting}
          disabled={!deleteConfirm}
          className="w-full bg-red-600 hover:bg-red-700 text-sm"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Supprimer definitivement
        </Button>
      </div>

      {/* Ban Number */}
      <div className="p-3 border border-gray-200 rounded-xl space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Ban className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Bannir ce numero</p>
            <p className="text-xs text-gray-500">
              Bloque {displayPhoneNumber(phoneNumber)}
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors">
          <input
            type="checkbox"
            checked={banConfirm}
            onChange={(e) => setBanConfirm(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-xs text-gray-700">
            Je confirme vouloir bannir ce numero
          </span>
        </label>

        <Button
          onClick={handleBanNumber}
          loading={banning}
          disabled={!banConfirm}
          variant="outline"
          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 text-sm"
        >
          <Ban className="w-4 h-4 mr-1.5" />
          Bannir et supprimer
        </Button>
      </div>
    </div>
  );
}
