"use client";

import { useState, useEffect, useRef } from "react";
import LeagueProgress from "./LeagueProgress";
import ChatInterface from "./ChatInterface";
import { LeagueWithTiers, MemberWithTier, SimpleTier } from "@/types";
import { recordSessionTime } from "@/actions/point-actions";
import { InfoIcon, X } from "lucide-react";

interface MemberViewProps {
  member: MemberWithTier;
  league: LeagueWithTiers;
  userName: string;
  memberId: string;
}

export default function MemberView({
  member,
  league,
  userName,
  memberId,
}: MemberViewProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    member.currentTier?.id || league.tiers[0]?.id || null
  );
  const sessionStartTime = useRef<Date>(new Date());
  const sessionRecorded = useRef(false);
  const [showScoresInfo, setShowScoresInfo] = useState(false);
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

  // Track session time
  useEffect(() => {
    const checkSessionTime = setInterval(() => {
      const now = new Date();
      const minutesSpent = Math.floor(
        (now.getTime() - sessionStartTime.current.getTime()) / (1000 * 60)
      );

      // Award points after 5 minutes (once per session)
      if (minutesSpent >= 5 && !sessionRecorded.current) {
        sessionRecorded.current = true;
        recordSessionTime(memberId, minutesSpent);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkSessionTime);
  }, [memberId]);

  return (
    <div className="min-h-screen bg-gray-a1">
      {/* How Scores Work Dialog */}
      {showScoresInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-2 border-0 sm:border border-gray-a6 rounded-none sm:rounded-lg max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-2 border-b border-gray-a6 p-4 flex items-center justify-between z-10">
              <h2 className="text-4 md:text-5 font-bold text-gray-12">
                How Points Work
              </h2>
              <button
                onClick={() => setShowScoresInfo(false)}
                className="p-2 hover:bg-gray-a3 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-11" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div>
                <p className="text-3 text-gray-11 leading-relaxed mb-4">
                  Earn points by being active in the community and climb through
                  the tiers to unlock exclusive content and rewards.
                </p>
              </div>

              {/* Daily Activities */}
              <div className="bg-gray-a3 border border-gray-a6 rounded-lg p-4">
                <h3 className="text-3 md:text-4 font-semibold text-gray-12 mb-3">
                  📅 Daily Activities
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-3 font-medium text-gray-12">
                      Daily Check-In
                    </p>
                    <p className="text-2 text-gray-11">
                      Visit the community once per day to earn points. The more
                      consistent you are, the more you earn!
                    </p>
                  </div>

                  <div>
                    <p className="text-3 font-medium text-gray-12">
                      Reading Messages
                    </p>
                    <p className="text-2 text-gray-11">
                      Earn points by reading messages in your accessible tier
                      chats. Stay engaged with the community content.
                    </p>
                  </div>

                  <div>
                    <p className="text-3 font-medium text-gray-12">
                      Active Sessions
                    </p>
                    <p className="text-2 text-gray-11">
                      Spend at least 5 minutes exploring the community to earn
                      bonus points. Quality time matters!
                    </p>
                  </div>
                </div>
              </div>

              {/* Streak Bonuses */}
              <div className="bg-gradient-to-br from-blue-a2 to-purple-a2 border border-blue-a6 rounded-lg p-4">
                <h3 className="text-3 md:text-4 font-semibold text-gray-12 mb-3">
                  🔥 Streak Bonuses
                </h3>

                <p className="text-3 text-gray-11 mb-3">
                  Keep your check-in streak alive to earn massive bonus points!
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2 font-medium text-gray-12">
                      7-Day Streak:
                    </span>
                    <span className="text-2 text-blue-11">Extra bonus!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2 font-medium text-gray-12">
                      14-Day Streak:
                    </span>
                    <span className="text-2 text-purple-11">
                      Even bigger bonus!
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2 font-medium text-gray-12">
                      30-Day Streak:
                    </span>
                    <span className="text-2 text-orange-11">
                      Huge bonus reward!
                    </span>
                  </div>
                </div>

                <p className="text-2 text-gray-11 mt-3">
                  ⚠️ Missing a day resets your streak to 1, so stay consistent!
                </p>
              </div>

              {/* Tier Progression */}
              <div className="bg-gray-a3 border border-gray-a6 rounded-lg p-4">
                <h3 className="text-3 md:text-4 font-semibold text-gray-12 mb-3">
                  🎯 Tier Progression
                </h3>

                <p className="text-3 text-gray-11 mb-3">
                  As you earn points, you'll automatically move up tiers and
                  unlock access to more exclusive content:
                </p>

                <div className="space-y-2">
                  {league.tiers
                    .sort((a, b) => a.order - b.order)
                    .map((tier) => (
                      <div
                        key={tier.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          member.currentTier?.id === tier.id
                            ? "bg-blue-a3 border border-blue-a6"
                            : "bg-gray-a2"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tier.icon && (
                            <span className="text-2">{tier.icon}</span>
                          )}
                          <span className="text-2 font-medium text-gray-12">
                            {tier.name}
                          </span>
                          {member.currentTier?.id === tier.id && (
                            <span className="text-1 text-blue-11 font-semibold">
                              (Current)
                            </span>
                          )}
                        </div>
                        <span className="text-2 text-gray-11">
                          {tier.minScore} pts
                        </span>
                      </div>
                    ))}
                </div>

                <p className="text-2 text-gray-11 mt-3">
                  💡 You have access to all tiers at or below your current tier!
                </p>
              </div>

              {/* Tips */}
              <div className="bg-green-a2 border border-green-a6 rounded-lg p-4">
                <h3 className="text-3 md:text-4 font-semibold text-gray-12 mb-3">
                  💡 Pro Tips
                </h3>

                <ul className="space-y-2 text-3 text-gray-11">
                  <li>✓ Check in daily to build your streak</li>
                  <li>✓ Read messages regularly to stay updated</li>
                  <li>✓ Spend quality time exploring the community</li>
                  <li>✓ Never miss a day to keep your streak alive</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-2 border-t border-gray-a6 p-4">
              <button
                onClick={() => setShowScoresInfo(false)}
                className="w-full py-2 px-4 bg-blue-9 hover:bg-blue-10 text-white rounded-lg font-medium transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Welcome Section */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-5 md:text-7 font-bold mb-2">
            Welcome, {userName}!
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-3 text-gray-11">
              Your score:{" "}
              <span className="font-semibold">{member.totalScore}</span>
            </p>
            <button
              className="flex items-center gap-1 text-3 text-gray-11 hover:underline cursor-pointer w-fit"
              onClick={() => {
                setShowScoresInfo(true);
              }}
            >
              <span>How scores work?</span>
              <InfoIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content - Stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* League Progress Sidebar */}
          <div className="lg:w-80 xl:w-96">
            <LeagueProgress
              league={league}
              member={member}
              accessibleTiers={accessibleTiers}
              selectedTierId={selectedTierId}
              onSelectTier={setSelectedTierId}
            />
          </div>

          {/* Chat Interface */}
          <div className="flex-1 min-h-[500px] lg:min-h-0">
            {displayTier ? (
              <ChatInterface
                tier={displayTier}
                member={member}
                accessibleTiers={accessibleTiers}
                selectedTierId={selectedTierId}
                onSelectTier={setSelectedTierId}
                memberId={memberId}
              />
            ) : (
              <div className="bg-gray-a2 border border-gray-a6 rounded-xl p-8 text-center">
                <p className="text-gray-11">No tiers available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
