"use client";

import { useEffect } from "react";
import { TierWithMessages, MemberWithTier, SimpleTier } from "@/types";
import { recordMessageRead } from "@/actions/point-actions";

interface ChatInterfaceProps {
  tier: TierWithMessages;
  member: MemberWithTier;
  accessibleTiers: SimpleTier[];
  selectedTierId: string | null;
  onSelectTier: (tierId: string) => void;
  memberId: string;
}

export default function ChatInterface({
  tier,
  member,
  accessibleTiers,
  selectedTierId,
  onSelectTier,
  memberId,
}: ChatInterfaceProps) {
  // Track message views automatically
  useEffect(() => {
    if (tier.messages.length > 0) {
      // Record read for the first 5 unread messages when tier is loaded
      const messagesToMark = tier.messages.slice(0, 5);
      messagesToMark.forEach((message) => {
        recordMessageRead(memberId, message.id);
      });
    }
  }, [tier.id, memberId]);

  return (
    <div className="bg-gray-a2 border border-gray-a6 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
      {/* Tier Tabs */}
      <div className="border-b border-gray-a6 p-4 flex gap-2 overflow-x-auto">
        {accessibleTiers.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTier(t.id)}
            className={`px-4 py-2 rounded-lg text-2 font-medium whitespace-nowrap transition-colors ${
              selectedTierId === t.id
                ? "bg-blue-9 text-white"
                : "bg-gray-a3 text-gray-11 hover:bg-gray-a4"
            }`}
            style={
              selectedTierId === t.id && t.color
                ? { backgroundColor: t.color }
                : {}
            }
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tier.messages.length > 0 ? (
          tier.messages.map((message) => (
            <div
              key={message.id}
              className="bg-gray-a3 rounded-lg p-4 border border-gray-a6"
            >
              {message.isPinned && (
                <div className="flex items-center gap-2 mb-2 text-yellow-11">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                  </svg>
                  <span className="text-1 font-medium">Pinned</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-9 rounded-full flex items-center justify-center text-white font-semibold text-2">
                  {message.author.name?.[0] || "A"}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-3">
                      {message.author.name || "Admin"}
                    </span>
                    <span className="text-1 text-gray-11">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-3 text-gray-12">{message.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-11">No messages in this tier yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
