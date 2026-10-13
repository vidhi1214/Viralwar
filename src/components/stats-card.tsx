"use client";

export type StatsCardProps = {
  title: string;
  value: string | number;
  trend?: string;
  accent: string;
  className?: string;
};

export function StatsCard({
  title,
  value,
  trend,
  accent,
  className,
}: StatsCardProps) {
  const trendClass = trend?.includes("+") ? "text-orange-400" : "text-zinc-400";
  const trendIcon = trend?.includes("+") ? "📈" : "📉";

  return (
    <div
      className={className ?? "p-6 rounded-2xl border bg-card"}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-1">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        {trend && (
          <span className={trendClass}>
            {trendIcon} {trend}
          </span>
        )}
      </div>
    </div>
  );
}