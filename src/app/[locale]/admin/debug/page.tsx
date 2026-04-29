'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2, Copy, RefreshCw, AlertTriangle, MousePointer, Clock, Eye, Activity } from 'lucide-react';
import { getFreezeLogs, clearFreezeLogs, type FreezeLog, type LogType } from '@/lib/freeze-detector';
import { formatRelativeTimeShort } from '@/lib/utils';

const TYPE_META: Record<LogType, { label: string; color: string; icon: React.ElementType }> = {
  init: { label: 'Init', color: 'bg-gray-100 text-gray-600', icon: Activity },
  error: { label: 'Erreur JS', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  unhandled_rejection: { label: 'Promise rejetée', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  long_task: { label: 'Long task', color: 'bg-amber-100 text-amber-700', icon: Clock },
  pointerdown: { label: 'Tap', color: 'bg-gray-100 text-gray-600', icon: MousePointer },
  rapid_taps: { label: 'Tap rapides — freeze ?', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
  visibility: { label: 'Visibility', color: 'bg-indigo-50 text-indigo-700', icon: Eye },
  pageshow: { label: 'Pageshow', color: 'bg-indigo-50 text-indigo-700', icon: Eye },
  pagehide: { label: 'Pagehide', color: 'bg-indigo-50 text-indigo-700', icon: Eye },
  freeze: { label: 'Page frozen', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
  resume: { label: 'Page resumed', color: 'bg-emerald-100 text-emerald-700', icon: Activity },
  sw_controller_change: { label: 'SW change', color: 'bg-violet-100 text-violet-700', icon: Activity },
};

type FilterKey = 'all' | 'critical' | 'taps' | 'lifecycle';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'critical', label: 'Critique (errors + freezes)' },
  { key: 'taps', label: 'Taps' },
  { key: 'lifecycle', label: 'Lifecycle' },
];

const CRITICAL_TYPES: LogType[] = ['error', 'unhandled_rejection', 'rapid_taps', 'freeze', 'long_task'];
const TAP_TYPES: LogType[] = ['pointerdown', 'rapid_taps'];
const LIFECYCLE_TYPES: LogType[] = ['visibility', 'pageshow', 'pagehide', 'freeze', 'resume', 'sw_controller_change', 'init'];

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('fr-FR', { hour12: false });
}

export default function DebugPage() {
  const [logs, setLogs] = useState<FreezeLog[]>([]);
  const [filter, setFilter] = useState<FilterKey>('critical');
  const [copied, setCopied] = useState(false);

  const refresh = () => setLogs(getFreezeLogs());

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...logs].sort((a, b) => b.ts - a.ts);
    if (filter === 'all') return sorted;
    if (filter === 'critical') return sorted.filter((l) => CRITICAL_TYPES.includes(l.type));
    if (filter === 'taps') return sorted.filter((l) => TAP_TYPES.includes(l.type));
    if (filter === 'lifecycle') return sorted.filter((l) => LIFECYCLE_TYPES.includes(l.type));
    return sorted;
  }, [logs, filter]);

  const counts = useMemo(() => {
    const c = { errors: 0, rapidTaps: 0, longTasks: 0, freezes: 0 };
    for (const l of logs) {
      if (l.type === 'error' || l.type === 'unhandled_rejection') c.errors++;
      if (l.type === 'rapid_taps') c.rapidTaps++;
      if (l.type === 'long_task') c.longTasks++;
      if (l.type === 'freeze') c.freezes++;
    }
    return c;
  }, [logs]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    if (!confirm('Vider tous les logs ?')) return;
    clearFreezeLogs();
    refresh();
  };

  return (
    <div className="max-w-5xl mx-auto pt-12 lg:pt-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Debug PWA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Logs locaux du navigateur courant (localStorage). Ouvre cette page <strong>depuis la PWA</strong> où le bug arrive.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Erreurs JS" value={counts.errors} tone="red" />
        <Stat label="Taps rapides" value={counts.rapidTaps} tone="rose" />
        <Stat label="Long tasks" value={counts.longTasks} tone="amber" />
        <Stat label="Freezes" value={counts.freezes} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filter === f.key ? 'bg-[#5167fc] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recharger
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copié' : 'Copier JSON'}
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vider
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-500 bg-white border border-gray-100 rounded-xl">
          Aucun log pour ce filtre.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((log, i) => {
            const meta = TYPE_META[log.type];
            const Icon = meta.icon;
            return (
              <li
                key={`${log.ts}-${i}`}
                className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full ${meta.color}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <span className="text-xs text-gray-400">{fmtTime(log.ts)} · il y a {formatRelativeTimeShort(new Date(log.ts), 'fr')}</span>
                </div>
                <p className="mt-1.5 text-sm text-gray-900 font-mono break-all">{log.msg}</p>
                {log.ctx && (
                  <pre className="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(log.ctx, null, 2)}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'red' | 'rose' | 'amber' }) {
  const colorMap = {
    red: 'text-red-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${value > 0 ? colorMap[tone] : 'text-gray-300'}`}>{value}</p>
    </div>
  );
}
