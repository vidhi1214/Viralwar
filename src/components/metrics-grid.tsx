"use client";

export type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  accent: string;
};

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  accent,
}: MetricCardProps) => (
  <div className="p-4 rounded-lg border bg-card hover:bg-card_hover transition-colors">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-xl font-bold">{value}</p>
      </div>
      <span className="text-xs font-medium text-zinc-400">{subtitle}</span>
    </div>
  </div>
);

export const MetricsGrid = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
);