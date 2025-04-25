import PublicNavigation from "@/components/PublicNavigation";
import Footer from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50">
      <PublicNavigation />
      <main className="flex-1 container mx-auto px-4 py-16 md:py-24"> {/* Added more top padding */}
        <article className="prose prose-lg mx-auto bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-lg text-left">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the ContractFlo web application (the &ldquo;<strong>Service</strong>&rdquo;) offered by <strong>LFG Consulting</strong> (&ldquo;<strong>Company</strong>&rdquo;, &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), you agree to be bound by these Terms of Service (the &ldquo;<strong>Terms</strong>&rdquo;).
            If you do not agree, do not use the Service.
          </p>
    
          <h2>2. Eligibility &amp; Accounts</h2>
          <ul>
            <li>You must be at least 18 years old.</li>
            <li>Account registration requires a valid business email.</li>
            <li>You are responsible for all activity under your credentials.</li>
          </ul>
    
          <h2>3. Subscriptions &amp; Fees</h2>
          <ul>
            <li><strong>Base Plan</strong> covers up to 100 named users.</li>
            <li>Optional add&ndash;ons (AI&nbsp;SOW, E&ndash;Signature) are billed annually in advance.</li>
            <li>Fees are non&ndash;refundable except as expressly stated.</li>
          </ul>
    
          <h2>4. License &amp; Intellectual Property</h2>
          <p>
            Company grants you a non&ndash;exclusive, non&ndash;transferable, revocable license to access and use the Service during your subscription.
            All software, graphics, and content (excluding Your Content) are Company&rsquo;s intellectual property.
          </p>
    
          <h2>5. User Content</h2>
          <p>
            &ldquo;<strong>Your Content</strong>&rdquo; includes contracts, attachments, comments, and data you upload. You retain all rights, but grant
            Company a limited license to host, process, and display Your Content solely to provide the Service.
          </p>
    
          <h2>6. Prohibited Uses</h2>
          <ul>
            <li>Upload unlawful or infringing material.</li>
            <li>Violate the security of any network.</li>
            <li>Reverse&ndash;engineer or scrape the Service.</li>
            <li>Use the AI&nbsp;SOW feature to generate disallowed content under the OpenAI policy.</li>
          </ul>
    
          <h2>7. Third&ndash;Party Integrations</h2>
          <p>
            The Service integrates with Clerk.dev (SSO), Supabase (data &amp; file storage), OpenAI (AI&nbsp;SOW generator), and Signwell (e&ndash;signature).
            Your use of those features is subject to the respective providers&rsquo; terms.
          </p>
    
          <h2>8. Confidentiality</h2>
          <p>Each party agrees to protect the other&rsquo;s Confidential Information with the same care it uses for its own (never less than reasonable care).</p>
    
          <h2>9. Security</h2>
          <p>We employ HTTPS/TLS, row&ndash;level security (RLS) in Supabase, at&ndash;rest encryption (AES&ndash;256) for documents, and MFA via Clerk. You acknowledge that no system is perfectly secure.</p>
    
          <h2>10. Disclaimers</h2>
          <p>THE SERVICE IS PROVIDED &ldquo;AS IS.&rdquo; WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON&ndash;INFRINGEMENT.</p>
    
          <h2>11. Limitation of Liability</h2>
          <p>Our aggregate liability will not exceed the amounts you paid to us in the 12&nbsp;months preceding the claim.</p>
    
          <h2>12. Indemnity</h2>
          <p>You agree to indemnify and hold harmless Company from claims arising out of Your Content or violation of these Terms.</p>
    
          <h2>13. Termination</h2>
          <p>We may suspend or terminate access for material breach with 30&nbsp;days&rsquo; notice (or immediately for illegal activity). Upon termination, Your Content will be available for export for 30&nbsp;days.</p>
    
          <h2>14. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of [Oregon] without regard to conflict&ndash;of&ndash;laws principles.</p>
    
          <h2>15. Modifications</h2>
          <p>We may update these Terms with 30&nbsp;days&rsquo; notice. Continued use constitutes acceptance.</p>
    
          <h2>16. Contact</h2>
          <p>Questions? Email <a href="mailto:legal@contractflo.ai">legal@contractflo.ai</a>.</p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage; 