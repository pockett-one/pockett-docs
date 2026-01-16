export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_DATA: FAQItem[] = [
  {
    question: "How does Pockett connect to my Google Drive?",
    answer: "Pockett uses secure OAuth 2.0 authentication to act as a management layer on top of your existing Google Drive. We assume a 'Non-Custodial' design, meaning your files effectively never leave your Google Drive. We simply organize them into professional Client Portals and manage sharing permissions."
  },
  {
    question: "What exactly does Pockett do for Consultants?",
    answer: "Pockett turns your messy Google Drive folders into a secure, branded Client Portal. It allows you to package deliverables professionally, track who accesses your IP, and—most importantly—instantly revoke access ('Wrap') when a project ends to prevent 'Zombie Links'."
  },
  {
    question: "Is my data secure? Do you store my files?",
    answer: "Your security is our priority. Because we use a Non-Custodial architecture, we do not store your actual file contents on our servers—they remain encrypted in your Google Drive. We only store the metadata needed to power your dashboard, audit logs, and project hierarchy."
  },
  {
    question: "What happens if I stop using Pockett?",
    answer: "Nothing happens to your files. Since Pockett organizes the data that already lives in your Google Drive, you retain full ownership. If you cancel, your folders and files remain exactly where they are in Drive—you just lose the professional Portal view and automated access controls."
  },
  {
    question: "Can I manage access for multiple clients?",
    answer: "Yes. Pockett is designed for firm-level scale. You can create distinct Projects for each client, map specific Drive folders to them, and manage permissions granularly. Our 'Audit Log' shows you exactly which external domains (clients) have access to which files."
  },
  {
    question: "Do I need IT admin permissions to use Pockett?",
    answer: "No! Pockett is designed for independent consultants and boutique firms who need professional tools without complex IT setup. You can connect your own accounts and start protecting your IP immediately."
  }
]