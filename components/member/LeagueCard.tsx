"use client";

import { LeagueWithTiers } from "@/types";

interface LeagueCardProps {
  league: LeagueWithTiers;
  progress?: any;
  isSelected: boolean;
  onSelect: () => void;
}

export default function LeagueCard({
  league,
  progress,
  isSelected,
  onSelect,
}: LeagueCardProps) {
  const currentTier = progress?.currentTier;
  const currentScore = progress?.score || 0;

  // Find next tier
  const sortedTiers = [...league.tiers].sort((a, b) => a.order - b.order);
  const currentTierOrder = currentTier?.order ?? -1;
  const nextTier = sortedTiers.find((t) => t.order > currentTierOrder);

  const scoreToNext = nextTier ? nextTier.minScore - currentScore : 0;
  const progressPercent = nextTier
    ? Math.min(
        ((currentScore -
          (currentTier
            ? league.tiers.find((t) => t.id === currentTier.id)?.minScore || 0
            : 0)) /
          (nextTier.minScore -
            (currentTier
              ? league.tiers.find((t) => t.id === currentTier.id)?.minScore || 0
              : 0))) *
          100,
        100
      )
    : 100;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-gray-a2 border rounded-xl p-4 transition-all hover:scale-[1.02] ${
        isSelected ? "border-blue-9 shadow-lg" : "border-gray-a6"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-4 font-semibold">{league.name}</h3>
          {currentTier && (
            <p className="text-2 text-gray-11">
              {currentTier.icon} {currentTier.name}
            </p>
          )}
        </div>
        <span className="text-3 font-bold text-blue-11">{currentScore}</span>
      </div>

      {nextTier && (
        <>
          <div className="w-full bg-gray-a4 rounded-full h-2 mb-2">
            <div
              className="bg-blue-9 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-1 text-gray-11">
            {scoreToNext} points to {nextTier.name}
          </p>
        </>
      )}
    </button>
  );
}
