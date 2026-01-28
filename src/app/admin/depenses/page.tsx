'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Wallet,
  Server,
  Megaphone,
  Wrench,
  MoreHorizontal,
  Calendar,
  X,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';
import { Button, Input, Modal } from '@/components/ui';

// Categories
const CATEGORIES = {
  infra: { label: 'Infrastructure', icon: Server, color: 'bg-blue-100 text-blue-700' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'bg-purple-100 text-purple-700' },
  fb_ads: { label: 'FB Ads', icon: Megaphone, color: 'bg-indigo-100 text-indigo-700' },
  outils: { label: 'Outils', icon: Wrench, color: 'bg-amber-100 text-amber-700' },
  autre: { label: 'Autre', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
};

type Category = keyof typeof CATEGORIES;

// Fixed costs (SaaS subscriptions)
const FIXED_COSTS: { name: string; category: Category; monthly: number }[] = [
  { name: 'Vercel', category: 'infra', monthly: 0 },
  { name: 'Supabase', category: 'infra', monthly: 0 },
  { name: 'Domaine (getqarte.com)', category: 'infra', monthly: 1 },
  { name: 'Resend (emails)', category: 'outils', monthly: 0 },
  // Add more fixed costs here as needed
];

interface Expense {
  id: string;
  name: string;
  category: Category;
  amount: number;
  month: string; // YYYY-MM format
  is_recurring: boolean;
  created_at: string;
}

export default function DepensesPage() {
  const supabase = createClientComponentClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'autre' as Category,
    amount: '',
    month: new Date().toISOString().slice(0, 7),
    is_recurring: false,
  });

  // Generate months for the last 6 months + current
  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(date.toISOString().slice(0, 7));
    }
    return result;
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_expenses')
        .select('*')
        .order('month', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('admin_expenses').insert({
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        month: formData.month,
        is_recurring: formData.is_recurring,
      });

      if (error) throw error;

      setModalOpen(false);
      setFormData({
        name: '',
        category: 'autre',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
        is_recurring: false,
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await supabase.from('admin_expenses').delete().eq('id', id);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Build the monthly data table
  const tableData = useMemo(() => {
    const rows: {
      name: string;
      category: Category;
      isFixed: boolean;
      expenseId?: string;
      values: Record<string, number>;
      total: number;
    }[] = [];

    // Add fixed costs (repeat for each month)
    FIXED_COSTS.forEach((cost) => {
      const values: Record<string, number> = {};
      months.forEach((month) => {
        values[month] = cost.monthly;
      });
      rows.push({
        name: cost.name,
        category: cost.category,
        isFixed: true,
        values,
        total: cost.monthly * months.length,
      });
    });

    // Add manual expenses
    expenses.forEach((expense) => {
      // Check if this expense already has a row (for recurring)
      const existingRow = rows.find(
        (r) => r.name === expense.name && !r.isFixed
      );

      if (existingRow) {
        existingRow.values[expense.month] =
          (existingRow.values[expense.month] || 0) + expense.amount;
        existingRow.total += expense.amount;
      } else {
        const values: Record<string, number> = {};
        months.forEach((month) => {
          values[month] = 0;
        });
        values[expense.month] = expense.amount;

        rows.push({
          name: expense.name,
          category: expense.category,
          isFixed: false,
          expenseId: expense.id,
          values,
          total: expense.amount,
        });
      }
    });

    return rows;
  }, [expenses, months]);

  // Calculate totals by category and month
  const totals = useMemo(() => {
    const byCategory: Record<Category, Record<string, number>> = {
      infra: {},
      marketing: {},
      fb_ads: {},
      outils: {},
      autre: {},
    };

    const byMonth: Record<string, number> = {};
    months.forEach((month) => {
      byMonth[month] = 0;
    });

    let grandTotal = 0;

    tableData.forEach((row) => {
      if (!byCategory[row.category]) {
        byCategory[row.category] = {};
      }

      months.forEach((month) => {
        const value = row.values[month] || 0;
        byCategory[row.category][month] = (byCategory[row.category][month] || 0) + value;
        byMonth[month] += value;
        grandTotal += value;
      });
    });

    // Calculate category totals
    const categoryTotals: Record<Category, number> = {
      infra: 0,
      marketing: 0,
      fb_ads: 0,
      outils: 0,
      autre: 0,
    };

    Object.entries(byCategory).forEach(([cat, monthValues]) => {
      categoryTotals[cat as Category] = Object.values(monthValues).reduce((a, b) => a + b, 0);
    });

    return { byCategory, byMonth, categoryTotals, grandTotal };
  }, [tableData, months]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Dépenses</h1>
          <p className="mt-1 text-gray-600">Suivi des coûts mensuels</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#5167fc] hover:bg-[#4154d4] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => {
          const Icon = cat.icon;
          return (
            <div key={key} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", cat.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{totals.categoryTotals[key]}€</p>
                  <p className="text-xs text-gray-500">{cat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="bg-gradient-to-r from-[#5167fc] to-[#7c3aed] p-6 rounded-xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/70 text-sm">Total sur {months.length} mois</p>
              <p className="text-3xl font-bold">{totals.grandTotal}€</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Moyenne mensuelle</p>
            <p className="text-2xl font-bold">{Math.round(totals.grandTotal / months.length)}€</p>
          </div>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5167fc]" />
            Détail par mois
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Dépense</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                {months.map((month) => (
                  <th key={month} className="text-center px-3 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {formatMonth(month)}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-medium text-gray-900 bg-gray-100">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableData.map((row, idx) => {
                const catConfig = CATEGORIES[row.category];
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.name}
                      {row.isFixed && (
                        <span className="ml-2 text-xs text-gray-400">(fixe)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", catConfig.color)}>
                        {catConfig.label}
                      </span>
                    </td>
                    {months.map((month) => (
                      <td key={month} className="text-center px-3 py-3 text-gray-600">
                        {row.values[month] > 0 ? `${row.values[month]}€` : '-'}
                      </td>
                    ))}
                    <td className="text-center px-4 py-3 font-semibold text-gray-900 bg-gray-50">
                      {row.total}€
                    </td>
                    <td className="px-2 py-3">
                      {!row.isFixed && row.expenseId && (
                        <button
                          onClick={() => deleteExpense(row.expenseId!)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Category Totals */}
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([cat, config]) => {
                if (totals.categoryTotals[cat] === 0) return null;
                return (
                  <tr key={cat} className="border-b border-gray-100">
                    <td colSpan={2} className="px-4 py-2 text-sm font-medium text-gray-600">
                      Total {config.label}
                    </td>
                    {months.map((month) => (
                      <td key={month} className="text-center px-3 py-2 text-sm text-gray-600">
                        {totals.byCategory[cat]?.[month] > 0 ? `${totals.byCategory[cat][month]}€` : '-'}
                      </td>
                    ))}
                    <td className="text-center px-4 py-2 font-semibold text-gray-700 bg-gray-100">
                      {totals.categoryTotals[cat]}€
                    </td>
                    <td></td>
                  </tr>
                );
              })}

              {/* Grand Total Row */}
              <tr className="bg-[#5167fc]/5">
                <td colSpan={2} className="px-4 py-3 text-sm font-bold text-[#5167fc]">
                  TOTAL GÉNÉRAL
                </td>
                {months.map((month) => (
                  <td key={month} className="text-center px-3 py-3 font-bold text-[#5167fc]">
                    {totals.byMonth[month]}€
                  </td>
                ))}
                <td className="text-center px-4 py-3 font-bold text-white bg-[#5167fc]">
                  {totals.grandTotal}€
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ajouter une dépense"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de la dépense"
            placeholder="Ex: Freelance design, Flyers..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5167fc]"
              >
                {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Montant (€)"
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
              <input
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5167fc]"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-4 h-4 text-[#5167fc] rounded focus:ring-[#5167fc]"
                />
                <span className="text-sm text-gray-700">Récurrent chaque mois</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.name || !formData.amount}
              className="flex-1 bg-[#5167fc] hover:bg-[#4154d4] text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
