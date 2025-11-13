"use client";

import { useState } from "react";
import { useIframeSdk } from "@whop/react";
import PricingCard from "@/components/admin/PricingCard";
import { getPlanId } from "@/actions/payment-actions";
import { Button } from "@whop/react/components";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: 15,
    period: "month",
    features: [
      "1 League with unlimited tiers",
      "Daily points & streaks",
      "Message interactions",
      "Basic analytics",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 150,
    period: "year",
    originalPrice: 180, // $420 annual if monthly
    savings: 15 * 12 - 150, // $121 savings
    features: [
      "Everything in Monthly",
      "Priority support",
      "Custom branding",
      "Advanced analytics",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const iframeSdk = useIframeSdk();
  const router = useRouter();
  const handlePurchase = async (planType: string) => {
    setLoading(planType);
    try {
      const result = await getPlanId(planType);

      if (!result.success || !result.planId) {
        alert(result.error || "Plan ID not found");
        setLoading(null);
        return;
      }

      const res = await iframeSdk.inAppPurchase({
        planId: result.planId,
      });

      if (res.status === "ok") {
        alert("Payment successful! Your subscription is now active.");
        window.location.reload();
      } else {
        alert("Payment cancelled or failed");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Error processing purchase");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-a1 py-12 px-6">
      <div className="flex justify-start mb-4">
        <Button
          variant="surface"
          className="cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-8 font-bold text-gray-12 mb-2">Simple Pricing</h1>
          <p className="text-4 text-gray-11">
            Choose the perfect plan for your community
          </p>
        </div>

        {/* Pricing Cards - Flex Row */}
        <div className="flex justify-center gap-8 mb-16 flex-wrap">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isLoading={loading === plan.id}
              onPurchase={() => handlePurchase(plan.id)}
            />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-6 font-bold text-gray-12 mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Is there a free trial?",
                a: "Yes! Admins get a 5-day free trial automatically.",
              },
              {
                q: "What happens when my trial ends?",
                a: "You'll have to upgrade to a paid plan to continue using the app.",
              },
              {
                q: "What happens if I cancel my subscription?",
                a: "You'll lose access to the app and all your data will be deleted.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-a2 border border-gray-a6 rounded-lg p-4"
              >
                <p className="text-3 font-semibold text-gray-12 mb-2">
                  {item.q}
                </p>
                <p className="text-3 text-gray-11">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
