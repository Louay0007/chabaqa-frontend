import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LegalDocumentLayout } from "@/app/(landing)/components/legal-document-layout";

export const metadata: Metadata = {
    title: "Data Processing Agreement | Chabaqa",
    description:
        "Data Processing Agreement (DPA) between Chabaqa and community creators acting as data controllers.",
};

const DPA_SECTIONS = [
    {
        id: "subject-matter",
        title: "1. Subject Matter and Duration",
        paragraphs: [
            'This Data Processing Agreement ("DPA") is entered into between the community creator ("Controller") and Chabaqa ("Processor") and forms part of the Terms of Service.',
            "The subject matter of this DPA is the processing of personal data of community members on behalf of the Controller. The DPA remains in force for the duration of the service relationship and terminates automatically when the Controller deletes their community or closes their account.",
        ],
    },
    {
        id: "nature-purpose",
        title: "2. Nature and Purpose of Processing",
        paragraphs: [
            "Chabaqa processes personal data on behalf of the Controller solely to operate, maintain, and deliver the community platform services, including but not limited to: account management, content delivery, payment processing, community communication, course enrollment management, and analytics.",
            "Chabaqa will not process personal data for any purpose other than those documented in this DPA and the accompanying Privacy Policy, except as required by applicable law.",
        ],
    },
    {
        id: "data-types",
        title: "3. Types of Personal Data and Data Subjects",
        paragraphs: [
            "Categories of personal data processed include: identity data (name, username, profile photo), contact data (email address, phone number), account credentials (hashed passwords, authentication tokens), transaction data (payment history, subscription status), content data (posts, comments, messages, uploads), behavioral data (activity logs, course progress, session metadata), and device data (IP address, browser type, operating system).",
            "Data subjects include community members, course students, event attendees, and any other individuals who interact with the Controller's community on the Chabaqa platform.",
        ],
    },
    {
        id: "controller-obligations",
        title: "4. Obligations and Rights of the Controller",
        paragraphs: [
            "The Controller is responsible for: ensuring a valid legal basis for all processing activities involving their community members, providing required privacy notices and obtaining consents where required by applicable law, responding to data subject rights requests that the Controller is obligated to handle, and notifying Chabaqa of any instructions that may conflict with applicable data protection law.",
            "The Controller has the right to: issue documented instructions regarding the processing of personal data, request information about processing activities and security measures, conduct audits or inspections (with reasonable notice and at the Controller's expense), and request deletion or return of personal data upon termination.",
        ],
    },
    {
        id: "processor-obligations",
        title: "5. Obligations of Chabaqa as Processor",
        paragraphs: [
            "Chabaqa undertakes to: process personal data only on documented instructions from the Controller, ensure confidentiality of personal data by obligating authorized personnel to appropriate confidentiality commitments, implement appropriate technical and organizational security measures, assist the Controller in fulfilling data subject rights requests received through the platform, notify the Controller promptly of any data subject requests received directly by Chabaqa, and delete or return personal data upon termination of the service relationship.",
            "Chabaqa will not engage any sub-processor for the Controller's data without prior authorization and will ensure sub-processors are bound by equivalent data protection obligations.",
        ],
    },
    {
        id: "sub-processors",
        title: "6. Sub-Processors",
        paragraphs: [
            "Chabaqa uses the following categories of sub-processors to provide the service: cloud infrastructure and hosting providers, payment processing services, transactional email delivery services, video storage and streaming services, and analytics providers operating under data processing agreements.",
            "Chabaqa maintains an up-to-date list of sub-processors and will notify Controllers of any additions or replacements, giving at least 30 days' notice so Controllers may object before changes take effect.",
        ],
    },
    {
        id: "data-transfers",
        title: "7. International Data Transfers",
        paragraphs: [
            "Where personal data is transferred to countries outside the European Economic Area (EEA) or countries not recognised as providing adequate protection, Chabaqa relies on standard contractual clauses (SCCs) as adopted by the European Commission, or other appropriate transfer mechanisms under applicable law.",
            "Chabaqa will provide Controllers with information about the transfer mechanisms in place for each sub-processor upon request.",
        ],
    },
    {
        id: "security",
        title: "8. Security Measures",
        paragraphs: [
            "Chabaqa implements and maintains appropriate technical and organizational measures to protect personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. These measures include: encryption of data in transit and at rest, access controls and authentication requirements, regular security assessments and vulnerability management, incident response procedures, and employee training on data protection.",
            "Chabaqa will provide the Controller with reasonable information about implemented security measures upon request and will cooperate to ensure compliance with Article 32 of the GDPR.",
        ],
    },
    {
        id: "breach-notification",
        title: "9. Data Breach Notification",
        paragraphs: [
            "In the event of a personal data breach affecting the Controller's community data, Chabaqa will notify the Controller without undue delay and, where feasible, within 72 hours of becoming aware of the breach.",
            "Notifications will include: a description of the nature of the breach, categories and approximate number of data subjects and records concerned, likely consequences, and measures taken or proposed to address the breach. Chabaqa will cooperate fully with the Controller in managing the breach and fulfilling any obligations to notify supervisory authorities or data subjects.",
        ],
    },
    {
        id: "data-subject-rights",
        title: "10. Data Subject Rights Assistance",
        paragraphs: [
            "Chabaqa provides technical tools within the platform to assist the Controller in fulfilling data subject rights requests, including: access requests (data export), rectification (profile editing), erasure (account deletion with full PII scrub), restriction and objection capabilities, and data portability exports in machine-readable format.",
            "Where Chabaqa receives a data subject request that the Controller is required to respond to, Chabaqa will forward the request to the Controller within a reasonable timeframe and assist as technically feasible.",
        ],
    },
    {
        id: "governing-law",
        title: "11. Governing Law",
        paragraphs: [
            "This DPA shall be governed by the laws applicable to the main Terms of Service agreement. In the event of any conflict between this DPA and the Terms of Service with respect to data protection matters, this DPA shall prevail.",
            "This DPA incorporates by reference the Standard Contractual Clauses (SCCs) as required under GDPR Article 46(2)(c) where applicable to international data transfers.",
        ],
    },
];

export default function DpaPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <LegalDocumentLayout
                title="Data Processing Agreement"
                subtitle="Between Chabaqa (Processor) and community creators (Controllers)"
                effectiveDate="January 2025"
                lastUpdated="January 2025"
                contactEmail="legal@chabaqa.com"
                relatedLink={{
                    href: "/legal/privacy",
                    label: "Privacy Policy",
                    description: "Read our full Privacy Policy",
                }}
                sections={DPA_SECTIONS}
            />
            <Footer />
        </div>
    );
}
