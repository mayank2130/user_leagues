"use client";

import { useState, useRef, useEffect } from "react";
import { Tier, League } from "@prisma/client";
import {
  deleteTier,
  getTierMembers,
  updateTier,
} from "@/actions/admin-actions";
import { Button } from "@whop/react/components";
import {
  Loader2,
  MessageCircleIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import AdminTierChat from "./AdminTierChat";

interface MemberInfo {
  id: string;
  name: string;
  score: number;
}

interface TiersListProps {
  tiers: Tier[];
  selectedLeague: League | null;
  onTierDeleted: () => void;
}

export default function TiersList({
  tiers,
  selectedLeague,
  onTierDeleted,
}: TiersListProps) {
  const [expandedTierId, setExpandedTierId] = useState<string | null>(null);
  const [chatTierId, setChatTierId] = useState<string | null>(null);
  const [tierMembers, setTierMembers] = useState<Record<string, MemberInfo[]>>(
    {}
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [editFormData, setEditFormData] = useState<{
    name: string;
    minScore: number;
    order: number;
    icon: string;
  } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contentHeights, setContentHeights] = useState<Record<string, number>>(
    {}
  );

  // Calculate content height when members are loaded
  useEffect(() => {
    if (expandedTierId && contentRefs.current[expandedTierId]) {
      const height = contentRefs.current[expandedTierId]?.scrollHeight || 0;
      setContentHeights((prev) => ({ ...prev, [expandedTierId]: height }));
    }
  }, [expandedTierId, tierMembers]);

  const handleDelete = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this tier?")) return;

    setDeletingId(tierId);
    const result = await deleteTier(tierId);
    setDeletingId(null);

    if (result.success) {
      onTierDeleted();
    } else {
      alert(result.error);
    }
  };

  const handleStartEdit = (tier: Tier) => {
    setEditingId(tier.id);
    setEditFormData({
      name: tier.name,
      minScore: tier.minScore,
      order: tier.order,
      icon: tier.icon || "",
    });
  };

  const handleSaveEdit = async (tierId: string) => {
    if (!editFormData) return;

    setSavingId(tierId);
    const result = await updateTier(tierId, editFormData);
    setSavingId(null);

    if (result.success) {
      setEditingId(null);
      setEditFormData(null);
      onTierDeleted();
    } else {
      alert(result.error);
    }
  };

  const handleExpandTier = async (tierId: string) => {
    if (expandedTierId === tierId) {
      setExpandedTierId(null);
      setContentHeights((prev) => ({ ...prev, [tierId]: 0 }));
      return;
    }

    setExpandedTierId(tierId);

    // Only fetch if not already cached
    if (!tierMembers[tierId]) {
      setLoading((prev) => ({ ...prev, [tierId]: true }));
      const result = await getTierMembers(tierId);
      if (result.success) {
        setTierMembers((prev) => ({
          ...prev,
          [tierId]: result.members,
        }));
        // Set height after a tick to ensure DOM is updated
        setTimeout(() => {
          const height = contentRefs.current[tierId]?.scrollHeight || 0;
          setContentHeights((prev) => ({ ...prev, [tierId]: height }));
        }, 0);
      }
      setLoading((prev) => ({ ...prev, [tierId]: false }));
    } else {
      // If already cached, just calculate height
      const height = contentRefs.current[tierId]?.scrollHeight || 0;
      setContentHeights((prev) => ({ ...prev, [tierId]: height }));
    }
  };

  if (!selectedLeague) {
    return <p className="text-gray-11 text-3">Select a league first</p>;
  }

  if (tiers.length === 0) {
    return <p className="text-gray-11 text-3">No tiers yet</p>;
  }

  if (chatTierId) {
    return (
      <AdminTierChat
        tierId={chatTierId}
        tiers={tiers}
        onBack={() => setChatTierId(null)}
        onMessageSent={onTierDeleted}
      />
    );
  }
  return (
    <div className="space-y-3 p-6">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className="bg-gray-a3 border border-gray-a6 rounded-lg overflow-hidden"
        >
          {editingId === tier.id ? (
            // Edit Mode
            <div className="p-4 space-y-3">
              <input
                type="text"
                value={editFormData?.name || ""}
                onChange={(e) =>
                  setEditFormData((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
                placeholder="Tier name"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={editFormData?.minScore || 0}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev
                        ? { ...prev, minScore: parseInt(e.target.value) }
                        : null
                    )
                  }
                  className="px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
                  placeholder="Min score"
                />
                <input
                  type="number"
                  value={editFormData?.order || 0}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, order: parseInt(e.target.value) } : null
                    )
                  }
                  className="px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
                  placeholder="Order"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={editFormData?.icon || ""}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, icon: e.target.value } : null
                    )
                  }
                  className="px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
                  placeholder="Icon"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="2"
                  onClick={() => handleSaveEdit(tier.id)}
                  disabled={savingId === tier.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {savingId === tier.id ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="2"
                  variant="classic"
                  onClick={() => {
                    setEditingId(null);
                    setEditFormData(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Tier Header */}
              <button
                onClick={() => handleExpandTier(tier.id)}
                className="w-full text-left p-3 hover:bg-gray-a4 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tier.icon && <span className="text-3">{tier.icon}</span>}
                    <div>
                      <p className="text-3 font-semibold">{tier.name}</p>
                      <p className="text-2 text-gray-11">
                        Unlocks at: {tier.minScore} points
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatTierId(tier.id);
                      }}
                      className="px-2 py-1 text-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors cursor-pointer"
                      title="Chat"
                    >
                      <MessageCircleIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(tier);
                      }}
                      className="px-2 py-1 text-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tier.id);
                      }}
                      title="Delete"
                      disabled={deletingId === tier.id}
                      className="px-2 py-1 text-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === tier.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                    <svg
                      className={`w-4 h-4 text-gray-11 transition-transform duration-300 ${
                        expandedTierId === tier.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Members List - Animated Slide Down */}
              <div
                ref={(el) => {
                  if (el) contentRefs.current[tier.id] = el;
                }}
                style={{
                  maxHeight:
                    expandedTierId === tier.id
                      ? `${contentHeights[tier.id] || 0}px`
                      : "0px",
                  opacity: expandedTierId === tier.id ? 1 : 0,
                }}
                className="overflow-hidden transition-all duration-300 ease-out border-t border-gray-a6 bg-gray-a2"
              >
                <div className="p-3 max-h-80 overflow-y-auto">
                  {loading[tier.id] ? (
                    <p className="text-2 text-gray-11">Loading members...</p>
                  ) : tierMembers[tier.id] &&
                    tierMembers[tier.id].length > 0 ? (
                    <div className="space-y-2">
                      {tierMembers[tier.id].map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between border-l border-b border-gray-a6 p-2 rounded"
                        >
                          <span className="text-2 font-medium">
                            {member.name}
                          </span>
                          <span className="text-2 text-gray-11">
                            {member.score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-2 text-gray-11">
                      No members in this tier
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
