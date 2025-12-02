"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@whop/react/components";
import CreateTierForm from "@/components/admin/CreateTierForm";
import {
  getLeague,
  getTierMembers,
  getTiers,
  deleteTier,
} from "@/actions/admin-actions";
import { getUnreadCounts } from "@/actions/support-actions";
import { League, Tier } from "@prisma/client";
import EditLeagueForm from "@/components/admin/EditLeagueForm";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Menu, X, Loader2, Trash2 } from "lucide-react";
import AdminTierChat from "./AdminTierChat";
import TierSettings from "./TierSettings";
import LeaguesInfo from "./LeaguesInfo";
import TierSupport from "./TierSupport";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AlertDialog from "@/components/ui/AlertDialog";

interface MemberInfo {
  id: string;
  name: string;
  score: number;
}

interface AdminDashboardProps {
  params: { communityId: string; experienceId: string };
  trialDaysRemaining?: number;
  trialActive?: boolean;
  adminMemberId: string;
}

export default function AdminDashboard({
  params,
  trialDaysRemaining = 5,
  trialActive = true,
  adminMemberId,
}: AdminDashboardProps) {
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showCreateTier, setShowCreateTier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditLeague, setShowEditLeague] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [tierMembers, setTierMembers] = useState<Record<string, MemberInfo[]>>(
    {}
  );
  const [loadingMembers, setLoadingMembers] = useState<Record<string, boolean>>(
    {}
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<
    Record<string, { tickets: number; feedback: number }>
  >({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "success" | "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
  });

  const fetchUnreadCounts = useCallback(async () => {
    const result = await getUnreadCounts(params.communityId);
    if (result.success) {
      setUnreadCounts(result.counts);
    }
  }, [params.communityId]);

  useEffect(() => {
    const initParams = async () => {
      const result = await getLeague(params.communityId);
      if (result.success && result.league) {
        setSelectedLeague(result.league);
        const tiersResult = await getTiers(result.league.id);
        if (tiersResult.success) {
          const loadedTiers = tiersResult.tiers || [];
          setTiers(loadedTiers);
          if (loadedTiers.length > 0) {
            setSelectedTier(loadedTiers[0]);
          }
        }
      }
      // Fetch unread counts
      await fetchUnreadCounts();
      setLoading(false);
    };
    initParams();
  }, [params, fetchUnreadCounts]);

  const handleGetTierMembers = async (tierId: string) => {
    if (!tierMembers[tierId]) {
      setLoadingMembers((prev) => ({ ...prev, [tierId]: true }));
      const result = await getTierMembers(tierId);
      if (result.success) {
        setTierMembers((prev) => ({
          ...prev,
          [tierId]: result.members,
        }));
      }
      setLoadingMembers((prev) => ({ ...prev, [tierId]: false }));
    }
  };

  const handleLeagueCreated = async () => {
    setShowCreateLeague(false);
    const result = await getLeague(params.communityId);
    if (result.success && result.league) {
      setSelectedLeague(result.league);
      const tiersResult = await getTiers(result.league.id);
      if (tiersResult.success) {
        const loadedTiers = tiersResult.tiers || [];
        setTiers(loadedTiers);
        if (loadedTiers.length > 0 && !selectedTier) {
          setSelectedTier(loadedTiers[0]);
        }
      }
    }
  };

  const handleTierDeleted = async () => {
    if (selectedLeague) {
      const result = await getTiers(selectedLeague.id);
      if (result.success) {
        const loadedTiers = result.tiers || [];
        setTiers(loadedTiers);
        if (
          selectedTier &&
          !loadedTiers.find((t) => t.id === selectedTier.id)
        ) {
          setSelectedTier(loadedTiers.length > 0 ? loadedTiers[0] : null);
        }
      }
    }
  };

  const handleTierCreated = async () => {
    setShowCreateTier(false);
    if (selectedLeague) {
      const result = await getTiers(selectedLeague.id);
      if (result.success) {
        const loadedTiers = result.tiers || [];
        setTiers(loadedTiers);
        if (loadedTiers.length > 0) {
          setSelectedTier(loadedTiers[loadedTiers.length - 1]);
        }
      }
    }
  };

  const handleTierSelect = (tier: Tier) => {
    setSelectedTier(tier);
    setSidebarOpen(false);
    if (showMembers) {
      handleGetTierMembers(tier.id);
    }
  };

  const handleDeleteTier = async () => {
    if (!selectedTier) return;
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTier = async () => {
    if (!selectedTier) return;

    setDeleteLoading(true);
    try {
      const result = await deleteTier(selectedTier.id);

      if (result.success) {
        // Refresh tiers list
        await handleTierDeleted();
        setDeleteConfirmOpen(false);
        setAlertDialog({
          isOpen: true,
          title: "Success",
          message: "Tier deleted successfully!",
          variant: "success",
        });
      } else {
        setDeleteConfirmOpen(false);
        setAlertDialog({
          isOpen: true,
          title: "Error",
          message: result.error || "Failed to delete tier",
          variant: "danger",
        });
      }
    } catch (error) {
      console.error("Error deleting tier:", error);
      setDeleteConfirmOpen(false);
      setAlertDialog({
        isOpen: true,
        title: "Error",
        message: "Failed to delete tier",
        variant: "danger",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gray-12 mx-auto mb-3" />
          <p className="mt-4 text-gray-11 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden pb-10">
      {/* Header */}
      {trialActive && (
        <div className="bg-blue-a2 border-b border-blue-a6 px-6 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <p className="text-2 text-blue-11">
              <span className="font-semibold">Chat Tiers is now Free!</span>
            </p>

            {/* <p className="text-2 text-blue-11">
              <span className="font-semibold">Free Trial Active</span> -{" "}
              {trialDaysRemaining} days remaining
            </p>
            <div className="w-32 h-2 bg-blue-a3 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-9 transition-all"
                style={{ width: `${(trialDaysRemaining / 5) * 100}%` }}
              />
            </div> */}
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-1 border-r border-gray-a6 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Sidebar Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* League Name Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-11 uppercase tracking-wider mb-2">
                League
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-a3 rounded"
              >
                <X className="w-5 h-5 text-gray-12 mb-2" />
              </button>
            </div>
            {selectedLeague ? (
              <div className="rounded-lg px-3 py-2 border border-gray-a6 shadow-sm shadow-white bg-gray-a2 flex items-center justify-between">
                <span className="text-2 font-medium text-gray-12 truncate">
                  {selectedLeague.name}
                </span>
                <button
                  onClick={() => {
                    setShowEditLeague(true);
                    setSidebarOpen(false);
                  }}
                  className="cursor-pointer flex-shrink-0 ml-2"
                >
                  <Pencil className="w-4 h-4 text-gray-12" />
                </button>
              </div>
            ) : (
              <Button
                size="2"
                onClick={() => {
                  setShowCreateLeague(true);
                  setSidebarOpen(false);
                }}
                className="bg-blue-a3 hover:bg-blue-a4 text-white w-full cursor-pointer"
              >
                Create League
              </Button>
            )}
          </div>

          {/* Tiers Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-11 uppercase tracking-wider">
                Tiers
              </h3>
              {selectedLeague && (
                <Button
                  onClick={() => {
                    setShowCreateTier(true);
                    setSidebarOpen(false);
                  }}
                  size="1"
                  className="cursor-pointer bg-green-a3 hover:bg-green-a4 text-white p-1"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {tiers.length > 0 ? (
                tiers.map((tier) => {
                  const unreadCount = unreadCounts[tier.id];
                  const hasUnread =
                    unreadCount &&
                    (unreadCount.tickets > 0 || unreadCount.feedback > 0);
                  const totalUnread = hasUnread
                    ? unreadCount.tickets + unreadCount.feedback
                    : 0;

                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleTierSelect(tier)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-2 font-medium transition-colors relative ${
                        selectedTier?.id === tier.id
                          ? "bg-blue-a3 text-white"
                          : "bg-gray-a3 text-gray-11 hover:bg-gray-a4"
                      }`}
                    >
                      {tier.name}
                      {hasUnread && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-9 text-white text-[10px] font-bold rounded-full px-1">
                          {totalUnread}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-gray-11 px-3 py-2">No tiers yet</p>
              )}
            </div>
          </div>

          {/* Leagues Info Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-11 uppercase tracking-wider mb-4">
              Information
            </h3>
            <LeaguesInfo communityId={params.communityId} />
          </div>
        </div>
      </aside>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <Button
                size="2"
                className="lg:hidden bg-gray-a2 hover:bg-gray-a3 text-gray-12 cursor-pointer p-2 flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-6 sm:text-7 md:text-9 font-bold text-gray-12">
                  Admin Dashboard
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-11">
                  Manage leagues, tiers, and community members
                </p>
              </div>
            </div>
            {/* <Button
              size="2"
              className="bg-blue-a4 hover:bg-blue-a5 text-white cursor-pointer w-full sm:w-auto"
              onClick={() => router.push("/pricing")}
            >
              Get Premium
            </Button> */}
          </div>
          {!selectedLeague && !showCreateLeague && (
            <Button
              size="2"
              onClick={() => setShowCreateLeague(true)}
              className="bg-blue-a3 hover:bg-blue-a4 text-white w-full sm:w-auto mt-4"
            >
              Create League
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* League Name & Tier Tabs - Desktop Layout (hidden on mobile) */}
        <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-1 border-gray-a6 mb-3 md:mb-5 pb-0 border-b">
          {/* League Name */}
          <div className="rounded-none px-2 sm:px-3.5 py-1.5 text-xs sm:text-2 font-medium whitespace-nowrap transition-colors border shadow-sm shadow-white border-gray-a6 flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEditLeague(!showEditLeague)}
              className="cursor-pointer flex-shrink-0 flex flex-row items-center gap-3"
            >
              <span className="max-w-[200px] sm:max-w-none truncate">
                {selectedLeague?.name}
              </span>
              <Pencil className="w-3 h-3 sm:w-4 sm:h-4 text-gray-12" />
            </button>
          </div>

          {/* Tier Tabs */}
          <div className="flex flex-row items-center gap-1 overflow-x-auto scrollbar-hide w-full sm:w-auto mt-1.5">
            {tiers.length > 0 &&
              tiers.map((tier) => {
                const unreadCount = unreadCounts[tier.id];
                const hasUnread =
                  unreadCount &&
                  (unreadCount.tickets > 0 || unreadCount.feedback > 0);
                const totalUnread = hasUnread
                  ? unreadCount.tickets + unreadCount.feedback
                  : 0;

                return (
                  <Button
                    onClick={() => handleTierSelect(tier)}
                    className={`rounded-tl-lg rounded-tr-lg rounded-none sm:-mb-0.5 px-2 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-2 cursor-pointer whitespace-nowrap flex-shrink-0 relative ${
                      selectedTier?.id === tier.id
                        ? "bg-blue-a3 hover:bg-blue-a4 text-white"
                        : "bg-gray-a3 hover:bg-gray-a4 text-gray-11"
                    }`}
                    key={tier.id}
                  >
                    {tier.name}
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-red-9 text-white text-[9px] font-bold rounded-full px-1 border border-gray-1">
                        {totalUnread}
                      </span>
                    )}
                  </Button>
                );
              })}
            {selectedLeague && (
              <Button
                onClick={() => setShowCreateTier(true)}
                title="Create Tier"
                className="rounded-tl-lg rounded-tr-lg rounded-none sm:-mb-0.5 px-1.5 sm:px-2 py-1 sm:py-1.5 cursor-pointer bg-green-a3 hover:bg-green-a4 text-white flex-shrink-0"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
          <div className="hidden sm:block sm:ml-auto">
            <LeaguesInfo communityId={params.communityId} />
          </div>
        </div>

        {/* Edit League Modal */}
        {showEditLeague && selectedLeague && (
          <EditLeagueForm
            isOpen={showEditLeague}
            leagueId={selectedLeague.id}
            communityId={params.communityId}
            experienceId={params.experienceId}
            initialName={selectedLeague.name}
            initialDescription={selectedLeague.description}
            onSuccess={() => {
              setShowEditLeague(false);
              handleLeagueCreated();
            }}
            onCancel={() => setShowEditLeague(false)}
          />
        )}

        {/* Create League Modal */}
        {showCreateLeague && (
          <EditLeagueForm
            isOpen={showCreateLeague}
            communityId={params.communityId}
            experienceId={params.experienceId}
            onSuccess={() => {
              setShowCreateLeague(false);
              handleLeagueCreated();
            }}
            onCancel={() => setShowCreateLeague(false)}
          />
        )}

        {/* Create Tier Modal */}
        {showCreateTier && selectedLeague && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowCreateTier(false)}
          >
            <div
              className="bg-gray-1 border border-gray-a6 rounded-lg shadow-xl w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <CreateTierForm
                leagueId={selectedLeague.id}
                onSuccess={handleTierCreated}
                onCancel={() => setShowCreateTier(false)}
              />
            </div>
          </div>
        )}

        <div className="gap-4 md:gap-6 max-w-7xl mx-auto">
          {/* Only show tier content if a tier is selected */}
          {selectedTier ? (
            <>
              {/* Tier Content Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 py-3 md:py-5">
                <div className="flex flex-row items-center gap-1 border border-gray-a6 bg-gray-a2 rounded-lg p-1 w-full sm:w-auto mb-3 md:mb-5">
                  <Button
                    size="2"
                    className={`text-xs sm:text-sm font-medium cursor-pointer flex-1 sm:flex-none ${
                      showChat
                        ? "bg-blue-a3 text-white"
                        : "bg-transparent text-gray-11"
                    }`}
                    onClick={() => {
                      setShowChat(true);
                      setShowSettings(false);
                      setShowMembers(false);
                    }}
                  >
                    Chat
                  </Button>
                  <Button
                    size="2"
                    className={`text-xs sm:text-sm font-medium cursor-pointer flex-1 sm:flex-none ${
                      showSettings
                        ? "bg-blue-a3 text-white"
                        : "bg-transparent text-gray-11"
                    }`}
                    onClick={() => {
                      setShowSettings(true);
                      setShowChat(false);
                      setShowMembers(false);
                    }}
                  >
                    Manage
                  </Button>
                  <Button
                    size="2"
                    className={`text-xs sm:text-sm font-medium cursor-pointer flex-1 sm:flex-none ${
                      showMembers
                        ? "bg-blue-a3 text-white"
                        : "bg-transparent text-gray-11"
                    }`}
                    onClick={() => {
                      setShowMembers(true);
                      setShowSettings(false);
                      setShowChat(false);
                      if (selectedTier) {
                        handleGetTierMembers(selectedTier.id);
                      }
                    }}
                  >
                    Members
                  </Button>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <p className="text-xs sm:text-sm font-medium text-gray-11 text-left sm:text-right">
                    Unlocks at:{" "}
                    <span className="font-semibold">
                      {selectedTier.minScore}
                    </span>{" "}
                    points
                  </p>
                  <Button
                    size="1"
                    variant="surface"
                    onClick={handleDeleteTier}
                    className="cursor-pointer bg-red-a3 hover:bg-red-a4 text-red-11 hover:text-red-12 border-red-a6"
                    title="Delete tier"
                  >
                    Delete Tier
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              {/* Tier Content Display */}
              <div className="rounded-lg border border-gray-a6 shadow-sm overflow-hidden">
                {showChat && (
                  <AdminTierChat
                    tierId={selectedTier.id}
                    tiers={tiers}
                    onMessageSent={handleTierDeleted}
                    adminMemberId={adminMemberId}
                  />
                )}

                {showSettings && (
                  <div className="p-4 md:p-6 space-y-6">
                    <TierSettings
                      tier={selectedTier}
                      onTierDeleted={handleTierDeleted}
                    />
                    <div className="border-t border-gray-a6 pt-6">
                      <TierSupport
                        tierId={selectedTier.id}
                        communityId={params.communityId}
                        onViewed={fetchUnreadCounts}
                      />
                    </div>
                  </div>
                )}

                {showMembers && (
                  <div className="p-4 md:p-6">
                    {loadingMembers[selectedTier.id] ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-xs sm:text-2 text-gray-11">
                          Loading members...
                        </p>
                      </div>
                    ) : tierMembers[selectedTier.id] &&
                      tierMembers[selectedTier.id].length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {tierMembers[selectedTier.id].map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between border border-gray-a6 bg-gray-a2 p-2 sm:p-3 rounded-lg hover:bg-gray-a3 transition-colors"
                          >
                            <span className="text-2 sm:text-3 font-medium text-gray-12 truncate">
                              {member.name}
                            </span>
                            <span className="text-2 sm:text-3 font-semibold text-blue-11 ml-2 whitespace-nowrap">
                              {member.score} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-2 sm:text-3 text-gray-11">
                          No members in this tier yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : selectedLeague ? (
            <div className="text-center py-8 sm:py-12 border border-gray-a6 rounded-lg bg-gray-a2 mx-2 sm:mx-0">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-11 font-medium text-sm sm:text-base px-4">
                No tiers created yet
              </p>
              <p className="text-xs sm:text-sm text-gray-11 mt-1 px-4">
                Click the + button above to create your first tier
              </p>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 border border-gray-a6 rounded-lg bg-gray-a2 mx-2 sm:mx-0">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-11 font-medium text-sm sm:text-base px-4">
                No league created yet
              </p>
              <p className="text-xs sm:text-sm text-gray-11 mt-1 px-4">
                Create a league first to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Delete Tier */}
      {selectedTier && (
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDeleteTier}
          title="Delete Tier"
          message={`Are you sure you want to delete the "${selectedTier.name}" tier?.`}
          confirmText="Delete Tier"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteLoading}
        />
      )}

      {/* Alert Dialog for Success/Error Messages */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  );
}
