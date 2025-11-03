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
}

export default function EditLeagueForm({
  leagueId,
  communityId,
  experienceId,
  initialName,
  initialDescription,
  onSuccess,
  onCancel,
}: EditLeagueFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName || "",
    description: initialDescription || "",
  });

  const isEditMode = !!leagueId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="League name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
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
      <div className="flex gap-2">
        <Button type="submit" size="2" disabled={loading}>
          {loading ? "Saving..." : isEditMode ? "Save" : "Create"}
        </Button>
        <Button type="button" size="2" variant="classic" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
