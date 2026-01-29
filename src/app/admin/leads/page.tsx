'use client';

import { useState, useEffect } from 'react';
import {
  Phone,
  UserPlus,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  Search,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';

interface DemoLead {
  id: string;
  phone_number: string;
  created_at: string;
  converted: boolean;
  converted_at: string | null;
  notes: string | null;
}

export default function LeadsPage() {
  const supabase = createClientComponentClient();
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'converted'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('demo_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const markAsConverted = async (id: string) => {
    const { error } = await supabase
      .from('demo_leads')
      .update({ converted: true, converted_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setLeads(leads.map(l => l.id === id ? { ...l, converted: true, converted_at: new Date().toISOString() } : l));
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return;

    const { error } = await supabase
      .from('demo_leads')
      .delete()
      .eq('id', id);

    if (!error) {
      setLeads(leads.filter(l => l.id !== id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' ||
      (filter === 'pending' && !lead.converted) ||
      (filter === 'converted' && lead.converted);

    const matchesSearch = !search ||
      lead.phone_number.includes(search);

    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: leads.length,
    pending: leads.filter(l => !l.converted).length,
    converted: leads.filter(l => l.converted).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Leads Démo
        </h1>
        <p className="mt-1 text-gray-600">
          Prospects ayant testé la démo - à rappeler
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">À rappeler</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Convertis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.converted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'pending', label: 'À rappeler' },
            { key: 'converted', label: 'Convertis' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={cn(
                'px-4 py-2 rounded-xl font-medium transition-colors',
                filter === f.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filteredLeads.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className={cn(
                  'p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4',
                  lead.converted ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full',
                    lead.converted ? 'bg-emerald-100' : 'bg-indigo-100'
                  )}>
                    <Phone className={cn(
                      'w-5 h-5',
                      lead.converted ? 'text-emerald-600' : 'text-indigo-600'
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-lg">
                      {lead.phone_number}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(lead.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {lead.converted ? (
                    <span className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-full flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Converti
                    </span>
                  ) : (
                    <>
                      <a
                        href={`tel:${lead.phone_number}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Appeler
                      </a>
                      <button
                        onClick={() => markAsConverted(lead.id)}
                        className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-xl hover:bg-emerald-200 transition-colors"
                      >
                        Marquer converti
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <UserPlus className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun lead pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">
              Les visiteurs qui testent la démo apparaîtront ici
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
