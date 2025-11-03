"use client";

import { Button } from "@whop/react/components";
import { CheckIcon } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  originalPrice?: number;
  savings?: number;
  features: string[];
}

interface PricingCardProps {
  plan: Plan;
  isLoading: boolean;
  onPurchase: () => void;
}

export default function PricingCard({
  plan,
  isLoading,
  onPurchase,
}: PricingCardProps) {
  const hasDiscount = plan.savings && plan.savings > 0;

  return (
    <div
      className={`border rounded-lg overflow-hidden flex flex-col w-96 ${
        hasDiscount
          ? "border-green-a6 bg-green-a1 shadow-lg"
          : "border-gray-a6 bg-gray-a2"
      }`}
    >
      {/* Badge Placeholder - Same height for both */}
      <div
        className={`px-4 py-2 text-center text-2 font-semibold ${
          hasDiscount
            ? "bg-green-9 text-white"
            : "bg-transparent text-transparent"
        }`}
      >
        {hasDiscount ? `Save $${plan.savings}` : "placeholder"}
      </div>

      {/* Header */}
      <div className="p-6 border-b border-gray-a6">
        <h3 className="text-4 font-bold text-gray-12 mb-1">{plan.name}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-7 font-bold text-gray-12">${plan.price}</span>
          <span className="text-3 text-gray-11">/{plan.period}</span>
        </div>

        {/* Savings Display */}
        {hasDiscount && plan.originalPrice && (
          <p className="text-2 text-gray-11 mb-3">
            Save{" "}
            <span className="font-semibold text-green-11">${plan.savings}</span>{" "}
            vs monthly billing
          </p>
        )}

        {/* Free Trial Badge */}
        <p className="text-2 font-semibold text-blue-11">✨ 5-Day Free Trial</p>
      </div>

      {/* Features */}
      <div className="flex-1 p-6 space-y-3">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <CheckIcon className="w-5 h-5 text-green-9 flex-shrink-0 mt-0.5" />
            <span className="text-3 text-gray-11">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-6 border-t border-gray-a6">
        <Button
          size="2"
          onClick={onPurchase}
          disabled={isLoading}
          className="w-full cursor-pointer"
        >
          {isLoading ? "Processing..." : "Start Free Trial"}
        </Button>
        <p className="text-1 text-gray-10 text-center mt-2">
          Then ${plan.price}/{plan.period}
        </p>
      </div>
    </div>
  );
}
