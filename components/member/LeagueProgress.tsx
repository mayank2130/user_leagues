"use client";

import { MemberWithTier, SimpleTier, LeagueWithTiers } from "@/types";

interface LeagueProgressProps {
  league: LeagueWithTiers;
  member: MemberWithTier;
  accessibleTiers: SimpleTier[];
  selectedTierId: string | null;
  onSelectTier: (tierId: string) => void;
}

export default function LeagueProgress({
  league,
  member,
  accessibleTiers,
  selectedTierId,
  onSelectTier,
}: LeagueProgressProps) {
  const currentTierOrder = member.currentTier?.order ?? -1;
  const currentTierData = league.tiers.find(
    (t) => t.order === currentTierOrder
  );
  const nextTier = league.tiers.find((t) => t.order === currentTierOrder + 1);

  const scoreToNext = nextTier ? nextTier.minScore - member.totalScore : 0;
  const progressPercent = nextTier
    ? Math.min(
        ((member.totalScore - (currentTierData?.minScore || 0)) /
          (nextTier.minScore - (currentTierData?.minScore || 0))) *
          100,
        100
      )
    : 100;

  return (
    <div className="space-y-6">
      {/* Current Tier Info */}
      <div className="bg-gray-a2 border border-gray-a6 rounded-lg p-6">
        <h2 className="text-4 font-semibold mb-4">Your Progress</h2>

        {member.currentTier ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              {member.currentTier.icon && (
                <span className="text-5">{member.currentTier.icon}</span>
              )}
              <div>
                <p className="text-2 text-gray-11">Current Tier</p>
                <p className="text-4 font-bold">{member.currentTier.name}</p>
              </div>
            </div>

            <p className="text-3 font-semibold mb-2">
              Score: <span className="text-blue-11">{member.totalScore}</span>
            </p>

            {nextTier && (
              <>
                <div className="w-full bg-gray-a4 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-9 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-2 text-gray-11">
                  {scoreToNext} points to {nextTier.name}
                </p>
              </>
            )}
          </>
        ) : (
          <p className="text-gray-11">Unranked</p>
        )}
      </div>

      {/* Accessible Tiers */}
      <div className="bg-gray-a2 border border-gray-a6 rounded-lg p-6">
        <h2 className="text-4 font-semibold mb-4">Available Tiers</h2>

        {accessibleTiers && accessibleTiers.length > 0 ? (
          <div className="space-y-2">
            {accessibleTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => onSelectTier(tier.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTierId === tier.id
                    ? "bg-blue-a3 border-blue-9"
                    : "bg-gray-a3 border-gray-a6 hover:border-blue-9"
                }`}
              >
                <div className="flex items-center gap-2">
                  {tier.icon && <span className="text-3">{tier.icon}</span>}
                  <div>
                    <p className="text-3 font-semibold">{tier.name}</p>
                    <p className="text-2 text-gray-11">
                      {tier.minScore} points required
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-11">No accessible tiers</p>
        )}
      </div>
    </div>
  );
}
