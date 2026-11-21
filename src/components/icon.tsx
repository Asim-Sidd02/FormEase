import {
  BadgeIndianRupee,
  Baby,
  Briefcase,
  Car,
  CreditCard,
  FileText,
  GraduationCap,
  HandHeart,
  Home,
  IdCard,
  IndianRupee,
  MapPin,
  Plane,
  RefreshCw,
  ScrollText,
  Users,
  Vote,
  type LucideProps,
} from "lucide-react";

const map = {
  BadgeIndianRupee,
  Baby,
  Briefcase,
  Car,
  CreditCard,
  GraduationCap,
  HandHeart,
  Home,
  IdCard,
  IndianRupee,
  MapPin,
  Plane,
  RefreshCw,
  ScrollText,
  Users,
  Vote,
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const C = map[name as keyof typeof map] ?? FileText;
  return <C aria-hidden {...props} />;
}

/** Tinted icon tile used for processes and categories. */
const hues: Record<string, string> = {
  travel: "bg-[#e5eefc] text-[#1f5fd6] dark:bg-[#14213b] dark:text-[#84aefc]",
  identity: "bg-brand-soft text-brand",
  certificates: "bg-[#f6ebfa] text-[#8a3ab9] dark:bg-[#2a1733] dark:text-[#d29bf2]",
  transport: "bg-accent-soft text-[#a65508] dark:text-accent",
  business: "bg-[#fbe8e6] text-[#b42318] dark:bg-[#36140f] dark:text-[#ff8a80]",
  default: "bg-surface-2 text-muted",
};

export function IconTile({ name, category, size = "md" }: { name: string; category?: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "size-9 rounded-xl [&>svg]:size-[18px]" : size === "lg" ? "size-14 rounded-2xl [&>svg]:size-7" : "size-11 rounded-xl [&>svg]:size-[22px]";
  return (
    <span className={`grid shrink-0 place-items-center ${s} ${hues[category ?? "default"] ?? hues.default}`}>
      <Icon name={name} />
    </span>
  );
}
