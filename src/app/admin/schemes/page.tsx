"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Eye, FilePlus2, Inbox, KeyRound, Landmark, Pencil, Trash2, X } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, inputClass, Tabs, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import type { Scheme, SchemeRequest } from "@/lib/schemes/types";

type Form = Record<"slug" | "name" | "ministry" | "summary" | "launchedOn" | "deadline" | "benefits" | "eligibility" | "documents" | "steps" | "fees" | "officialUrl" | "applyUrl" | "helpline", string>;
const EMPTY: Form = { slug: "", name: "", ministry: "", summary: "", launchedOn: "", deadline: "", benefits: "", eligibility: "", documents: "", steps: "", fees: "", officialUrl: "", applyUrl: "", helpline: "" };

const toForm = (s: Scheme): Form => ({
  slug: s.slug,
  name: s.name,
  ministry: s.ministry,
  summary: s.summary,
  launchedOn: s.launchedOn ?? "",
  deadline: s.deadline ?? "",
  benefits: s.benefits.join("\n"),
  eligibility: s.eligibility.join("\n"),
  documents: s.documents.join("\n"),
  steps: s.steps.join("\n"),
  fees: s.fees ?? "",
  officialUrl: s.officialUrl,
  applyUrl: s.applyUrl ?? "",
  helpline: s.helpline ?? "",
});

const tokenHeader = (): Record<string, string> => {
  try {
    const t = sessionStorage.getItem("fe-admin-token");
    return t ? { "x-formease-admin-token": t } : {};
  } catch {
    return {};
  }
};

type View = "schemes" | "requests";

