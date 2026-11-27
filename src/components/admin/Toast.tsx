"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info";
type T = { id: number; kind: Kind; message: string };
type Ctx = (message: string, kind?: Kind) => void;

const ToastCtx = createContext<Ctx>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<T[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const push = useCallback<Ctx>((message, kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === "error" ? 8000 : 4000);
  }, []);
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
              className={cn("pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 text-sm shadow-lg animate-fadeUp",
                t.kind === "error" ? "border-red-200" : t.kind === "success" ? "border-emerald-200" : "border-neutral-200")}>
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", t.kind === "error" ? "text-red-600" : t.kind === "success" ? "text-emerald-600" : "text-neutral-500")} />
              <p className="flex-1 text-neutral-800">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-neutral-400 hover:text-neutral-700" aria-label="Dismiss"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
