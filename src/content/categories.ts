import type { Category } from "@/lib/types";

export const categories: Category[] = [
  {
    slug: "identity",
    name: "Identity & documents",
    description: "Aadhaar, PAN and the core IDs everything else depends on.",
    icon: "IdCard",
    live: true,
  },
  {
    slug: "travel",
    name: "Travel & passport",
    description: "New passports, renewals and corrections.",
    icon: "Plane",
    live: true,
  },
  {
    slug: "certificates",
    name: "Certificates & records",
    description: "Birth, income, caste and domicile certificates.",
    icon: "ScrollText",
    live: true,
  },
  {
    slug: "transport",
    name: "Driving & transport",
    description: "Learner's and driving licences.",
    icon: "Car",
    live: true,
  },
  {
    slug: "business",
    name: "Business setup",
    description: "Registrations, licences and basic compliance.",
    icon: "Briefcase",
    live: true,
  },
  {
    slug: "education",
    name: "Education",
    description: "Marksheets, migration and student certificates.",
    icon: "GraduationCap",
    live: true,
  },
  {
    slug: "employment",
    name: "Employment & PF",
    description: "PF withdrawals, UAN and employment records.",
    icon: "BadgeIndianRupee",
    live: true,
  },
  {
    slug: "property",
    name: "Property & housing",
    description: "Rent agreements, mutation and property records.",
    icon: "Home",
    live: true,
  },
  {
    slug: "schemes",
    name: "Schemes & benefits",
    description: "Eligibility and applications for public schemes.",
    icon: "HandHeart",
    live: true,
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
