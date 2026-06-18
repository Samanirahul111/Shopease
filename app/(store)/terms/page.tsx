export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  const sections = [
    { title: "1. Acceptance of Terms", content: "By accessing and using ShopEase, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services." },
    { title: "2. Use of Service", content: "ShopEase grants you a non-exclusive, non-transferable license to use our platform for personal, non-commercial shopping. You agree not to misuse our services, including but not limited to: engaging in fraudulent transactions, scraping data, or circumventing security measures." },
    { title: "3. Account Registration", content: "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and all activities under your account. Notify us immediately of any unauthorized use." },
    { title: "4. Products and Pricing", content: "We strive to display accurate product information and pricing. However, we reserve the right to correct errors and cancel orders if a pricing error occurs. Prices are listed in Indian Rupees (INR) and are subject to change without notice." },
    { title: "5. Order Processing", content: "Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order. You will receive an order confirmation email once the order is accepted. Delivery timelines are estimates and not guarantees." },
    { title: "6. Payment Terms", content: "Payment must be completed before order processing (except COD). We use secure payment processors. In case of payment failure, the order will be cancelled. COD orders require payment in full upon delivery." },
    { title: "7. Returns and Refunds", content: "Our return policy allows returns within 7 days of delivery for eligible items. Items must be unused, in original packaging. Refunds are processed to the original payment method within 5-7 business days after receiving the returned item." },
    { title: "8. Privacy", content: "Your use of ShopEase is governed by our Privacy Policy. We collect and use personal data as described therein. By using our service, you consent to such collection and use." },
    { title: "9. Intellectual Property", content: "All content on ShopEase, including images, text, logos, and code, is our intellectual property or licensed to us. You may not reproduce, distribute, or create derivative works without our explicit written permission." },
    { title: "10. Limitation of Liability", content: "ShopEase shall not be liable for indirect, incidental, special, or consequential damages arising from your use of our service. Our maximum liability is limited to the amount paid for the specific transaction." },
    { title: "11. Governing Law", content: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra." },
    { title: "12. Changes to Terms", content: "We may update these terms from time to time. Continued use of our service after changes constitutes acceptance of the updated terms. We will notify registered users of significant changes via email." },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-gray-300">Last updated: January 1, 2025</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <p className="text-gray-600 mb-8 leading-relaxed">
            Welcome to ShopEase. Please read these Terms and Conditions carefully before using our platform.
            These terms constitute a legally binding agreement between you and ShopEase.
          </p>
          <div className="space-y-8">
            {sections.map(({ title, content }) => (
              <div key={title}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
                <p className="text-gray-600 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-gray-500 text-sm">
              For questions about these terms, contact us at{" "}
              <a href="mailto:legal@shopease.com" className="text-gray-900 font-medium hover:underline">legal@shopease.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
