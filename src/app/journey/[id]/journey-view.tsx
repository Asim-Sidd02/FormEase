"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  BellPlus,
  Bell,
  Check,
  ChevronRight,
  CloudOff,
  Hourglass,
  LifeBuoy,
  MoreHorizontal,
  Pencil,
  PartyPopper,
  PlayCircle,
  Printer,
  Route,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TriangleAlert,
  Download,
  History,
  Link2,
  ClipboardList,
} from "lucide-react";
import { useHydrated, useProcess } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { answerLabel, buildJourneyView, JOURNEY_STATUS_META, stepState, visibleQuestions } from "@/lib/engine";
import { formatDate, relativeTime, REMINDER_KIND_LABEL } from "@/lib/reminders";
import { IconTile } from "@/components/icon";
import { Badge, Button, buttonClass, Card, cn, Dialog, EmptyState, inputClass, ProgressRing, Skeleton, Tabs } from "@/components/ui";
import { OfficialLinkCard } from "@/components/official-link";
import { AssistantDrawer } from "@/components/assistant";
import { ReminderDialog } from "@/components/reminder-dialog";
import { ReportIssueButton } from "@/components/report-issue";
import { toast } from "@/components/toast";
import { StepItem } from "./step-item";
import { Checklist } from "./checklist";
import { StatusHelp } from "./status-help";
import type { Journey, Process } from "@/lib/types";

type Tab = "roadmap" | "checklist" | "links" | "activity";

