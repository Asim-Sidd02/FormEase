import { Split, Wifi, WifiOff } from "lucide-react";
import type { DocKind, StepMode } from "./types";

export const MODE: Record<StepMode, { label: string; icon: typeof Wifi }> = {
  online: { label: "Online", icon: Wifi },
  offline: { label: "In person", icon: WifiOff },
  either: { label: "Online or in person", icon: Split },
};

export const DOC_KIND: Record<DocKind, { label: string; tone: "danger" | "info" | "neutral"; desc: string }> = {
  required: { label: "Required", tone: "danger", desc: "Everyone needs these." },
  conditional: { label: "Depends on your situation", tone: "info", desc: "Needed only in certain cases." },
  optional: { label: "Optional", tone: "neutral", desc: "Helpful but not mandatory." },
};
