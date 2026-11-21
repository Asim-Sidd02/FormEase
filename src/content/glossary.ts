import type { StatusTerm } from "@/lib/types";

/** Plain-language explanations of official terms (used by search, assistant and status help). */
export const glossary: Record<string, string> = {
  "self-attested":
    "You sign a photocopy of your own document to confirm it is a true copy of the original. Write 'self-attested', sign and date it.",
  annexure:
    "An extra form or declaration attached to the main application. Official portals publish the exact annexure formats — download them only from the official site.",
  "police verification":
    "A check by the local police that the address and details you gave are genuine. For passports it can happen before or after the passport is issued.",
  tatkaal:
    "A faster passport service available for a higher fee. It speeds up processing but does not skip any checks.",
  arn: "Application Reference Number — the ID you get after submitting an application online. Keep it to track status or book appointments.",
  urn: "Update Request Number — the number you get after requesting an Aadhaar update. Use it to track your update.",
  "e-district":
    "A state government's online portal for certificates such as income, caste and domicile. Each state runs its own.",
  "proof of address":
    "A document showing where you currently live, in your name — e.g. a utility bill, bank passbook, rent agreement or Aadhaar, depending on what the process accepts.",
  "proof of date of birth":
    "A document that states your date of birth — e.g. a birth certificate or school leaving certificate, depending on what the process accepts.",
  "learner's licence":
    "A temporary licence that lets you practise driving under conditions. You need it before you can apply for a permanent driving licence.",
  "delayed registration":
    "Registering a birth after the normal reporting window. Extra approvals or an affidavit may be required, and the rules depend on how late it is.",
  "biometric":
    "Fingerprints, iris scan and/or photo captured at an official centre to confirm your identity.",
  "gazette notification":
    "A formal public notice of a change, such as a name change, published in the official government gazette.",
  affidavit:
    "A written statement you confirm under oath, usually on stamp paper and attested by a notary or magistrate.",
};

/** Status terms that apply across most processes — spec §6.11. */
export const commonStatusTerms: StatusTerm[] = [
  {
    term: "Submitted / Received",
    meaning: "Your application reached the office. Nobody has acted on it yet.",
    next: "Keep your reference number and wait. Check status on the official portal every few days rather than daily.",
  },
  {
    term: "Under process / Under scrutiny",
    meaning: "An official is reviewing your application and documents.",
    next: "No action needed unless you are contacted. Keep your phone reachable and your originals handy.",
  },
  {
    term: "Pending for verification",
    meaning: "A verification step (often address or police verification) is waiting to be done.",
    next: "Be available at your address and keep originals ready. If it has been unusually long, use the official grievance route.",
  },
  {
    term: "Returned / Sent back / Objection raised",
    meaning: "The office needs you to fix or add something before it can continue.",
    next: "Read the objection carefully, prepare the missing or corrected item, and resubmit through the same portal or office.",
  },
  {
    term: "Rejected",
    meaning: "The application was closed without approval. Fees are usually not refunded.",
    next: "Find the stated reason, fix the underlying problem and submit a fresh application. Ask the office if an appeal or review route exists.",
  },
  {
    term: "Approved / Granted / Dispatched",
    meaning: "The request was approved. The document may be printed or on its way.",
    next: "Track delivery with the reference or tracking number shown, and check every detail when you receive it.",
  },
];

/** Typical reasons applications get returned — used by rejection help + assistant. */
export const rejectionPatterns: {
  match: RegExp;
  label: string;
  explain: string;
  fix: string[];
}[] = [
  {
    match: /mismatch|does not match|not matching|discrepan|different (name|dob|date)/i,
    label: "Details don't match across documents",
    explain:
      "The office found that your name, date of birth or address is written differently on two documents or between your form and a document.",
    fix: [
      "Compare the exact spelling, initials and date format across every document you submitted.",
      "Correct the source document first if it is wrong (e.g. update Aadhaar or PAN), then resubmit.",
      "Where the process allows it, attach the declaration or affidavit the office asks for to explain the difference.",
    ],
  },
  {
    match: /blur|unclear|illegible|not readable|quality|scan/i,
    label: "Document not readable",
    explain: "An uploaded scan or photo could not be read clearly.",
    fix: [
      "Rescan in good light, flat, with all four corners visible.",
      "Check the portal's required file type and size before uploading again.",
    ],
  },
  {
    match: /photo|photograph|signature/i,
    label: "Photo or signature problem",
    explain: "Your photo or signature did not meet the specification (size, background, clarity).",
    fix: [
      "Check the official photo and signature specifications for this process.",
      "Use a plain light background and a recent photo; sign within the box.",
    ],
  },
  {
    match: /address|residence|proof of address|por/i,
    label: "Address proof issue",
    explain: "The address proof was not accepted — it may be outdated, in someone else's name, or not on the accepted list.",
    fix: [
      "Use a document from the accepted list that is in your own name and shows your current address.",
      "Check whether a recent-date requirement applies (some bills must be recent).",
    ],
  },
  {
    match: /expired|validity|outdated|old/i,
    label: "Expired or outdated document",
    explain: "A document you provided was no longer valid on the date of submission.",
    fix: ["Renew or obtain a fresh copy of the document, then resubmit."],
  },
  {
    match: /missing|not (attached|uploaded|submitted)|incomplete|required document/i,
    label: "Missing document or information",
    explain: "Something the office needs was not included.",
    fix: [
      "Re-read the objection to see exactly which item is missing.",
      "Open your FormEase checklist for this journey and confirm each required item.",
    ],
  },
  {
    match: /police|verification|not found at address|adverse/i,
    label: "Verification problem",
    explain:
      "The verification report was negative or incomplete — for example you were not found at the address given.",
    fix: [
      "Contact the office that issued the status for the exact reason.",
      "Make sure you will be available at the address, and keep originals ready for a re-check.",
    ],
  },
  {
    match: /fee|payment|amount|challan/i,
    label: "Fee or payment issue",
    explain: "The payment did not go through, was short, or was not linked to your application.",
    fix: [
      "Check your bank statement and the portal's payment history.",
      "Pay only through the official portal — never through a link sent by an unknown person.",
    ],
  },
];