export function JourneyView({ id, isNew }: { id: string; isNew: boolean }) {
  const hydrated = useHydrated();
  const journey = useStore((s) => s.journeys.find((j) => j.id === id));
  const process = useProcess(journey?.processSlug ?? "");

  if (!hydrated) {
    return (
      <div className="container-page space-y-4 pt-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!journey || !process) {
    return (
      <div className="container-page pt-16">
        <EmptyState
          icon={<Route className="size-6" />}
          title="We couldn't find that journey"
          desc="It may have been deleted, or it was created on another device while signed out."
          action={
            <Link href="/journeys" className={buttonClass()}>
              Go to my journeys
            </Link>
          }
        />
      </div>
    );
  }
  return <Dashboard journey={journey} process={process} isNew={isNew} />;
}

function Dashboard({ journey, process: p, isNew }: { journey: Journey; process: Process; isNew: boolean }) {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const allReminders = useStore((s) => s.reminders);
  const reminders = allReminders.filter((r) => r.journeyId === journey.id);
  const setStepStatus = useStore((s) => s.setStepStatus);
  const [tab, setTab] = useState<Tab>("roadmap");
  const [assistant, setAssistant] = useState(false);
  const [statusHelp, setStatusHelp] = useState(false);
  const [reminder, setReminder] = useState<{ open: boolean; stepId?: string }>({ open: false });
  const [rename, setRename] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menu, setMenu] = useState(false);
  const welcomed = useRef(false);

  const v = buildJourneyView(p, journey);
  const meta = JOURNEY_STATUS_META[v.status];
  const next = v.nextStep;
  const questions = visibleQuestions(p, journey.answers);
  const outdated = journey.contentVersion !== p.version;

  useEffect(() => {
    if (isNew && !welcomed.current) {
      welcomed.current = true;
      toast("Your roadmap is ready", { desc: `${v.steps.length} steps and ${v.documents.length} documents, tailored to your answers.` });
      router.replace(`/journey/${journey.id}`, { scroll: false });
    }
  }, [isNew, journey.id, router, v.steps.length, v.documents.length]);

  const markNext = (status: "completed" | "in_progress" | "pending") => {
    if (!next) return;
    setStepStatus(journey.id, next.id, status, next.title);
    if (status === "completed") toast(`Nice work — “${next.title}” done`, { desc: v.doneCount + 1 === v.steps.length ? "That was the last step!" : "Here's what's next." });
  };

  return (
    <div className="container-page pb-10 pt-6 sm:pt-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
        <Link href="/journeys" className="hover:text-fg">My journeys</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate font-semibold text-fg" aria-current="page">{journey.title}</span>
      </nav>

      {!journey.saved && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4 sm:flex-row sm:items-center">
          <CloudOff className="size-5 shrink-0 text-warning" aria-hidden />
          <p className="flex-1 text-sm">
            <strong>You&apos;re using guest mode.</strong> This journey lives only in this browser. Sign in to save it to your account and get email reminders.
          </p>
          <Link href={`/sign-in?next=/journey/${journey.id}`} className={buttonClass("primary", "sm")}>
            Sign in to save
          </Link>
        </div>
      )}

      {/* ------------------------------ Header ------------------------------ */}
      <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
        <IconTile name={p.icon} category={p.category} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold leading-tight">{journey.title}</h1>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            <Link href={`/process/${p.slug}`} className="font-semibold text-brand hover:underline">{p.title}</Link> · started {formatDate(journey.createdAt)} · updated {relativeTime(journey.updatedAt)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {questions.map((q) =>
              journey.answers[q.id] ? (
                <span key={q.id} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted" title={q.question}>
                  {answerLabel(q, journey.answers[q.id])}
                </span>
              ) : null,
            )}
            <Link href={`/process/${p.slug}/start?journey=${journey.id}`} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand-soft">
              <SlidersHorizontal className="size-3.5" /> Edit answers
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" onClick={() => setAssistant(true)}>
            <Sparkles className="size-4 text-brand" /> Ask
          </Button>
          <div className="relative">
            <Button variant="outline" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu" aria-label="More actions" className="px-2.5">
              <MoreHorizontal className="size-5" />
            </Button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} aria-hidden />
                <div role="menu" className="absolute right-0 top-12 z-20 w-56 animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
                  <MenuBtn icon={<Pencil className="size-4" />} onClick={() => { setRename(true); setMenu(false); }}>Rename</MenuBtn>
                  <MenuBtn icon={<Printer className="size-4" />} onClick={() => { setMenu(false); setTimeout(() => window.print(), 50); }}>Print summary</MenuBtn>
                  <MenuBtn icon={<Download className="size-4" />} onClick={() => { exportJourney(journey, p); setMenu(false); }}>Export as text</MenuBtn>
                  <MenuBtn icon={<Archive className="size-4" />} onClick={() => { useStore.getState().archiveJourney(journey.id, !journey.archived); toast(journey.archived ? "Restored" : "Archived"); setMenu(false); }}>
                    {journey.archived ? "Restore from archive" : "Archive"}
                  </MenuBtn>
                  <div className="my-1 h-px bg-line" />
                  <MenuBtn danger icon={<Trash2 className="size-4" />} onClick={() => { setConfirmDelete(true); setMenu(false); }}>Delete journey</MenuBtn>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {outdated && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-info/25 bg-info-soft p-4 text-sm">
          <History className="mt-0.5 size-5 shrink-0 text-info" />
          <p>
            <strong>This guide has been updated since you started</strong> (v{journey.contentVersion} → v{p.version}). Your roadmap already reflects the latest version — please re-check your checklist.
          </p>
        </div>
      )}

      {journey.problem && (
        <div role="alert" className="mt-5 flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center">
          <TriangleAlert className="size-5 shrink-0 text-danger" />
          <div className="flex-1 text-sm">
            <p className="font-bold">Application {journey.problem.status.replace("_", " ")} — needs attention</p>
            {journey.problem.message && <p className="mt-0.5 line-clamp-2 text-muted">“{journey.problem.message}”</p>}
          </div>
          <Button size="sm" variant="outline" onClick={() => setStatusHelp(true)}>
            <LifeBuoy className="size-4" /> Get help
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {/* ------------------------------ Next step hero ------------------------------ */}
          {v.status === "completed" ? (
            <Card className="relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand/10 blur-2xl" aria-hidden />
              <PartyPopper className="size-9 text-accent" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-semibold">All steps complete!</h2>
              <p className="mt-1.5 max-w-lg text-muted">
                You worked through all {v.steps.length} steps. Keep your reference numbers and the documents you received somewhere safe.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => { useStore.getState().archiveJourney(journey.id, true); toast("Journey archived"); router.push("/journeys"); }}>
                  <Archive className="size-4" /> Archive journey
                </Button>
                <Link href="/search" className={buttonClass("ghost")}>Start another process</Link>
              </div>
            </Card>
          ) : next ? (
            <section aria-labelledby="next-h" className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand-soft via-surface to-surface p-5 shadow-lift sm:p-7">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-brand/10 blur-3xl" aria-hidden />
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-brand" />
                </span>
                {stepState(journey, next.id) === "attention" ? "Needs your attention" : stepState(journey, next.id) === "pending" ? "Waiting on the office" : "Your next step"} · Step {v.steps.indexOf(next) + 1} of {v.steps.length}
              </p>
              <h2 id="next-h" className="mt-2 font-display text-2xl font-semibold sm:text-[28px]">{next.title}</h2>
              <p className="mt-2 max-w-2xl text-[15px] text-muted">{next.action}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => markNext("completed")}>
                  <Check className="size-4" strokeWidth={3} /> Mark as done
                </Button>
                {stepState(journey, next.id) !== "in_progress" && stepState(journey, next.id) !== "pending" && (
                  <Button variant="outline" onClick={() => markNext("in_progress")}>
                    <PlayCircle className="size-4" /> I&apos;ve started
                  </Button>
                )}
                {next.mode !== "online" && stepState(journey, next.id) !== "pending" && (
                  <Button variant="outline" onClick={() => markNext("pending")}>
                    <Hourglass className="size-4" /> Waiting on office
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setReminder({ open: true, stepId: next.id })}>
                  <BellPlus className="size-4" /> Remind me
                </Button>
              </div>
              {next.linkIds?.[0] && (
                <div className="mt-5 max-w-md">
                  {(() => {
                    const l = p.links.find((x) => x.id === next.linkIds![0]);
                    return l ? <OfficialLinkCard link={l} compact /> : null;
                  })()}
                </div>
              )}
            </section>
          ) : null}

          {/* ------------------------------ Tabs ------------------------------ */}
          <Tabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "roadmap", label: <><Route className="size-4" /> Roadmap</>, count: v.steps.length },
              { value: "checklist", label: <><ClipboardList className="size-4" /> Checklist</>, count: v.docsTotal },
              { value: "links", label: <><Link2 className="size-4" /> Official links</> },
              { value: "activity", label: <><History className="size-4" /> Activity</> },
            ]}
          />

          <div role="tabpanel" className="animate-fade-in">
            {tab === "roadmap" && (
              <ol aria-label="Roadmap steps">
                {v.steps.map((s, i) => (
                  <StepItem
                    key={s.id}
                    step={s}
                    n={i + 1}
                    journey={journey}
                    docs={v.documents}
                    links={p.links}
                    isNext={next?.id === s.id}
                    isLast={i === v.steps.length - 1}
                    blockedBy={v.blockedBy(s)}
                    onReminder={(stepId) => setReminder({ open: true, stepId })}
                    defaultOpen={next?.id === s.id}
                  />
                ))}
              </ol>
            )}
            {tab === "checklist" && <Checklist journey={journey} docs={v.documents} steps={v.steps} />}
            {tab === "links" && (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  {p.links.map((l) => (
                    <OfficialLinkCard key={l.id} link={l} />
                  ))}
                </div>
                <p className="text-xs text-muted">Only use these official sites to apply, pay or track. FormEase never takes payments or applications.</p>
              </div>
            )}
            {tab === "activity" && (
              <Card className="p-5">
                <ol className="relative space-y-4 border-l border-line pl-5">
                  {[...journey.history].reverse().map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-brand" aria-hidden />
                      <p className="text-sm font-medium">{e.text}</p>
                      <p className="text-xs text-muted">{new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>
        </div>

        {/* ------------------------------ Sidebar ------------------------------ */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing value={v.progress} size={76} label={`${v.progress}% of steps complete`} />
              <div>
                <p className="text-sm text-muted">Overall progress</p>
                <p className="font-bold">
                  {v.doneCount} of {v.steps.length} steps
                </p>
                <p className="text-sm text-muted">
                  {v.docsReady} of {v.docsTotal} documents ready
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-1" aria-hidden>
              {v.steps.map((s) => {
                const st = stepState(journey, s.id);
                return (
                  <span
                    key={s.id}
                    title={s.title}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      st === "completed" ? "bg-brand" : st === "skipped" ? "bg-line-strong" : st === "attention" ? "bg-danger" : st === "pending" ? "bg-warning" : st === "in_progress" ? "bg-info" : "bg-surface-3",
                    )}
                  />
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold">
                <Bell className="size-4 text-brand" /> Reminders
              </h2>
              <button onClick={() => setReminder({ open: true })} className="rounded-lg p-1.5 text-brand hover:bg-brand-soft" aria-label="Add reminder">
                <BellPlus className="size-4" />
              </button>
            </div>
            {reminders.length ? (
              <ul className="mt-3 space-y-2">
                {reminders.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-surface-2/70 p-2.5">
                    <div className="grid w-10 shrink-0 place-items-center rounded-lg bg-surface py-1 text-center shadow-soft">
                      <span className="text-[10px] font-bold uppercase text-danger">{new Date(`${r.date}T00:00`).toLocaleDateString("en-IN", { month: "short" })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(`${r.date}T00:00`).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-semibold", !r.enabled && "text-subtle line-through")}>{r.title}</p>
                      <p className="text-xs text-muted">{REMINDER_KIND_LABEL[r.kind]} · {r.time}</p>
                    </div>
                  </li>
                ))}
                <li>
                  <Link href="/reminders" className="text-xs font-semibold text-brand hover:underline">Manage all reminders →</Link>
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Add a reminder for an appointment or a step you&apos;re waiting on.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <LifeBuoy className="size-4 text-brand" /> Application status help
            </h2>
            <p className="mt-1.5 text-sm text-muted">Returned, rejected or stuck? Understand what it may mean and what to do next.</p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setStatusHelp(true)}>
              Get status help
            </Button>
          </Card>

          <button onClick={() => setAssistant(true)} className="group w-full rounded-2xl bg-[#0f1f1a] p-5 text-left text-white shadow-lift transition hover:brightness-110 dark:bg-brand-soft">
            <Sparkles className="size-5 text-[#f4b357]" />
            <p className="mt-2 font-bold">What happens next?</p>
            <p className="mt-1 text-sm text-[#a9b8b1] dark:text-muted">Ask about this journey — answers use your answers and progress.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#6dd6b5] dark:text-brand">
              Ask the assistant <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </button>

          <div className="px-1 text-center">
            <ReportIssueButton processSlug={p.slug} targets={["General", ...v.steps.map((s) => `Step: ${s.title}`)]} />
          </div>
        </aside>
      </div>

      <AssistantDrawer open={assistant} onClose={() => setAssistant(false)} process={p} journey={journey} />
      <StatusHelp open={statusHelp} onClose={() => setStatusHelp(false)} process={p} journey={journey} />
      <ReminderDialog
        open={reminder.open}
        onClose={() => setReminder({ open: false })}
        journeyId={journey.id}
        steps={v.steps.map((s) => ({ id: s.id, title: s.title }))}
        defaultStepId={reminder.stepId}
        defaultKind={reminder.stepId ? (v.steps.find((s) => s.id === reminder.stepId)?.mode === "online" ? "step" : "appointment") : "continue"}
      />
      <RenameDialog open={rename} onClose={() => setRename(false)} journey={journey} />
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="Delete this journey?"
        description="Your progress, notes and reminders for this journey will be permanently removed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                useStore.getState().deleteJourney(journey.id);
                toast("Journey deleted", { tone: "info" });
                router.push("/journeys");
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function MenuBtn({ icon, children, onClick, danger }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button role="menuitem" onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-2", danger ? "text-danger" : "text-muted hover:text-fg")}>
      {icon}
      {children}
    </button>
  );
}

function RenameDialog({ open, onClose, journey }: { open: boolean; onClose: () => void; journey: Journey }) {
  const [title, setTitle] = useState(journey.title);
  useEffect(() => setTitle(journey.title), [open, journey.title]);
  return (
    <Dialog open={open} onClose={onClose} size="sm" title="Rename journey">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) useStore.getState().renameJourney(journey.id, title.trim());
          onClose();
        }}
        className="space-y-4"
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} aria-label="Journey name" maxLength={60} placeholder="e.g. Mum's passport" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Dialog>
  );
}

function exportJourney(j: Journey, p: Process) {
  const v = buildJourneyView(p, j);
  const lines = [
    `FormEase — ${j.title}`,
    `${p.title} (guide v${p.version}, verified ${p.lastVerified})`,
    `Progress: ${v.progress}% · exported ${new Date().toLocaleString("en-IN")}`,
    "",
    "STEPS",
    ...v.steps.map((s, i) => `${i + 1}. [${stepState(j, s.id).replace("_", " ")}] ${s.title}${j.steps[s.id]?.note ? `\n   Note: ${j.steps[s.id].note}` : ""}`),
    "",
    "DOCUMENTS",
    ...v.documents.map((d) => `[${j.checklist[d.id]?.ready ? "x" : " "}] ${d.name} (${d.kind})`),
    ...j.customItems.map((c) => `[${c.ready ? "x" : " "}] ${c.label} (your item)`),
    "",
    "OFFICIAL LINKS",
    ...p.links.map((l) => `- ${l.label}: ${l.url}`),
    "",
    "FormEase is independent guidance, not a government service. Official portals are authoritative.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${j.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-formease.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Summary downloaded");
}
