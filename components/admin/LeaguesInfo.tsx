// components/admin/LeagueInfo.tsx
"use client";

import { useState } from "react";
import { League } from "@prisma/client";
import EditLeagueForm from "./EditLeagueForm";
import { Button } from "@whop/react/components";
import PointsManager from "./PointsManager";

interface LeagueInfoProps {
  league: League;
  communityId: string;
  onLeagueUpdate: () => void;
  experienceId: string;
}

export default function LeagueInfo({
  league,
  communityId,
  onLeagueUpdate,
  experienceId,
}: LeagueInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingPoints, setIsManagingPoints] = useState(false);
  return (
    <>
      <div className="bg-gray-a2 border border-gray-a6 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-4 font-semibold">League</h2>
          <Button size="2" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>

        {isEditing ? (
          <EditLeagueForm
            leagueId={league.id}
            communityId={communityId}
            experienceId={experienceId}
            initialName={league.name}
            initialDescription={league.description}
            onSuccess={() => {
              setIsEditing(false);
              onLeagueUpdate();
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-2 text-gray-11">Name</p>
              <p className="text-3 font-semibold">{league.name}</p>
            </div>
            {league.description && (
              <div>
                <p className="text-2 text-gray-11">Description</p>
                <p className="text-3">{league.description}</p>
              </div>
            )}
            <div>
              <p className="text-2 text-gray-11">Status</p>
              <p className="text-3">
                {league.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        )}
      </div>
      <Button
        size="2"
        onClick={() => setIsManagingPoints(true)}
        className="cursor-pointer mt-3"
      >
        Manage member points
      </Button>

      {/* Points Manager Modal */}
      {isManagingPoints && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsManagingPoints(false)}
        >
          <div
            className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-1"
            onClick={(e) => e.stopPropagation()}
          >
            <PointsManager
              communityId={communityId}
              onClose={() => setIsManagingPoints(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
