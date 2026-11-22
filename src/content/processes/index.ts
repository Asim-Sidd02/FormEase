import type { Process } from "@/lib/types";
import { passportNew } from "./passport-new";
import { passportRenewal } from "./passport-renewal";
import { aadhaarAddressUpdate } from "./aadhaar-address-update";
import { panCard } from "./pan-card";
import { voterId } from "./voter-id";
import { drivingLicence } from "./driving-licence";
import { birthCertificate } from "./birth-certificate";
import { incomeCertificate } from "./income-certificate";
import { casteCertificate } from "./caste-certificate";
import { domicileCertificate } from "./domicile-certificate";
import { udyamRegistration } from "./udyam-registration";
import { nspScholarship } from "./nsp-scholarship";
import { epfAfterJobChange } from "./epf-after-job-change";
import { propertyRegistration } from "./property-registration";
import { pmKisan } from "./pm-kisan";

export const processes: Process[] = [
  passportNew,
  passportRenewal,
  aadhaarAddressUpdate,
  panCard,
  drivingLicence,
  birthCertificate,
  voterId,
  incomeCertificate,
  casteCertificate,
  domicileCertificate,
  udyamRegistration,
  nspScholarship,
  epfAfterJobChange,
  propertyRegistration,
  pmKisan,
];

/** Statuses that are visible on the public site. */
export const PUBLIC_STATUSES = new Set(["published", "review_due", "needs_update"]);

export const publicProcesses = processes.filter((p) => PUBLIC_STATUSES.has(p.status));

export function getProcess(slug: string): Process | undefined {
  return processes.find((p) => p.slug === slug);
}

export const POPULAR = ["passport-new", "aadhaar-address-update", "pan-card", "driving-licence", "birth-certificate", "passport-renewal"];