export default function AdminSchemesPage() {
  const [view, setView] = useState<View>("schemes");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [requests, setRequests] = useState<SchemeRequest[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [needToken, setNeedToken] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const call = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...tokenHeader(), ...(init?.headers ?? {}) } });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) {
      setNeedToken(true);
      throw new Error("Admin token required");
    }
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
    return data;
  }, []);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([call("/api/schemes?drafts=1"), call("/api/schemes/requests")]);
      setSchemes((a as { schemes: Scheme[] }).schemes);
      setRequests((b as { requests: SchemeRequest[] }).requests);
    } catch {}
  }, [call]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (status: "draft" | "published") => {
    if (!form) return;
    setError("");
    setBusy(status);
    try {
      const { scheme } = (await call("/api/schemes", { method: "POST", body: JSON.stringify({ ...form, status }) })) as { scheme: Scheme };
      toast(status === "published" ? "Published" : "Saved as draft", { desc: scheme.name });
      setForm(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (s: Scheme) => {
    if (!confirm(`Delete “${s.name}”? This can't be undone.`)) return;
    setBusy(`del:${s.slug}`);
    try {
      await call(`/api/schemes/${s.slug}`, { method: "DELETE" });
      toast("Deleted", { desc: s.name });
      await load();
    } catch (e) {
      toast((e as Error).message, { tone: "warning" });
    } finally {
      setBusy(null);
    }
  };

  const setRequest = async (r: SchemeRequest, status: SchemeRequest["status"]) => {
    try {
      await call("/api/schemes/requests", { method: "PATCH", body: JSON.stringify({ id: r.id, status }) });
      await load();
    } catch (e) {
      toast((e as Error).message, { tone: "warning" });
    }
  };

  const openRequests = requests.filter((r) => r.status === "open").sort((a, b) => b.count - a.count);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold">
            <Landmark className="size-6 text-brand" /> Schemes
          </h1>
          <p className="mt-1 max-w-2xl text-muted">Write up government schemes from their official pages. Drafts stay private; published guides appear on /schemes.</p>
        </div>
        {!form && (
          <Button onClick={() => setForm({ ...EMPTY })}>
            <FilePlus2 className="size-4" /> New scheme
          </Button>
        )}
      </div>

      {needToken && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              sessionStorage.setItem("fe-admin-token", token);
            } catch {}
            setNeedToken(false);
            void load();
          }}
          className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3"
        >
          <KeyRound className="size-4 text-warning" />
          <span className="text-sm">This server requires the admin token.</span>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} className={cn(inputClass, "w-56 py-1.5")} aria-label="Admin token" />
          <Button size="sm" type="submit">Save</Button>
        </form>
      )}

      {form ? (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{form.slug ? "Edit scheme" : "New scheme"}</h2>
            <button onClick={() => setForm(null)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Close editor">
              <X className="size-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">Copy facts only from the official scheme page or notification. For lists, put one item per line.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Scheme name *" htmlFor="f-name">
              <input id="f-name" value={form.name} onChange={set("name")} className={inputClass} placeholder="PM Vishwakarma" />
            </Field>
            <Field label="Ministry / department" htmlFor="f-min">
              <input id="f-min" value={form.ministry} onChange={set("ministry")} className={inputClass} placeholder="Ministry of MSME" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Short summary" htmlFor="f-sum" hint="One or two plain sentences: what it is and who it's for.">
                <textarea id="f-sum" value={form.summary} onChange={set("summary")} rows={2} className={inputClass} />
              </Field>
            </div>
            <Field label="Official scheme page *" htmlFor="f-url" hint="Must be a .gov.in or .nic.in https link.">
              <input id="f-url" value={form.officialUrl} onChange={set("officialUrl")} className={inputClass} placeholder="https://pmvishwakarma.gov.in/" />
            </Field>
            <Field label="Direct application link" htmlFor="f-apply" hint="Optional — the page where people start applying.">
              <input id="f-apply" value={form.applyUrl} onChange={set("applyUrl")} className={inputClass} placeholder="https://…" />
            </Field>
            <Field label="Launched on" htmlFor="f-launch">
              <input id="f-launch" type="date" value={form.launchedOn} onChange={set("launchedOn")} className={inputClass} />
            </Field>
            <Field label="Last date to apply" htmlFor="f-dl" hint="Leave empty if there's no deadline.">
              <input id="f-dl" type="date" value={form.deadline} onChange={set("deadline")} className={inputClass} />
            </Field>
            <Field label="What you get (one per line)" htmlFor="f-ben">
              <textarea id="f-ben" value={form.benefits} onChange={set("benefits")} rows={5} className={inputClass} />
            </Field>
            <Field label="Who can apply (one per line)" htmlFor="f-elig">
              <textarea id="f-elig" value={form.eligibility} onChange={set("eligibility")} rows={5} className={inputClass} />
            </Field>
            <Field label="Documents needed (one per line)" htmlFor="f-docs">
              <textarea id="f-docs" value={form.documents} onChange={set("documents")} rows={5} className={inputClass} />
            </Field>
            <Field label="How to apply — steps in order (one per line)" htmlFor="f-steps">
              <textarea id="f-steps" value={form.steps} onChange={set("steps")} rows={5} className={inputClass} />
            </Field>
            <Field label="Fees" htmlFor="f-fees" hint="e.g. “No fee” or the official amount.">
              <input id="f-fees" value={form.fees} onChange={set("fees")} className={inputClass} />
            </Field>
            <Field label="Helpline" htmlFor="f-help">
              <input id="f-help" value={form.helpline} onChange={set("helpline")} className={inputClass} placeholder="18002677777" />
            </Field>
          </div>

          {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => save("published")} loading={busy === "published"} disabled={!!busy}>
              Publish
            </Button>
            <Button variant="outline" onClick={() => save("draft")} loading={busy === "draft"} disabled={!!busy}>
              Save as draft
            </Button>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Tabs<View>
            className="mt-6 w-fit max-w-full"
            value={view}
            onChange={setView}
            tabs={[
              { value: "schemes", label: "Guides", count: schemes.length },
              { value: "requests", label: "Visitor requests", count: openRequests.length },
            ]}
          />

          {view === "schemes" ? (
            <div className="mt-4 space-y-3">
              {schemes.length === 0 && <EmptyState icon={<Landmark className="size-6" />} title="No schemes yet" desc="Start with the most-requested ones from the Visitor requests tab." />}
              {schemes.map((s) => (
                <Card key={s.slug} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{s.name}</span>
                      <Badge tone={s.status === "published" ? "success" : "neutral"}>{s.status === "published" ? "Published" : "Draft"}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {s.ministry || "No ministry"} · updated {new Date(s.updatedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  {s.status === "published" && (
                    <Link href={`/schemes/${s.slug}`} target="_blank" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label={`View ${s.name}`}>
                      <Eye className="size-4" />
                    </Link>
                  )}
                  <button onClick={() => setForm(toForm(s))} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label={`Edit ${s.name}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(s)} disabled={busy === `del:${s.slug}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Delete ${s.name}`}>
                    <Trash2 className="size-4" />
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {openRequests.length === 0 && <EmptyState icon={<Inbox className="size-6" />} title="No open requests" desc="Visitors can ask for a scheme from the bottom of /schemes." />}
              {openRequests.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{r.name}</span>
                        <Badge tone={r.count > 2 ? "warning" : "neutral"}>
                          {r.count} request{r.count > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">Last asked {new Date(r.lastAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(`${r.name} site:gov.in`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                      Find official page <ArrowUpRight className="size-3.5" />
                    </a>
                    <Button
                      size="sm"
                      onClick={() => {
                        setForm({ ...EMPTY, name: r.name });
                        void setRequest(r, "done");
                      }}
                    >
                      Write guide
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRequest(r, "dismissed")}>
                      Dismiss
                    </Button>
                  </div>
                  {r.notes.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-muted">
                      {r.notes.map((n, i) => (
                        <li key={i}>“{n}”</li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
