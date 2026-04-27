import { ROLES, type Role } from '@/lib/customer-modal-styles';

interface SectionHeaderProps {
  role: Role;
  label: string;
  count?: number | null;
}

/**
 * En-tête de section uniforme dans les tabs du modal client.
 * Barre verticale colorée + label uppercase + count optionnel en pill.
 */
export function SectionHeader({ role, label, count }: SectionHeaderProps) {
  const r = ROLES[role];
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className={`w-1 h-3.5 rounded-full ${r.bar}`} />
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</p>
      {count != null && (
        <span className={`text-[10px] font-bold ${r.text} ${r.bg} px-1.5 py-0.5 rounded-full`}>
          {count}
        </span>
      )}
    </div>
  );
}
