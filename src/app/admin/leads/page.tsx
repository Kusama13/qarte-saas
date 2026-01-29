'use client';

import { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  UserPlus,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  Search,
  QrCode,
  Star,
  BookOpen,
  Smartphone,
  Wrench,
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

interface ToolLead {
  id: string;
  email: string;
  source: 'qr-menu' | 'google-review' | 'ebook';
  business_name: string | null;
  generated_value: string | null;
  created_at: string;
  converted: boolean;
  converted_at: string | null;
  notes: string | null;
}

type Tab = 'demo' | 'tools';

const SOURCE_CONFIG = {
  'qr-menu': { label: 'QR Menu', icon: QrCode, color: 'indigo' },
  'google-review': { label: 'Avis Google', icon: Star, color: 'amber' },
  'ebook': { label: 'Ebook', icon: BookOpen, color: 'emerald' },
};

export default function LeadsPage() {
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState<Tab>('tools');
  const [demoLeads, setDemoLeads] = useState<DemoLead[]>([]);
  const [toolLeads, setToolLeads] = useState<ToolLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'converted'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    // Fetch demo leads
    const { data: demoData } = await supabase
      .from('demo_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (demoData) {
      setDemoLeads(demoData);
    }

    // Fetch tool leads
    const { data: toolData } = await supabase
      .from('tool_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (toolData) {
      setToolLeads(toolData);
    }

    setLoading(false);
  };

  const markDemoAsConverted = async (id: string) => {
    const { error } = await supabase
      .from('demo_leads')
      .update({ converted: true, converted_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setDemoLeads(demoLeads.map(l => l.id === id ? { ...l, converted: true, converted_at: new Date().toISOString() } : l));
    }
  };

  const markToolAsConverted = async (id: string) => {
    const { error } = await supabase
      .from('tool_leads')
      .update({ converted: true, converted_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setToolLeads(toolLeads.map(l => l.id === id ? { ...l, converted: true, converted_at: new Date().toISOString() } : l));
    }
  };

  const deleteDemoLead = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return;

    const { error } = await supabase
      .from('demo_leads')
      .delete()
      .eq('id', id);

    if (!error) {
      setDemoLeads(demoLeads.filter(l => l.id !== id));
    }
  };

  const deleteToolLead = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return;

    const { error } = await supabase
      .from('tool_leads')
      .delete()
      .eq('id', id);

    if (!error) {
      setToolLeads(toolLeads.filter(l => l.id !== id));
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

  const filteredDemoLeads = demoLeads.filter(lead => {
    const matchesFilter = filter === 'all' ||
      (filter === 'pending' && !lead.converted) ||
      (filter === 'converted' && lead.converted);

    const matchesSearch = !search ||
      lead.phone_number.includes(search);

    return matchesFilter && matchesSearch;
  });

  const filteredToolLeads = toolLeads.filter(lead => {
    const matchesFilter = filter === 'all' ||
      (filter === 'pending' && !lead.converted) ||
      (filter === 'converted' && lead.converted);

    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    const matchesSearch = !search ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.business_name && lead.business_name.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSource && matchesSearch;
  });

  const demoStats = {
    total: demoLeads.length,
    pending: demoLeads.filter(l => !l.converted).length,
    converted: demoLeads.filter(l => l.converted).length,
  };

  const toolStats = {
    total: toolLeads.length,
    pending: toolLeads.filter(l => !l.converted).length,
    converted: toolLeads.filter(l => l.converted).length,
    bySource: {
      'qr-menu': toolLeads.filter(l => l.source === 'qr-menu').length,
      'google-review': toolLeads.filter(l => l.source === 'google-review').length,
      'ebook': toolLeads.filter(l => l.source === 'ebook').length,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5167fc]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Leads
        </h1>
        <p className="mt-1 text-gray-600">
          Prospects a contacter et convertir
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tools')}
          className={cn(
            'px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'tools'
              ? 'border-[#5167fc] text-[#5167fc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Wrench className="w-4 h-4" />
          Outils gratuits
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            activeTab === 'tools' ? 'bg-[#5167fc] text-white' : 'bg-gray-100 text-gray-600'
          )}>
            {toolStats.total}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={cn(
            'px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'demo'
              ? 'border-[#5167fc] text-[#5167fc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Smartphone className="w-4 h-4" />
          Demo
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            activeTab === 'demo' ? 'bg-[#5167fc] text-white' : 'bg-gray-100 text-gray-600'
          )}>
            {demoStats.total}
          </span>
        </button>
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
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === 'tools' ? toolStats.total : demoStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">A contacter</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === 'tools' ? toolStats.pending : demoStats.pending}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === 'tools' ? toolStats.converted : demoStats.converted}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Source breakdown for tools */}
      {activeTab === 'tools' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const count = toolStats.bySource[key as keyof typeof toolStats.bySource];
            return (
              <button
                key={key}
                onClick={() => setSourceFilter(sourceFilter === key ? 'all' : key)}
                className={cn(
                  'p-4 bg-white rounded-xl shadow-sm flex items-center gap-3 transition-all border-2',
                  sourceFilter === key ? `border-${config.color}-500` : 'border-transparent hover:border-gray-200'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg',
                  `bg-${config.color}-100`
                )}>
                  <Icon className={cn('w-5 h-5', `text-${config.color}-600`)} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-500">{config.label}</p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'tools' ? 'Rechercher par email ou nom...' : 'Rechercher par telephone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5167fc]"
          />
        </div>

        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'pending', label: 'A contacter' },
            { key: 'converted', label: 'Convertis' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={cn(
                'px-4 py-2 rounded-xl font-medium transition-colors',
                filter === f.key
                  ? 'bg-[#5167fc] text-white'
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
        {activeTab === 'tools' ? (
          // Tool Leads List
          filteredToolLeads.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredToolLeads.map((lead) => {
                const sourceConfig = SOURCE_CONFIG[lead.source];
                const Icon = sourceConfig.icon;
                return (
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
                        <Mail className={cn(
                          'w-5 h-5',
                          lead.converted ? 'text-emerald-600' : 'text-indigo-600'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-lg">
                          {lead.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            `bg-${sourceConfig.color}-100 text-${sourceConfig.color}-700`
                          )}>
                            <Icon className="w-3 h-3" />
                            {sourceConfig.label}
                          </span>
                          {lead.business_name && (
                            <span className="text-sm text-gray-600">
                              {lead.business_name}
                            </span>
                          )}
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </span>
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
                            href={`mailto:${lead.email}`}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </a>
                          <button
                            onClick={() => markToolAsConverted(lead.id)}
                            className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-xl hover:bg-emerald-200 transition-colors"
                          >
                            Converti
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteToolLead(lead.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Wrench className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucun lead outils</p>
              <p className="text-sm text-gray-400 mt-1">
                Les visiteurs qui utilisent les outils gratuits apparaitront ici
              </p>
            </div>
          )
        ) : (
          // Demo Leads List
          filteredDemoLeads.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredDemoLeads.map((lead) => (
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
                          onClick={() => markDemoAsConverted(lead.id)}
                          className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-xl hover:bg-emerald-200 transition-colors"
                        >
                          Converti
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteDemoLead(lead.id)}
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
              <p className="text-lg font-medium">Aucun lead demo</p>
              <p className="text-sm text-gray-400 mt-1">
                Les visiteurs qui testent la demo apparaitront ici
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
