export function formatDate(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00+05:30` : iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** Days left until a YYYY-MM-DD deadline (end of that day, India time). */
export function deadlineInfo(deadline?: string): { label: string; tone: "danger" | "warning" | "neutral"; closed: boolean } | null {
  if (!deadline) return null;
  const end = new Date(`${deadline}T23:59:59+05:30`).getTime();
  if (isNaN(end)) return null;
  const days = Math.ceil((end - Date.now()) / 86_400_000);
  if (days < 0) return { label: `Closed ${formatDate(deadline)}`, tone: "neutral", closed: true };
  if (days <= 7) return { label: days <= 1 ? "Last day to apply" : `${days} days left to apply`, tone: "danger", closed: false };
  return { label: `Apply by ${formatDate(deadline)}`, tone: days <= 30 ? "warning" : "neutral", closed: false };
}
