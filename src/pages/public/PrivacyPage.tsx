import PublicNavigation from "@/components/PublicNavigation";
import Footer from "@/components/Footer";

const PrivacyPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50">
      <PublicNavigation />
      <main className="flex-1 container mx-auto px-4 py-16 md:py-24"> {/* Added more top padding */}
        <article className="prose prose-lg mx-auto bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-lg text-left">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p>This Privacy Policy explains how <strong>LFG Consulting</strong> ("<strong>Company</strong>", “we,” “our,” or “us”) collects, uses, and discloses information when you use the ContractFlo web application (the “<strong>Service</strong>”).</p>

      <h2>1. Information We Collect</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Examples</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account Data</td>
            <td>Name, email, password hash, organization</td>
            <td>You / Clerk.dev</td>
          </tr>
          <tr>
            <td>Contract Data</td>
            <td>Contracts, attachments, comments</td>
            <td>You</td>
          </tr>
          <tr>
            <td>Usage Data</td>
            <td>Log files, IP address, device, actions</td>
            <td>Automatic</td>
          </tr>
          <tr>
            <td>Third‑Party Data</td>
            <td>Envelope status from Signwell</td>
            <td>APIs</td>
          </tr>
        </tbody>
      </table>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>Provide, maintain, and improve the Service.</li>
        <li>Generate AI SOW drafts (sent to OpenAI's API with minimal context).</li>
        <li>Send notifications and security alerts.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2>3. Legal Bases (GDPR)</h2>
      <ul>
        <li><strong>Contractual necessity</strong> (to provide the Service).</li>
        <li><strong>Legitimate interests</strong> (security, product improvement).</li>
        <li><strong>Consent</strong> (marketing emails, if any).</li>
      </ul>

      <h2>4. Sharing &amp; Disclosure</h2>
      <p>We do <strong>not</strong> sell personal data. We share it only with:</p>
      <ol>
        <li>Service providers (Supabase, Clerk, OpenAI, Signwell) bound by confidentiality.</li>
        <li>Law enforcement when required by law.</li>
        <li>A successor entity in a merger or acquisition.</li>
      </ol>

      <h2>5. International Transfers</h2>
      <p>Data is stored in <strong>[AWS region us‑west‑2]</strong>. Transfers outside the EEA rely on Standard Contractual Clauses.</p>

      <h2>6. Security</h2>
      <p>We follow industry best practices (TLS 1.2+, encryption at rest, periodic penetration testing). Users must keep passwords secure and enable MFA.</p>

      <h2>7. Data Retention</h2>
      <p>Account data is retained while your subscription is active. Contract data is retained until deleted by an org admin or 90 days after subscription termination, whichever is sooner.</p>

      <h2>8. Your Rights</h2>
      <p>Depending on your location, you may have rights under GDPR/CCPA to access, correct, delete, or port your data. Submit requests to <a href="mailto:privacy@contractflo.ai">privacy@contractflo.ai</a>.</p>

      <h2>9. Children's Privacy</h2>
      <p>The Service is not directed to children under 13. We do not knowingly collect such data.</p>

      <h2>10. Changes to This Policy</h2>
      <p>We will notify you of material changes via email or in‑app notice at least 30 days before they take effect.</p>

      <h2>11. Contact Us</h2>
      <p>
        For privacy questions, email <a href="mailto:privacy@contractflo.ai">privacy@contractflo.ai</a> or write to:<br />
        <strong>LFG Consulting</strong>
      </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage; 