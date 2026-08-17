import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}

export default function StatCard({ icon, label, value, hint }: StatCardProps) {
  return (
    <div className="glass-card animate-fade-in-up flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ink-50">{value}</p>
        <p className="mt-1 text-sm text-ink-300">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}
