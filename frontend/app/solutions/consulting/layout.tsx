import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Professional Client Portal for Consultants | Pockett",
    description:
        "Turn specific Google Drive folders into a secure, branded client portal. Ideal for Consultants, Agencies, and Advisors who need to protect IP and meaningful client handovers.",
    keywords: [
        "Consultant Client Portal",
        "Google Drive Client Portal",
        "Secure Document Sharing",
        "Agency File Sharing",
        "Consulting Project Handover",
        "VDR for Consultants",
        "Professional Client Portal",
    ],
    openGraph: {
        title: "Professional Client Portal for Consultants | Pockett",
        description:
            "Deliver work with a white-glove experience. Protect your IP and instantly revoke access when the project is done - all from Google Drive.",
        type: "website",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
