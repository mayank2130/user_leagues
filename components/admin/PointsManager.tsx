"use client";

import { useState, useEffect } from "react";
import { Button } from "@whop/react/components";
import { getPointsConfig, updatePointsConfig } from "@/actions/point-actions";
import { SettingsIcon, X } from "lucide-react";

interface PointsConfigManagerProps {
  communityId: string;
  onClose: () => void;
}

export default function PointsManager({
  communityId,
  onClose,
}: PointsConfigManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    dailyCheckIn: 10,
    messageRead: 2,
    sessionTime5Min: 5,
    streak7Days: 35,
    streak14Days: 70,
    streak30Days: 150,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const result = await getPointsConfig(communityId);
      if (result.success && result.config) {
        setConfig({
          dailyCheckIn: result.config.dailyCheckIn,
          messageRead: result.config.messageRead,
          sessionTime5Min: result.config.sessionTime5Min,
          streak7Days: result.config.streak7Days,
          streak14Days: result.config.streak14Days,
          streak30Days: result.config.streak30Days,
        });
      }
      setLoading(false);
    };
    fetchConfig();
  }, [communityId]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updatePointsConfig(communityId, config);
    if (result.success) {
      alert("Points configuration updated successfully!");
      onClose();
    } else {
      alert(result.error || "Failed to update configuration");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-a2 border border-gray-a6 rounded-lg p-6">
        <p className="text-gray-11">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-a2 border border-gray-a6 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-a6 bg-gray-a3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-gray-11" />
          <h2 className="text-4 font-semibold text-gray-12">
            Points Configuration
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-a6 rounded transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-11" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Daily Activities */}
        <div>
          <h3 className="text-3 font-semibold text-gray-12 mb-4">
            Daily Activities
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3 font-medium text-gray-12">
                  Daily Check-In
                </p>
                <p className="text-2 text-gray-11">
                  Points for visiting once per day
                </p>
              </div>
              <input
                type="number"
                min="0"
                value={config.dailyCheckIn}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dailyCheckIn: parseInt(e.target.value),
                  })
                }
                className="w-20 px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3 font-medium text-gray-12">Message Read</p>
                <p className="text-2 text-gray-11">Points per message viewed</p>
              </div>
              <input
                type="number"
                min="0"
                value={config.messageRead}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    messageRead: parseInt(e.target.value),
                  })
                }
                className="w-20 px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3 font-medium text-gray-12">
                  5-Minute Session
                </p>
                <p className="text-2 text-gray-11">
                  Points for spending 5+ minutes
                </p>
              </div>
              <input
                type="number"
                min="0"
                value={config.sessionTime5Min}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sessionTime5Min: parseInt(e.target.value),
                  })
                }
                className="w-20 px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
              />
            </div>
          </div>
        </div>

        {/* Streak Bonuses */}
        <div>
          <h3 className="text-3 font-semibold text-gray-12 mb-4">
            Streak Bonuses
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3 font-medium text-gray-12">7-Day Streak</p>
                <p className="text-2 text-gray-11">
                  Bonus for 7 consecutive days
                </p>
              </div>
              <input
                type="number"
                min="0"
                value={config.streak7Days}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    streak7Days: parseInt(e.target.value),
                  })
                }
                className="w-20 px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3 font-medium text-gray-12">14-Day Streak</p>
                <p className="text-2 text-gray-11">
                  Bonus for 14 consecutive days
                </p>
              </div>
              <input
                type="number"
                min="0"
                value={config.streak14Days}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    streak14Days: parseInt(e.target.value),
                  })
                }
                className="w-20 px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3 font-medium text-gray-12">30-Day Streak</p>
                <p className="text-2 text-gray-11">
                  Bonus for 30 consecutive days
                </p>
              </div>
              <input
                type="number"
                min="0"
                value={config.streak30Days}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    streak30Days: parseInt(e.target.value),
                  })
                }
                className="w-20 px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-a6">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="classic"
            className="w-full text-white cursor-pointer"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
