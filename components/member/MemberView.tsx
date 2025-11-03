"use client";

import { useState } from "react";
import LeagueProgress from "./LeagueProgress";
import ChatInterface from "./ChatInterface";
import { LeagueWithTiers, MemberWithTier, SimpleTier } from "@/types";
import { League } from "@prisma/client";

interface MemberViewProps {
  member: MemberWithTier;
  league: LeagueWithTiers;
  userName: string;
}

export default function MemberView({
  member,
  league,
  userName,
}: MemberViewProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    member.currentTier?.id || league.tiers[0]?.id || null
  );

  const currentTierOrder = member.currentTier?.order ?? -1;

  // Members can access their current tier and all tiers below it
  const accessibleTiers: SimpleTier[] = league.tiers
    .filter((t) => t.order <= currentTierOrder)
    .map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      minScore: t.minScore,
      order: t.order,
      color: t.color,
      icon: t.icon,
    }));

  const displayTier = selectedTierId
    ? league.tiers.find((t) => t.id === selectedTierId)
    : member.currentTier
    ? league.tiers.find((t) => t.id === member?.currentTier?.id)
    : league.tiers[0] || null;

  return (
    <div className="min-h-screen bg-gray-a1">
      {/* Header */}
      <div className="flex flex-row justify-center items-center gap-6 p-6">
        <div className="flex flex-col gap-6 p-6">
          {/* League Progress Sidebar */}
          <div className="border-b border-gray-a6 p-6">
            <h1 className="text-7 font-bold mb-2">Welcome, {userName}!</h1>
            <p className="text-3 text-gray-11">
              Your current score:{" "}
              <span className="font-semibold">{member.totalScore}</span>
            </p>
          </div>

          <div className="">
            <LeagueProgress
              league={league}
              member={member}
              accessibleTiers={accessibleTiers}
              selectedTierId={selectedTierId}
              onSelectTier={setSelectedTierId}
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1">
          {displayTier ? (
            <ChatInterface
              tier={displayTier}
              member={member}
              accessibleTiers={accessibleTiers}
              selectedTierId={selectedTierId}
              onSelectTier={setSelectedTierId}
            />
          ) : (
            <div className="bg-gray-a2 border border-gray-a6 rounded-xl p-8 text-center">
              <p className="text-gray-11">No tiers available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
