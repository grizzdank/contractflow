import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Navigation from "@/components/Navigation";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: 30,
      description: "Perfect for small teams managing basic contracts",
      features: [
        "Up to 5 Team Members",
        "Up to 50 Active Contracts",
        "5GB Document Storage",
        "Email Support",
        "E-Signature Integration",
        "Email Notifications",
        "Contract Expiry Alerts",
        "Approval Workflows",
        "Audit Trail",
      ],
    },
    {
      name: "Business",
      price: 45,
      description: "For growing businesses with advanced needs",
      features: [
        "Unlimited Team Members",
        "Unlimited Active Contracts",
        "25GB Document Storage",
        "Priority Support",
        "E-Signature Integration",
        "Custom Fields & Forms",
        "Approval Workflows",
        "Contract Analytics",
        "Audit Trail",
        "Bulk Operations",
      ],
    },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center space-y-8 mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start with a 14-day free trial.
            </p>
            <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-green-800">Save 20% with annual billing</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex flex-col"
              >
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-4 text-gray-600">{plan.description}</p>
                  <div className="mt-8">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold tracking-tight text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="ml-1 text-lg text-gray-600">/user/month</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      ${(plan.price * 0.8).toFixed(2)}/user/month billed annually
                    </p>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                        <span className="ml-3 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    Start Free Trial
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-12">Compare Features</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Feature</th>
                    <th className="text-center py-4 px-6 font-medium text-gray-600">Starter</th>
                    <th className="text-center py-4 px-6 font-medium text-gray-600">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Team Members", starter: "Up to 5", business: "Unlimited" },
                    { name: "Active Contracts", starter: "Up to 50", business: "Unlimited" },
                    { name: "Document Storage", starter: "5GB", business: "25GB" },
                    { name: "E-Signature Integration", starter: "✓", business: "✓" },
                    { name: "Custom Fields", starter: "—", business: "✓" },
                    { name: "Approval Workflows", starter: "✓", business: "✓" },
                    { name: "Audit Trail", starter: "✓", business: "✓" },
                    { name: "Contract Analytics", starter: "—", business: "✓" },
                    { name: "Bulk Operations", starter: "—", business: "✓" },
                    { name: "Support", starter: "Email", business: "Priority" },
                  ].map((feature) => (
                    <tr key={feature.name} className="border-b">
                      <td className="py-4 px-6 font-medium">{feature.name}</td>
                      <td className="text-center py-4 px-6">{feature.starter}</td>
                      <td className="text-center py-4 px-6">{feature.business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  q: "Can I switch plans later?",
                  a: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards including Visa, Mastercard, and American Express."
                },
                {
                  q: "Is there a long-term commitment?",
                  a: "No, all plans are billed monthly or annually, and you can cancel at any time."
                },
                {
                  q: "What happens after my free trial?",
                  a: "After your 14-day trial, your selected plan will automatically begin and your card will be charged. You can cancel anytime before the trial ends."
                },
              ].map((faq) => (
                <div key={faq.q} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing; 