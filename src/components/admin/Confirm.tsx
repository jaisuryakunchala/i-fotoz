"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

type Options = { title: string; message: React.ReactNode; confirmText?: string; danger?: boolean; typeToConfirm?: string };
type Ctx = (o: Options) => Promise<boolean>;

const ConfirmCtx = createContext<Ctx>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<Options | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<(v: boolean) => void>(undefined);

  const confirm = useCallback<Ctx>((o) => {
    setTyped("");
    setOpts(o);
    return new Promise<boolean>((res) => (resolver.current = res));
  }, []);

  const close = (v: boolean) => {
    resolver.current?.(v);
    setOpts(null);
  };
  const blocked = Boolean(opts?.typeToConfirm) && typed.trim() !== opts?.typeToConfirm;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(opts)}
        onClose={() => close(false)}
        title={opts?.title ?? ""}
        size="sm"
        footer={
          <>
            <button className="a-btn-secondary" onClick={() => close(false)}>Cancel</button>
            <button className={opts?.danger ? "a-btn-danger" : "a-btn-primary"} disabled={blocked} onClick={() => close(true)} autoFocus={!opts?.typeToConfirm}>
              {opts?.confirmText ?? "Confirm"}
            </button>
          </>
        }
      >
        <div className="flex gap-3">
          {opts?.danger && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>}
          <div className="text-sm leading-relaxed text-neutral-600">{opts?.message}</div>
        </div>
        {opts?.typeToConfirm && (
          <div className="mt-4">
            <label className="field-label">Type <span className="font-mono font-semibold text-neutral-900">{opts.typeToConfirm}</span> to confirm</label>
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </div>
        )}
      </Modal>
    </ConfirmCtx.Provider>
  );
}
