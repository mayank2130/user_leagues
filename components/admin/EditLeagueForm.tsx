"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import { createLeague, updateLeague } from "@/actions/admin-actions";

interface EditLeagueFormProps {
  leagueId?: string;
  communityId: string;
  experienceId: string;
  initialName?: string;
  initialDescription?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function EditLeagueForm({
  leagueId,
  communityId,
  experienceId,
  initialName,
  initialDescription,
  onSuccess,
  onCancel,
  isOpen,
}: EditLeagueFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName || "",
    description: initialDescription || "",
  });

  const isEditMode = !!leagueId;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = isEditMode
        ? await updateLeague(leagueId, formData)
        : await createLeague(communityId, experienceId, formData);

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-gray-1 border border-gray-a6 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          {isEditMode ? "Edit League Name" : "Create League"}
        </h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="League name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded text-3"
            rows={2}
          />
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              size="2"
              variant="classic"
              disabled={loading}
            >
              {loading ? "Saving..." : isEditMode ? "Save" : "Create"}
            </Button>
            <Button onClick={onCancel} size="2">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
