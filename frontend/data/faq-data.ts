export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_DATA: FAQItem[] = [
  {
    question: "How does Pockett connect to my Google Drive?",
    answer: "Pockett uses secure OAuth 2.0 authentication to connect to your Google Drive. We only access the documents you authorize, and we never store your actual document content - just metadata for analytics and insights."
  },
  {
    question: "What kind of insights can I get from Pockett?",
    answer: "Pockett provides document usage analytics, personal productivity metrics, engagement tracking, sharing patterns, and data-driven document summarization. You'll get insights into how you use documents and identify opportunities for better organization."
  },
  {
    question: "Is my data secure with Pockett?",
    answer: "Absolutely. We use enterprise-grade security measures including end-to-end encryption, secure API connections, and strict access controls. Your data is never shared with third parties and is stored in secure, compliant data centers."
  },
  {
    question: "When will you support other platforms like Dropbox and Box?",
    answer: "We're actively working on expanding our integrations. Dropbox, Box, OneDrive, Confluence, and Notion support are coming soon. Sign up for updates to be notified when new integrations become available."
  },
  {
    question: "Do I need IT admin permissions to use Pockett?",
    answer: "No! Pockett is designed for freelancers and individuals who need document insights without complex IT setup. You can connect your own accounts and start getting insights immediately."
  },
  {
    question: "How much does Pockett cost?",
    answer: "Pockett offers a free tier to get you started, with premium plans for advanced features and higher usage limits. Our pricing is designed to be accessible for freelancers and individuals, with no hidden fees or long-term contracts."
  }
]