"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import { createTier } from "@/actions/admin-actions";

interface CreateTierFormProps {
  leagueId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateTierForm({
  leagueId,
  onSuccess,
  onCancel,
}: CreateTierFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minScore: 0,
    order: 0,
    icon: "",
    color: "#3b82f6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createTier(leagueId, formData);
      if (result.success) {
        onSuccess();
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-gray-1 border border-gray-a6 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Create Tier</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Tier name (Bronze, Silver...)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
          />
          <input
            type="number"
            placeholder="Min score to unlock"
            value={formData.minScore}
            onChange={(e) =>
              setFormData({ ...formData, minScore: parseInt(e.target.value) })
            }
            required
            className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
          />
          {/* <input
            type="text"
            placeholder="Icon (emoji)"
            maxLength={2}
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
          /> */}
          <div className="flex gap-2">
            <Button type="submit" size="2" variant="classic" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button type="button" size="2" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
