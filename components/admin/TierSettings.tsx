import { updateTier } from "@/actions/admin-actions";
import { Button } from "@whop/react/components";
import { useState, useEffect } from "react";
import { Tier } from "@prisma/client";

const TierSettings = ({
  tier,
  onTierDeleted,
}: {
  tier: Tier;
  onTierDeleted: () => void;
}) => {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: tier.name,
    minScore: tier.minScore,
    order: tier.order,
    icon: tier.icon || "",
  });

  // Update form data when tier changes
  useEffect(() => {
    setEditFormData({
      name: tier.name,
      minScore: tier.minScore,
      order: tier.order,
      icon: tier.icon || "",
    });
  }, [tier]);
  const handleSaveEdit = async () => {
    setSavingId(tier.id);
    const result = await updateTier(tier.id, editFormData);
    setSavingId(null);

    if (result.success) {
      onTierDeleted();
    } else {
      alert(result.error);
    }
  };

  const handleReset = () => {
    setEditFormData({
      name: tier.name,
      minScore: tier.minScore,
      order: tier.order,
      icon: tier.icon || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Tier Name */}
        <div>
          <label className="block text-sm font-medium text-gray-12 mb-2">
            Tier Name
          </label>
          <input
            type="text"
            value={editFormData.name}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-gray-a3 border border-gray-a6 rounded-lg text-3 text-gray-12 placeholder-gray-11 focus:outline-none focus:ring-2 focus:ring-blue-a7 focus:border-blue-a7 transition-colors"
            placeholder="Enter tier name"
          />
        </div>

        {/* Minimum Score */}
        <div>
          <label className="block text-sm font-medium text-gray-12 mb-2">
            Minimum Points Required
          </label>
          <input
            type="number"
            value={editFormData.minScore}
            onChange={(e) =>
              setEditFormData((prev) => ({
                ...prev,
                minScore: parseInt(e.target.value) || 0,
              }))
            }
            className="w-full px-4 py-2.5 bg-gray-a3 border border-gray-a6 rounded-lg text-3 text-gray-12 placeholder-gray-11 focus:outline-none focus:ring-2 focus:ring-blue-a7 focus:border-blue-a7 transition-colors"
            placeholder="0"
            min="0"
          />
          <p className="mt-1 text-xs text-gray-11">
            Members need this many points to unlock this tier
          </p>
        </div>

        {/* Order and Icon */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={editFormData.order}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  order: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-4 py-2.5 bg-gray-a3 border border-gray-a6 rounded-lg text-3 text-gray-12 placeholder-gray-11 focus:outline-none focus:ring-2 focus:ring-blue-a7 focus:border-blue-a7 transition-colors"
              placeholder="1"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-11">Sort order</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">
              Icon (Emoji)
            </label>
            <input
              type="text"
              maxLength={2}
              value={editFormData.icon}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, icon: e.target.value }))
              }
              className="w-full px-4 py-2.5 bg-gray-a3 border border-gray-a6 rounded-lg text-3 text-gray-12 placeholder-gray-11 focus:outline-none focus:ring-2 focus:ring-blue-a7 focus:border-blue-a7 transition-colors text-center"
              placeholder="🏆"
            />
            <p className="mt-1 text-xs text-gray-11">Tier emoji</p>
          </div>
        </div> */}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-a6">
        <Button
          size="2"
          onClick={handleSaveEdit}
          disabled={savingId === tier.id}
          variant="classic"
          className="cursor-pointer"
        >
          {savingId === tier.id ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          size="2"
          onClick={handleReset}
          disabled={savingId === tier.id}
          className="cursor-pointer"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default TierSettings;
