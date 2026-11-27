"use client";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { cn, whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "./BrandIcons";

type Props = { eventTypes: string[]; whatsapp: string; studio: string; dark?: boolean };

export default function ContactForm({ eventTypes, whatsapp, studio, dark = false }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const submitting = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return; // prevents double submission
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.get("company")) return; // honeypot for bots
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    const payload = {
      name: v("name"),
      phone: v("phone"),
      email: v("email"),
      event_type: v("event_type"),
      event_date: v("event_date") || null,
      message: v("message"),
    };
    if (!payload.name) return setError("Please enter your name.");
    if (!payload.phone && !payload.email) return setError("Please share a phone number or email so we can reply.");
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return setError("Please enter a valid email address.");
    if (!payload.message) return setError("Please tell us a little about your shoot.");

    setError(null);
    submitting.current = true;
    setState("sending");
    try {
      if (isSupabaseConfigured) {
        const { error: err } = await getSupabaseBrowser().from("enquiries").insert(payload);
        if (err) throw err;
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setSummary(
        `Hello ${studio}, I'm ${payload.name}.${payload.event_type ? ` Enquiry: ${payload.event_type}.` : ""}${payload.event_date ? ` Date: ${payload.event_date}.` : ""} ${payload.message}`,
      );
      setState("sent");
      form.reset();
    } catch {
      setError("Sorry, your message could not be sent. Please try again or contact us on WhatsApp.");
      setState("idle");
    } finally {
      submitting.current = false;
    }
  }

  const input = cn(
    "w-full rounded-xl border px-4 py-3 text-[15px] transition focus:outline-none focus:ring-2",
    dark ? "border-white/15 bg-white/5 text-paper placeholder:text-paper/35 focus:border-brass-light focus:ring-brass/30" : "border-paper-line bg-white text-ink placeholder:text-stone-light focus:border-brass focus:ring-brass/20",
  );
  const label = cn("mb-1.5 block text-xs font-semibold uppercase tracking-widest", dark ? "text-paper/60" : "text-stone");

  if (state === "sent") {
    const wa = whatsappLink(whatsapp, summary);
    return (
      <div className={cn("flex flex-col items-start rounded-2xl p-8 animate-fadeUp", dark ? "bg-white/5" : "bg-white")}>
        <CheckCircle2 className="h-10 w-10 text-brass" strokeWidth={1.5} />
        <h3 className={cn("mt-4 font-display text-3xl", dark ? "text-paper" : "text-ink")}>Thank you — we&apos;ve received your enquiry.</h3>
        <p className={cn("mt-2 text-sm", dark ? "text-paper/60" : "text-stone")}>The studio will get back to you shortly. For a faster reply, you can also send the same message on WhatsApp.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]">
              <WhatsAppIcon className="h-4 w-4" /> Send on WhatsApp
            </a>
          )}
          <button onClick={() => setState("idle")} className={dark ? "btn-ghost-light" : "btn-outline"}>Send another enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div>
        <label htmlFor="cf-name" className={label}>Your name *</label>
        <input id="cf-name" name="name" required maxLength={120} autoComplete="name" className={input} placeholder="Full name" />
      </div>
      <div>
        <label htmlFor="cf-phone" className={label}>Phone</label>
        <input id="cf-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={input} placeholder="+91 ..." />
      </div>
      <div>
        <label htmlFor="cf-email" className={label}>Email</label>
        <input id="cf-email" name="email" type="email" maxLength={200} autoComplete="email" className={input} placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="cf-type" className={label}>Type of shoot</label>
        <select id="cf-type" name="event_type" className={cn(input, "appearance-none")} defaultValue="">
          <option value="">Select one</option>
          {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value="Other">Something else</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="cf-date" className={label}>Event date (optional)</label>
        <input id="cf-date" name="event_date" type="date" className={input} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="cf-msg" className={label}>Message *</label>
        <textarea id="cf-msg" name="message" required maxLength={3000} rows={4} className={cn(input, "resize-y")} placeholder="Tell us about your event, venue and what you have in mind." />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-500 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={state === "sending"} className={dark ? "btn-brass" : "btn-primary"}>
          {state === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send Enquiry</>}
        </button>
      </div>
    </form>
  );
}
