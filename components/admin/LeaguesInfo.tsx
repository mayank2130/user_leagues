// components/admin/LeagueInfo.tsx
"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import PointsManager from "./PointsManager";

interface LeagueInfoProps {
  communityId: string;
}

export default function LeagueInfo({ communityId }: LeagueInfoProps) {
  const [isManagingPoints, setIsManagingPoints] = useState(false);
  return (
    <div className="">
      <Button
        size="2"
        onClick={() => setIsManagingPoints(true)}
        className="cursor-pointer"
        variant="classic"
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
    </div>
  );
}
