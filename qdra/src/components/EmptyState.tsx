import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card animate-fade-in-up flex flex-col items-center gap-3 rounded-3xl px-6 py-14 text-center">
      {icon && <div className="text-4xl text-gold-400">{icon}</div>}
      <h3 className="text-lg font-bold text-ink-50">{title}</h3>
      {description && <p className="max-w-md text-sm leading-7 text-ink-300">{description}</p>}
      {action}
    </div>
  );
}
