"use client";
import { useCallback, useEffect, useState } from "react";
import { Calendar, Mail, MailOpen, MessageSquare, Phone, Trash2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Enquiry } from "@/lib/types";
import { cn, formatDate, telLink, whatsappLink } from "@/lib/utils";
import { EmptyState, LoadingBlock, PageTitle } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/site/BrandIcons";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/Confirm";

export default function EnquiriesPage() {
  const db = getSupabaseBrowser();
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    const { data, error } = await db.from("enquiries").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) toast(error.message, "error");
    setRows((data as Enquiry[]) ?? []);
  }, [db, toast]);
  useEffect(() => { load(); }, [load]);

  async function setRead(e: Enquiry, is_read: boolean) {
    const { error } = await db.from("enquiries").update({ is_read }).eq("id", e.id);
    if (error) return toast(error.message, "error");
    setRows((l) => l?.map((x) => (x.id === e.id ? { ...x, is_read } : x)) ?? null);
  }

  async function remove(e: Enquiry) {
    if (!(await confirm({ title: "Delete enquiry?", message: `The enquiry from ${e.name} will be permanently deleted.`, confirmText: "Delete", danger: true }))) return;
    const { error } = await db.from("enquiries").delete().eq("id", e.id);
    if (error) return toast(error.message, "error");
    setRows((l) => l?.filter((x) => x.id !== e.id) ?? null);
    toast("Enquiry deleted.");
  }

  if (!rows) return <LoadingBlock />;
  const list = filter === "unread" ? rows.filter((r) => !r.is_read) : rows;
  const unread = rows.filter((r) => !r.is_read).length;

  return (
    <>
      <PageTitle title="Enquiries" description="Messages sent through the website contact form."
        actions={<div className="inline-flex rounded-lg bg-white p-1 ring-1 ring-neutral-200">
          {(["all", "unread"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", filter === f ? "bg-neutral-900 text-white" : "text-neutral-600")}>{f === "all" ? `All (${rows.length})` : `Unread (${unread})`}</button>)}
        </div>} />
      {!list.length ? (
        <EmptyState icon={MessageSquare} title={filter === "unread" ? "All caught up" : "No enquiries yet"} text="New messages from customers will appear here." />
      ) : (
        <ul className="space-y-3">
          {list.map((e) => {
            const wa = e.phone ? whatsappLink(e.phone, `Hello ${e.name}, thank you for contacting us about your ${e.event_type || "shoot"}.`) : "";
            return (
              <li key={e.id} className={cn("a-card p-4 sm:p-5", !e.is_read && "border-l-4 border-l-brass")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{e.name} {!e.is_read && <span className="ml-1 rounded-full bg-brass/10 px-2 py-0.5 text-[11px] font-semibold text-brass-dark">New</span>}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{formatDate(e.created_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}{e.event_type && ` · ${e.event_type}`}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => setRead(e, !e.is_read)}>{e.is_read ? <><Mail className="h-3.5 w-3.5" /> Mark unread</> : <><MailOpen className="h-3.5 w-3.5" /> Mark read</>}</button>
                    <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs text-red-600" onClick={() => remove(e)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{e.message}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {e.event_date && <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> {formatDate(e.event_date)}</span>}
                  {e.phone && <a href={telLink(e.phone)} className="a-btn-secondary !py-1.5 text-xs"><Phone className="h-3.5 w-3.5" /> {e.phone}</a>}
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="a-btn-secondary !py-1.5 text-xs"><WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" /> Reply on WhatsApp</a>}
                  {e.email && <a href={`mailto:${e.email}?subject=${encodeURIComponent("Your enquiry")}`} className="a-btn-secondary !py-1.5 text-xs"><Mail className="h-3.5 w-3.5" /> {e.email}</a>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
