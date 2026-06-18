export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const sections = [
    { title: "Information We Collect", content: "We collect information you provide directly (name, email, phone, address), information from account usage (orders, browsing history, wishlist), and technical data (IP address, browser type, device information) for improving our services." },
    { title: "How We Use Your Information", content: "We use your information to: process orders and payments, communicate about your account and orders, personalize your shopping experience, send promotional emails (with your consent), improve our services and platform, and comply with legal obligations." },
    { title: "Information Sharing", content: "We do not sell your personal information. We share data with: payment processors (Stripe, Razorpay) for transaction processing, shipping partners for order delivery, and analytics providers to improve our service. All third parties are contractually obligated to protect your data." },
    { title: "Data Security", content: "We implement industry-standard security measures including SSL encryption, secure password hashing, and regular security audits. However, no method of transmission over the internet is 100% secure." },
    { title: "Cookies", content: "We use cookies and similar technologies to remember your preferences, keep you logged in, analyze site traffic, and enable certain features. You can control cookies through your browser settings, though this may affect functionality." },
    { title: "Your Rights", content: "You have the right to: access your personal data, correct inaccurate data, request deletion of your account and data, opt out of marketing emails, and data portability. Contact us to exercise these rights." },
    { title: "Data Retention", content: "We retain your personal data for as long as necessary to provide services and comply with legal obligations. Account data is deleted upon account deletion request, except where we're required to retain it by law." },
    { title: "Children's Privacy", content: "Our service is not directed to children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately." },
    { title: "Changes to This Policy", content: "We may update this policy from time to time. We will notify you of significant changes via email or prominent notice on our platform. Continued use after changes constitutes acceptance." },
    { title: "Contact Us", content: "For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@shopease.com or by mail at: ShopEase Privacy Team, 123 Commerce St, Mumbai, Maharashtra 400001, India." },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-300">Last updated: January 1, 2025</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <p className="text-gray-600 mb-8 leading-relaxed">
            At ShopEase, your privacy is a priority. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
          <div className="space-y-8">
            {sections.map(({ title, content }) => (
              <div key={title}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
                <p className="text-gray-600 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
