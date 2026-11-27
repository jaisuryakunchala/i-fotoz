"use client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
      status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "published" ? "bg-emerald-500" : "bg-amber-500")} />
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

export function ProgressBar({ value, error = false }: { value: number; error?: boolean }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-300", error ? "bg-red-500" : value >= 1 ? "bg-emerald-500" : "bg-brass")} style={{ width: `${Math.max(2, value * 100)}%` }} />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-20 text-sm text-neutral-500"><Spinner /> {label}</div>;
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="a-card flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500"><Icon className="h-6 w-6" /></span>
      <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4", disabled && "cursor-not-allowed opacity-60")}>
      <span>
        <span className="block text-sm font-medium text-neutral-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-neutral-500">{description}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-neutral-900" : "bg-neutral-300")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}
