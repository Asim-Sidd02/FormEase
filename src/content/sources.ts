import type { TrackedSource } from "@/lib/sources/types";

/*
 * Official pages FormEase reads, per process. Each one is fetched on a schedule, its text extracted,
 * and compared with the version our editors last reviewed. Only official domains are allowed
 * (see src/lib/sources/fetcher.ts). Prefer pages that state requirements (document lists, fees, FAQs)
 * over homepages, whose news tickers and counters change constantly.
 *
 * Not tracked on purpose:
 *  - india.gov.in — returns 403 to automated clients; we respect that rather than spoofing a browser.
 *  - crsorgi.gov.in — a login portal with no readable public guidance; birth registration rules are local.
 *  - State e-District portals (income/caste/domicile) — one per state; add them per state as coverage grows.
 */
const PSP = "https://www.passportindia.gov.in/psp";
const MEA = "Ministry of External Affairs (Passport Seva)";
const UTI = "UTIITSL — authorised PAN agency";

export const trackedSources: TrackedSource[] = [
  /* ------------------------------ Passport ------------------------------ */
  { id: "psp-apply-fresh", processes: ["passport-new"], url: `${PSP}/ApplyPassport`, title: "Apply for a fresh passport", org: MEA, kind: "spa", topics: ["steps", "documents"], focus: ["fresh", "apply", "register", "appointment", "document", "psk"] },
  { id: "psp-apply-reissue", processes: ["passport-renewal"], url: `${PSP}/ApplyReissue`, title: "Re-issue of passport", org: MEA, kind: "spa", topics: ["steps", "documents"], focus: ["re-issue", "reissue", "expiry", "expired", "lost", "damaged", "change", "particulars", "document"] },
  { id: "psp-dob-proof", processes: ["passport-new", "passport-renewal"], url: `${PSP}/ListDOB`, title: "Acceptable proof of date of birth", org: MEA, kind: "spa", topics: ["documents"], focus: ["birth", "date of birth", "certificate", "october 2023", "proof"] },
  { id: "psp-tatkaal", processes: ["passport-new", "passport-renewal"], url: `${PSP}/TatkaalPassports`, title: "Tatkaal passports", org: MEA, kind: "spa", topics: ["documents", "fees", "eligibility"], focus: ["tatkaal", "fee", "document", "eligible", "undertaking"] },
  { id: "psp-fee-faq", processes: ["passport-new", "passport-renewal"], url: `${PSP}/FaqFeePayment`, title: "Fee payment FAQs", org: MEA, kind: "spa", topics: ["fees", "faq"], focus: ["fee", "payment", "refund", "online", "challan"] },
  { id: "psp-police-faq", processes: ["passport-new", "passport-renewal"], url: `${PSP}/FaqPoliceVerification`, title: "Police verification FAQs", org: MEA, kind: "spa", topics: ["steps", "faq", "timelines"], focus: ["police", "verification", "pre", "post", "address", "days"] },
  { id: "psp-minors", processes: ["passport-new"], url: `${PSP}/SplCaseOfMinorsReqPassport`, title: "Special cases — minors", org: MEA, kind: "spa", topics: ["documents", "eligibility"], focus: ["minor", "parent", "consent", "annexure", "child"] },

  /* ------------------------------ Aadhaar ------------------------------ */
  { id: "uidai-update", processes: ["aadhaar-address-update"], url: "https://uidai.gov.in/en/updating-data-on-aadhaar", title: "Updating data on Aadhaar", org: "UIDAI", kind: "html", topics: ["steps", "documents", "fees"], focus: ["address", "update", "demographic", "document", "proof", "online", "centre", "fee", "charges", "mobile"] },
  { id: "uidai-supporting-docs", processes: ["aadhaar-address-update"], url: "https://backend.uidai.gov.in/get/files/media/document/2026-05/List_of_Supporting_Document_for_Aadhaar_Enrolment_and_Update.pdf", title: "List of supporting documents (PDF)", org: "UIDAI", kind: "pdf", topics: ["documents"], focus: ["proof of address", "poa", "address", "head of family", "document"] },
  { id: "uidai-charter", processes: ["aadhaar-address-update"], url: "https://backend.uidai.gov.in/get/files/media/document/2026-05/Citizen_Charter_Jan24.pdf", title: "UIDAI Citizens' Charter (PDF)", org: "UIDAI", kind: "pdf", topics: ["fees", "timelines"], focus: ["update", "address", "demographic", "charges", "fee", "days", "free"] },
  { id: "myaadhaar", processes: ["aadhaar-address-update"], url: "https://myaadhaar.uidai.gov.in/", title: "myAadhaar portal", org: "UIDAI", kind: "spa", topics: ["steps"], focus: ["address", "update", "document"] },

  /* ------------------------------ PAN ------------------------------ */
  { id: "utiitsl-pan", processes: ["pan-card"], url: "https://www.pan.utiitsl.com/", title: "PAN services", org: UTI, kind: "html", topics: ["fees", "forms", "steps"], focus: ["pan", "fee", "e-pan", "physical", "apply", "correction", "change"] },
  { id: "utiitsl-pan-docs", processes: ["pan-card"], url: "https://www.pan.utiitsl.com/downloadFile?FileName=DocumentsForPAN.pdf", title: "Documents accepted for PAN (PDF)", org: UTI, kind: "pdf", topics: ["documents"], focus: ["proof", "identity", "address", "date of birth", "document", "form"] },
  { id: "utiitsl-pan-faq", processes: ["pan-card"], url: "https://www.pan.utiitsl.com/faqs.html", title: "PAN FAQs and form instructions", org: UTI, kind: "html", topics: ["faq", "forms"], focus: ["form", "instructions", "faq"] },

  /* ------------------------------ Voter ID ------------------------------ */
  { id: "eci-voters", processes: ["voter-id"], url: "https://voters.eci.gov.in/", title: "Voters' Service Portal", org: "Election Commission of India", kind: "spa", topics: ["steps", "forms"], focus: ["form 6", "form 8", "new voter", "shifting", "registration", "epic", "18"] },

  /* ------------------------------ Driving licence ------------------------------ */
  { id: "parivahan", processes: ["driving-licence"], url: "https://parivahan.gov.in/", title: "Parivahan Sewa — licence services", org: "Ministry of Road Transport & Highways", kind: "html", topics: ["steps", "forms"], focus: ["driving licence", "learner", "licence", "license", "appointment", "question bank"] },

  /* ------------------------------ Business / Udyam ------------------------------ */
  { id: "udyam-important", processes: ["udyam-registration"], url: "https://udyamregistration.gov.in/Important.aspx", title: "Important information for Udyam registration", org: "Ministry of Micro, Small and Medium Enterprises", kind: "html", topics: ["steps", "documents", "fees", "eligibility"], focus: ["free", "fee", "aadhaar", "pan", "gstin", "registration", "enterprise"] },
  { id: "udyam-form", processes: ["udyam-registration"], url: "https://www.udyamregistration.gov.in/UdyamRegistration.aspx", title: "Udyam registration form", org: "Ministry of Micro, Small and Medium Enterprises", kind: "html", topics: ["steps", "forms"], focus: ["aadhaar", "pan", "verification", "registration", "enterprise"] },

  /* ------------------------------ Education / NSP ------------------------------ */
  { id: "nsp-students", processes: ["nsp-scholarship"], url: "https://scholarships.gov.in/Students", title: "National Scholarship Portal — Students", org: "Ministry of Electronics and Information Technology", kind: "spa", topics: ["steps", "eligibility", "timelines"], focus: ["otr", "scholarship", "fresh", "renewal", "eligibility", "application", "status", "payment"] },
  { id: "nsp-application-faq", processes: ["nsp-scholarship"], url: "https://scholarships.gov.in/public/FAQ/NSP_FAQsORApplicationUsermanul_V2.2.pdf", title: "NSP application form FAQ", org: "National Scholarship Portal", kind: "pdf", topics: ["steps", "documents", "forms"], focus: ["fresh application", "otr", "basic information", "apply fresh", "final submit", "application id", "bank"] },

  /* ------------------------------ Employment / EPF ------------------------------ */
  { id: "epfo-uan-faq", processes: ["epf-after-job-change"], url: "https://epfindia.gov.in/site_docs/PDFs/UAN_PDFs/UAN_ForMembers/FAQ-Member-Ver1.1.pdf", title: "EPFO UAN member FAQ", org: "Employees' Provident Fund Organisation", kind: "pdf", topics: ["steps", "faq"], focus: ["change job", "uan", "transfer", "member id", "service details", "employer"] },
  { id: "epfo-member-portal", processes: ["epf-after-job-change"], url: "https://unifiedportal-mem.epfindia.gov.in/memberinterface/", title: "EPFO Member e-Sewa portal", org: "Employees' Provident Fund Organisation", kind: "spa", topics: ["steps", "status"], focus: ["uan", "transfer", "claim", "service history", "kyc"] },

  /* ------------------------------ Property / registration ------------------------------ */
  { id: "ngdrs-state-links", processes: ["property-registration"], url: "https://ngdrs.gov.in/NGDRS_Website/state_ut_links.php?lang=en", title: "State/UT registration department links", org: "Department of Land Resources, Ministry of Rural Development", kind: "html", topics: ["steps", "forms"], focus: ["state", "union territory", "registration", "department", "portal"] },
  { id: "ngdrs-home", processes: ["property-registration"], url: "https://ngdrs.gov.in/NGDRS_Website/index.php?lang=en", title: "National Generic Document Registration System", org: "Department of Land Resources, Ministry of Rural Development", kind: "html", topics: ["steps", "fees", "forms"], focus: ["valuation", "stamp duty", "appointment", "property", "document registration"] },
  { id: "india-registration-act", processes: ["property-registration"], url: "https://www.indiacode.nic.in/bitstream/123456789/13236/1/the_registration_act%2C_1908.pdf", title: "The Registration Act, 1908", org: "India Code, Government of India", kind: "pdf", topics: ["eligibility", "forms"], focus: ["compulsory registration", "immovable property", "document"] },

  /* ------------------------------ Schemes / PM-KISAN ------------------------------ */
  { id: "pmkisan-home", processes: ["pm-kisan"], url: "https://pmkisan.gov.in/", title: "PM-KISAN scheme and eligibility", org: "Department of Agriculture and Farmers Welfare", kind: "html", topics: ["eligibility", "fees", "timelines"], focus: ["farmer family", "exclusion", "landholding", "instalment", "status", "registration"] },
  { id: "pmkisan-ekyc", processes: ["pm-kisan"], url: "https://pmkisan.gov.in/KnowAboutEKYC.aspx", title: "PM-KISAN e-KYC process", org: "Department of Agriculture and Farmers Welfare", kind: "html", topics: ["steps"], focus: ["otp", "biometric", "face authentication", "ekyc", "aadhaar"] },

];

export const getSource = (id: string) => trackedSources.find((s) => s.id === id);
export const sourcesFor = (slug: string) => trackedSources.filter((s) => s.processes.includes(slug));
