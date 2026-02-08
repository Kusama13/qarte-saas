'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Loader2,
  UserPlus,
  Target,
  Gift,
  Moon,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';

interface AutomationSettings {
  welcome_enabled: boolean;
  close_to_reward_enabled: boolean;
  reward_ready_enabled: boolean;
  inactive_reminder_enabled: boolean;
  reward_reminder_enabled: boolean;
  welcome_sent: number;
  close_to_reward_sent: number;
  reward_ready_sent: number;
  inactive_reminder_sent: number;
  reward_reminder_sent: number;
}

interface Automation {
  id: keyof Pick<AutomationSettings,
    'welcome_enabled' |
    'close_to_reward_enabled' |
    'reward_ready_enabled' |
    'inactive_reminder_enabled' |
    'reward_reminder_enabled'
  >;
  sentKey: keyof Pick<AutomationSettings,
    'welcome_sent' |
    'close_to_reward_sent' |
    'reward_ready_sent' |
    'inactive_reminder_sent' |
    'reward_reminder_sent'
  >;
  title: string;
  description: string;
  trigger: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  type: 'realtime' | 'daily';
}

const automations: Automation[] = [
  {
    id: 'welcome_enabled',
    sentKey: 'welcome_sent',
    title: 'Bienvenue',
    description: 'Accueillez les nouveaux clients avec un message de bienvenue',
    trigger: 'Premier passage du client',
    icon: UserPlus,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    type: 'realtime',
  },
  {
    id: 'close_to_reward_enabled',
    sentKey: 'close_to_reward_sent',
    title: 'Presque récompensé',
    description: 'Motivez les clients proches de leur récompense',
    trigger: 'Plus que 1-2 tampons',
    icon: Target,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    type: 'realtime',
  },
  {
    id: 'reward_ready_enabled',
    sentKey: 'reward_ready_sent',
    title: 'Récompense prête',
    description: 'Félicitez les clients qui débloquent leur récompense',
    trigger: 'Carte complétée',
    icon: Gift,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    type: 'realtime',
  },
  {
    id: 'inactive_reminder_enabled',
    sentKey: 'inactive_reminder_sent',
    title: 'Rappel inactifs',
    description: 'Rappelez aux clients inactifs de revenir vous voir',
    trigger: 'Pas de visite depuis 30 jours',
    icon: Moon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    type: 'daily',
  },
  {
    id: 'reward_reminder_enabled',
    sentKey: 'reward_reminder_sent',
    title: 'Rappel récompense',
    description: 'Rappelez aux clients de venir chercher leur cadeau',
    trigger: 'Récompense non utilisée depuis 7 jours',
    icon: Clock,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    type: 'daily',
  },
];

export default function AutomationsPage() {
  const { merchant } = useMerchant();
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!merchant?.id) return;

      try {
        const response = await fetch(`/api/push/automations?merchantId=${merchant.id}`);
        const data = await response.json();

        if (response.ok) {
          setSettings(data.settings);
        } else {
          setError(data.error || 'Erreur lors du chargement');
        }
      } catch (err) {
        setError('Erreur de connexion');
      }
      setLoading(false);
    };

    fetchSettings();
  }, [merchant?.id]);

  const toggleAutomation = async (automationId: string, currentValue: boolean) => {
    if (!merchant?.id) return;

    setUpdating(automationId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/push/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          [automationId]: !currentValue,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
        setSuccess(!currentValue ? 'Automatisation activée' : 'Automatisation désactivée');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
    setUpdating(null);
  };

  const totalSent = settings
    ? settings.welcome_sent +
      settings.close_to_reward_sent +
      settings.reward_ready_sent +
      settings.inactive_reminder_sent +
      settings.reward_reminder_sent
    : 0;

  const activeCount = settings
    ? [
        settings.welcome_enabled,
        settings.close_to_reward_enabled,
        settings.reward_ready_enabled,
        settings.inactive_reminder_enabled,
        settings.reward_reminder_enabled,
      ].filter(Boolean).length
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-200">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Automatisations</h1>
            <p className="text-gray-500 text-sm">Notifications push automatiques</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Actives</p>
              {loading ? (
                <div className="h-7 w-8 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-black text-gray-900">{activeCount}/5</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total envoyées</p>
              {loading ? (
                <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-black text-gray-900">{totalSent}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Real-time Automations */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          En temps réel
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {automations
            .filter((a) => a.type === 'realtime')
            .map((automation, index, arr) => {
              const isEnabled = settings?.[automation.id] ?? false;
              const sentCount = settings?.[automation.sentKey] ?? 0;
              const isUpdating = updating === automation.id;

              return (
                <div
                  key={automation.id}
                  className={`p-5 ${index < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${automation.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <automation.icon className={`w-6 h-6 ${automation.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{automation.title}</h3>
                        {sentCount > 0 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            {sentCount} envoyée{sentCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{automation.description}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="font-medium">Déclencheur:</span> {automation.trigger}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleAutomation(automation.id, isEnabled)}
                      disabled={loading || isUpdating}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 ${
                        isEnabled
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-200'
                          : 'bg-gray-200'
                      } ${loading || isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                          isEnabled ? 'left-7' : 'left-1'
                        }`}
                      >
                        {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Daily Automations */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Quotidiennes
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {automations
            .filter((a) => a.type === 'daily')
            .map((automation, index, arr) => {
              const isEnabled = settings?.[automation.id] ?? false;
              const sentCount = settings?.[automation.sentKey] ?? 0;
              const isUpdating = updating === automation.id;

              return (
                <div
                  key={automation.id}
                  className={`p-5 ${index < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${automation.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <automation.icon className={`w-6 h-6 ${automation.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{automation.title}</h3>
                        {sentCount > 0 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            {sentCount} envoyée{sentCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{automation.description}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="font-medium">Déclencheur:</span> {automation.trigger}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleAutomation(automation.id, isEnabled)}
                      disabled={loading || isUpdating}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 ${
                        isEnabled
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-200'
                          : 'bg-gray-200'
                      } ${loading || isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                          isEnabled ? 'left-7' : 'left-1'
                        }`}
                      >
                        {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
        <p className="text-xs text-gray-400 mt-3 px-1">
          Les automatisations quotidiennes sont exécutées une fois par jour automatiquement.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
        <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Comment ça fonctionne ?
        </h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span><strong>En temps réel:</strong> envoyées instantanément lors d'un passage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span><strong>Quotidiennes:</strong> envoyées une fois par jour aux clients concernés</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span>Les clients doivent avoir accepté les notifications push</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span>Chaque automation n'est envoyée qu'une fois par jour par client</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
