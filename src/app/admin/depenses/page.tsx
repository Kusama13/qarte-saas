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
  Settings,
  Pencil,
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

interface FixedCost {
  id: string;
  name: string;
  category: Category;
  monthly_amount: number;
  is_active: boolean;
  created_at: string;
}

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
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    category: 'autre' as Category,
    amount: '',
    month: '2026-01',
    is_recurring: false,
  });

  // Fixed cost modal
  const [fixedCostModalOpen, setFixedCostModalOpen] = useState(false);
  const [savingFixedCost, setSavingFixedCost] = useState(false);
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);
  const [fixedCostForm, setFixedCostForm] = useState({
    name: '',
    category: 'infra' as Category,
    monthly_amount: '',
  });

  // Generate 12 months starting from January 2026
  const months = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(2026, i, 1);
      result.push(date.toISOString().slice(0, 7));
    }
    return result;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [{ data: fixedData }, { data: expensesData }] = await Promise.all([
        supabase.from('admin_fixed_costs').select('*').eq('is_active', true).order('name'),
        supabase.from('admin_expenses').select('*').order('month', { ascending: false }),
      ]);

      setFixedCosts(fixedData || []);
      setExpenses(expensesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle expense submission
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.name || !expenseForm.amount) return;

    setSavingExpense(true);
    try {
      const { error } = await supabase.from('admin_expenses').insert({
        name: expenseForm.name,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        month: expenseForm.month,
        is_recurring: expenseForm.is_recurring,
      });

      if (error) throw error;

      setExpenseModalOpen(false);
      setExpenseForm({
        name: '',
        category: 'autre',
        amount: '',
        month: '2026-01',
        is_recurring: false,
      });
      fetchData();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setSavingExpense(false);
    }
  };

  // Handle fixed cost submission
  const handleFixedCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedCostForm.name || !fixedCostForm.monthly_amount) return;

    setSavingFixedCost(true);
    try {
      if (editingFixedCost) {
        // Update existing
        const { error } = await supabase
          .from('admin_fixed_costs')
          .update({
            name: fixedCostForm.name,
            category: fixedCostForm.category,
            monthly_amount: parseFloat(fixedCostForm.monthly_amount),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFixedCost.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from('admin_fixed_costs').insert({
          name: fixedCostForm.name,
          category: fixedCostForm.category,
          monthly_amount: parseFloat(fixedCostForm.monthly_amount),
          is_active: true,
        });

        if (error) throw error;
      }

      closeFixedCostModal();
      fetchData();
    } catch (error) {
      console.error('Error saving fixed cost:', error);
    } finally {
      setSavingFixedCost(false);
    }
  };

  const openFixedCostModal = (cost?: FixedCost) => {
    if (cost) {
      setEditingFixedCost(cost);
      setFixedCostForm({
        name: cost.name,
        category: cost.category,
        monthly_amount: cost.monthly_amount.toString(),
      });
    } else {
      setEditingFixedCost(null);
      setFixedCostForm({
        name: '',
        category: 'infra',
        monthly_amount: '',
      });
    }
    setFixedCostModalOpen(true);
  };

  const closeFixedCostModal = () => {
    setFixedCostModalOpen(false);
    setEditingFixedCost(null);
    setFixedCostForm({
      name: '',
      category: 'infra',
      monthly_amount: '',
    });
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await supabase.from('admin_expenses').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const deleteFixedCost = async (id: string) => {
    if (!confirm('Supprimer ce coût fixe ?')) return;
    try {
      await supabase.from('admin_fixed_costs').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting fixed cost:', error);
    }
  };

  // Build the monthly data table
  const tableData = useMemo(() => {
    const rows: {
      name: string;
      category: Category;
      isFixed: boolean;
      fixedCostId?: string;
      expenseId?: string;
      values: Record<string, number>;
      total: number;
    }[] = [];

    // Add fixed costs (repeat for each month)
    fixedCosts.forEach((cost) => {
      const values: Record<string, number> = {};
      months.forEach((month) => {
        values[month] = cost.monthly_amount;
      });
      rows.push({
        name: cost.name,
        category: cost.category,
        isFixed: true,
        fixedCostId: cost.id,
        values,
        total: cost.monthly_amount * months.length,
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
  }, [fixedCosts, expenses, months]);

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
        <div className="flex gap-2">
          <Button
            onClick={() => openFixedCostModal()}
            variant="outline"
            className="border-gray-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Coût fixe
          </Button>
          <Button
            onClick={() => setExpenseModalOpen(true)}
            className="bg-[#5167fc] hover:bg-[#4154d4] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dépense
          </Button>
        </div>
      </div>

      {/* Fixed Costs Section */}
      {fixedCosts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              Coûts fixes mensuels
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {fixedCosts.map((cost) => {
              const catConfig = CATEGORIES[cost.category];
              return (
                <div key={cost.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded-full", catConfig.color)}>
                      {catConfig.label}
                    </span>
                    <span className="font-medium text-gray-900">{cost.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{cost.monthly_amount}€/mois</span>
                    <button
                      onClick={() => openFixedCostModal(cost)}
                      className="p-1.5 text-gray-400 hover:text-[#5167fc] hover:bg-[#5167fc]/10 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFixedCost(cost.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                    Aucune dépense. Ajoutez des coûts fixes ou des dépenses ponctuelles.
                  </td>
                </tr>
              ) : (
                tableData.map((row, idx) => {
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
                })
              )}
            </tbody>

            {tableData.length > 0 && (
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
            )}
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Ajouter une dépense ponctuelle"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <Input
            label="Nom de la dépense"
            placeholder="Ex: Freelance design, Flyers..."
            value={expenseForm.name}
            onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as Category })}
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
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
            <input
              type="month"
              value={expenseForm.month}
              onChange={(e) => setExpenseForm({ ...expenseForm, month: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5167fc]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={savingExpense || !expenseForm.name || !expenseForm.amount}
              className="flex-1 bg-[#5167fc] hover:bg-[#4154d4] text-white"
            >
              {savingExpense ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Fixed Cost Modal */}
      <Modal
        isOpen={fixedCostModalOpen}
        onClose={closeFixedCostModal}
        title={editingFixedCost ? "Modifier le coût fixe" : "Ajouter un coût fixe"}
      >
        <form onSubmit={handleFixedCostSubmit} className="space-y-4">
          <Input
            label="Nom"
            placeholder="Ex: Vercel, Supabase, Domaine..."
            value={fixedCostForm.name}
            onChange={(e) => setFixedCostForm({ ...fixedCostForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={fixedCostForm.category}
                onChange={(e) => setFixedCostForm({ ...fixedCostForm, category: e.target.value as Category })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5167fc]"
              >
                {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Montant mensuel (€)"
              type="number"
              placeholder="0"
              value={fixedCostForm.monthly_amount}
              onChange={(e) => setFixedCostForm({ ...fixedCostForm, monthly_amount: e.target.value })}
              required
            />
          </div>

          <p className="text-xs text-gray-500">
            Ce montant sera appliqué automatiquement à chaque mois de l'année.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeFixedCostModal}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={savingFixedCost || !fixedCostForm.name || !fixedCostForm.monthly_amount}
              className="flex-1 bg-[#5167fc] hover:bg-[#4154d4] text-white"
            >
              {savingFixedCost ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : editingFixedCost ? (
                <Pencil className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {editingFixedCost ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
