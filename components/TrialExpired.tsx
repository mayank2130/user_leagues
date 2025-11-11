"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@whop/react/components";

interface TrialExpiredProps {
  isAdmin: boolean;
  communityName: string;
}

export default function TrialExpired({
  isAdmin,
  communityName,
}: TrialExpiredProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-a1 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {isAdmin ? "Trial Period Ended" : "Access Locked"}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
            {isAdmin
              ? "Your 5-day free trial has expired. Choose a plan to continue building your engaged community."
              : `The free trial for ${communityName} has ended. Contact the admin to continue accessing exclusive content.`}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <div className="max-w-6xl mx-auto px-4">
          {/* Pricing Cards */}
          <div className="flex flex-col justify-center gap-6 mb-12 flex-wrap items-center">
            <Button
              variant="classic"
              className="cursor-pointer"
              onClick={() => router.push("/pricing")}
            >
              Purchase Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-gray-a2 rounded-xl border border-gray-a6 p-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm mb-6">
              <Lock className="w-4 h-4" />
              <span>Content is currently unavailable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
