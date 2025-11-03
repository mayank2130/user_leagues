"use client";

import { useState, useEffect } from "react";
import { Button } from "@whop/react/components";
import TiersList from "@/components/admin/TiersList";
import CreateTierForm from "@/components/admin/CreateTierForm";
import { getLeague, getTiers } from "@/actions/admin-actions";
import { League, Tier } from "@prisma/client";
import EditLeagueForm from "@/components/admin/EditLeagueForm";
import LeagueInfo from "@/components/admin/LeaguesInfo";

interface AdminDashboardProps {
  params: { communityId: string; experienceId: string };
  trialDaysRemaining?: number;
  trialActive?: boolean;
}

export default function AdminDashboard({
  params,
  trialDaysRemaining = 5,
  trialActive = true,
}: AdminDashboardProps) {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showCreateTier, setShowCreateTier] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initParams = async () => {
      const result = await getLeague(params.communityId);
      if (result.success && result.league) {
        setSelectedLeague(result.league);
        const tiersResult = await getTiers(result.league.id);
        if (tiersResult.success) {
          setTiers(tiersResult.tiers || []);
        }
      }
      setLoading(false);
    };
    initParams();
  }, [params]);

  const handleLeagueCreated = async () => {
    setShowCreateLeague(false);
    const result = await getLeague(params.communityId);
    if (result.success && result.league) {
      setSelectedLeague(result.league);
      const tiersResult = await getTiers(result.league.id);
      if (tiersResult.success) {
        setTiers(tiersResult.tiers || []);
      }
    }
  };

  const handleTierDeleted = async () => {
    if (selectedLeague) {
      const result = await getTiers(selectedLeague.id);
      if (result.success) {
        setTiers(result.tiers || []);
      }
    }
  };

  const handleTierCreated = async () => {
    setShowCreateTier(false);
    if (selectedLeague) {
      const result = await getTiers(selectedLeague.id);
      if (result.success) {
        setTiers(result.tiers || []);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      {trialActive && (
        <div className="bg-blue-a2 border-b border-blue-a6 px-6 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <p className="text-2 text-blue-11">
              <span className="font-semibold">Free Trial Active</span> -{" "}
              {trialDaysRemaining} days remaining
            </p>
            <div className="w-32 h-2 bg-blue-a3 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-9 transition-all"
                style={{ width: `${(trialDaysRemaining / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="">
          <div className="flex flex-row items-center justify-between">
            <div className="">
              <h1 className="text-9 font-bold text-gray-12">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-11">
                Manage leagues, tiers, and community members
              </p>
            </div>
            <Button
              size="3"
              className="bg-blue-a4 hover:bg-blue-a5 text-white cursor-pointer"
            >
              Get Premium
            </Button>
          </div>
          {!selectedLeague && !showCreateLeague && (
            <Button
              size="2"
              onClick={() => setShowCreateLeague(true)}
              className="bg-blue-a3 hover:bg-blue-a4 text-white"
            >
              Create League
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="">
            {showCreateLeague ? (
              <div>
                <EditLeagueForm
                  communityId={params.communityId}
                  experienceId={params.experienceId}
                  onSuccess={handleLeagueCreated}
                  onCancel={() => setShowCreateLeague(false)}
                />
              </div>
            ) : selectedLeague ? (
              <div>
                <LeagueInfo
                  league={selectedLeague}
                  communityId={params.communityId}
                  onLeagueUpdate={handleLeagueCreated}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">No league created yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create one to get started
                </p>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tiers Section */}
            <div className="rounded-lg border border-gray-a6 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-a6 bg-gray-a2 flex items-center justify-between">
                <h2 className="font-semibold text-gray-12">
                  {selectedLeague ? `${selectedLeague.name} Tiers` : "Tiers"}
                </h2>
                {selectedLeague && !showCreateTier && (
                  <Button
                    size="2"
                    onClick={() => setShowCreateTier(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add Tier
                  </Button>
                )}
              </div>

              {selectedLeague ? (
                showCreateTier ? (
                  <CreateTierForm
                    leagueId={selectedLeague.id}
                    onSuccess={handleTierCreated}
                    onCancel={() => setShowCreateTier(false)}
                  />
                ) : (
                  <TiersList
                    tiers={tiers}
                    selectedLeague={selectedLeague}
                    onTierDeleted={handleTierDeleted}
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 text-slate-300 mx-auto mb-3"
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
                  <p className="text-gray-11 font-medium">No league selected</p>
                  <p className="text-sm text-gray-11 mt-1">
                    Create or select a league to manage tiers
                  </p>
                </div>
              )}
            </div>

            {/* Details Section */}
            {selectedLeague && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className=" rounded-lg border border-gray-a6 bg-gray-a3 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-11">
                      League Name
                    </p>
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v4h8v-4zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-gray-12">
                    {selectedLeague.name}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-a6 bg-gray-a3 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-11">
                      Total Tiers
                    </p>
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-gray-12">
                    {tiers.length}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-a6 bg-gray-a3 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-11">Status</p>
                    <svg
                      className="w-3 h-3 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-gray-12">Active</p>
                </div>
              </div>
            )}

            {/* Description Section */}
            {selectedLeague && selectedLeague.description && (
              <div className="rounded-lg border border-gray-a6 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Description
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {selectedLeague.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
