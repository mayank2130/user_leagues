"use client";

import { MemberWithTier, SimpleTier, LeagueWithTiers } from "@/types";
import { Button, Dialog, Select } from "@whop/react/components";
import { useState } from "react";
import { createTicket, createFeedback } from "@/actions/support-actions";
import AlertDialog from "@/components/ui/AlertDialog";

// Define types locally until Prisma generates them
type TicketCategory =
  | "TECHNICAL_ISSUE"
  | "ACCOUNT_PROBLEM"
  | "FEATURE_REQUEST"
  | "CONTENT_ISSUE"
  | "PAYMENT_BILLING"
  | "OTHER";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type FeedbackCategory =
  | "FEATURE_SUGGESTION"
  | "USER_EXPERIENCE"
  | "CONTENT_QUALITY"
  | "PERFORMANCE"
  | "BUG_REPORT"
  | "GENERAL";

const TICKET_CATEGORIES: string[] = [
  "Technical Issue",
  "Account Problem",
  "Feature Request",
  "Content Issue",
  "Payment/Billing",
  "Other",
];

const TICKET_PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const FEEDBACK_CATEGORIES: string[] = [
  "Feature Suggestion",
  "User Experience",
  "Content Quality",
  "Performance",
  "Bug Report",
  "General",
];

interface LeagueProgressProps {
  league: LeagueWithTiers;
  member: MemberWithTier;
  accessibleTiers: SimpleTier[];
  selectedTierId: string | null;
  onSelectTier: (tierId: string) => void;
}

export default function LeagueProgress({
  league,
  member,
  accessibleTiers,
  selectedTierId,
  onSelectTier,
}: LeagueProgressProps) {
  const currentTierOrder = member.currentTier?.order ?? -1;
  const currentTierData = league.tiers.find(
    (t) => t.order === currentTierOrder
  );
  const nextTier = league.tiers.find((t) => t.order === currentTierOrder + 1);

  const [activeTab, setActiveTab] = useState<"ticket" | "feedback">("ticket");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // Ticket form state
  const [ticketData, setTicketData] = useState({
    category: "TECHNICAL_ISSUE" as TicketCategory,
    priority: "MEDIUM" as TicketPriority,
    subject: "",
    description: "",
  });

  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    category: "GENERAL" as FeedbackCategory,
    rating: 5,
    content: "",
  });

  const handleTicketSubmit = async () => {
    if (!ticketData.subject.trim() || !ticketData.description.trim()) {
      setAlertDialog({
        isOpen: true,
        title: "Validation Error",
        message: "Please fill in all required fields",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTicket({
        memberId: member.id,
        communityId: member.communityId,
        tierId: member.currentTierId,
        category: ticketData.category,
        priority: ticketData.priority,
        subject: ticketData.subject,
        description: ticketData.description,
      });

      if (result.success) {
        setTicketData({
          category: "TECHNICAL_ISSUE",
          priority: "MEDIUM",
          subject: "",
          description: "",
        });
        setDialogOpen(false);
        setAlertDialog({
          isOpen: true,
          title: "Success",
          message: "Ticket submitted successfully!",
          variant: "success",
        });
      } else {
        setAlertDialog({
          isOpen: true,
          title: "Error",
          message: result.error || "Failed to submit ticket",
          variant: "danger",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackData.content.trim()) {
      setAlertDialog({
        isOpen: true,
        title: "Validation Error",
        message: "Please provide your feedback",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createFeedback({
        memberId: member.id,
        communityId: member.communityId,
        tierId: member.currentTierId,
        category: feedbackData.category,
        rating: feedbackData.rating,
        content: feedbackData.content,
      });

      if (result.success) {
        setFeedbackData({
          category: "GENERAL",
          rating: 5,
          content: "",
        });
        setDialogOpen(false);
        setAlertDialog({
          isOpen: true,
          title: "Success",
          message: "Feedback submitted successfully!",
          variant: "success",
        });
      } else {
        setAlertDialog({
          isOpen: true,
          title: "Error",
          message: result.error || "Failed to submit feedback",
          variant: "danger",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoreToNext = nextTier ? nextTier.minScore - member.totalScore : 0;
  const progressPercent = nextTier
    ? Math.min(
        ((member.totalScore - (currentTierData?.minScore || 0)) /
          (nextTier.minScore - (currentTierData?.minScore || 0))) *
          100,
        100
      )
    : 100;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Current Tier Info */}
      <div className="bg-gray-a2 border border-gray-a6 rounded-lg p-3 md:p-5">
        <h2 className="text-3 md:text-4 font-semibold mb-3 md:mb-4">
          Your Progress
        </h2>

        {member.currentTier ? (
          <>
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              {member.currentTier.icon && (
                <span className="text-4 md:text-5">
                  {member.currentTier.icon}
                </span>
              )}
              <div>
                <p className="text-2 text-gray-11">Current Tier</p>
                <p className="text-3 md:text-4 font-bold">
                  {member.currentTier.name}
                </p>
              </div>
            </div>

            <p className="text-3 font-semibold mb-2">
              Score: <span className="text-blue-11">{member.totalScore}</span>
            </p>

            {nextTier && (
              <>
                <div className="w-full bg-gray-a4 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-9 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-2 text-gray-11">
                  {scoreToNext} points to {nextTier.name}
                </p>
              </>
            )}
          </>
        ) : (
          <p className="text-gray-11">Unranked</p>
        )}
      </div>

      {/* Accessible Tiers */}
      <div className="bg-gray-a2 border border-gray-a6 rounded-lg p-3 md:p-5">
        <h2 className="text-3 md:text-4 font-semibold mb-3 md:mb-4">
          Available Tiers
        </h2>

        {accessibleTiers && accessibleTiers.length > 0 ? (
          <div className="space-y-2">
            {accessibleTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => onSelectTier(tier.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTierId === tier.id
                    ? "bg-blue-a3 border-blue-9"
                    : "bg-gray-a3 border-gray-a6 hover:border-blue-9 active:border-blue-9"
                }`}
              >
                <div className="flex items-center gap-2">
                  {tier.icon && <span className="text-3">{tier.icon}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="text-3 font-semibold truncate">{tier.name}</p>
                    <p className="text-2 text-gray-11">
                      {tier.minScore} points required
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-11">No accessible tiers</p>
        )}
      </div>
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Trigger>
          <Button variant="surface" className="cursor-pointer w-full">
            Contact Support
          </Button>
        </Dialog.Trigger>
        <Dialog.Content className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title>Contact Support</Dialog.Title>
          <Dialog.Description>
            Submit a support ticket or share your feedback with us.
          </Dialog.Description>

          {/* Tab Buttons */}
          <div className="flex gap-2 mb-4 border-b border-gray-a6">
            <button
              onClick={() => setActiveTab("ticket")}
              className={`px-4 py-2 font-medium text-3 transition-colors cursor-pointer ${
                activeTab === "ticket"
                  ? "text-blue-11 border-b-2 border-blue-9"
                  : "text-gray-11 hover:text-gray-12"
              }`}
            >
              Raise Ticket
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-4 py-2 font-medium text-3 transition-colors cursor-pointer ${
                activeTab === "feedback"
                  ? "text-blue-11 border-b-2 border-blue-9"
                  : "text-gray-11 hover:text-gray-12"
              }`}
            >
              Give Feedback
            </button>
          </div>

          {/* Ticket Form */}
          {activeTab === "ticket" && (
            <div className="space-y-4">
              <div>
                <label className="block text-3 font-medium mb-2 text-gray-12">
                  Category <span className="text-red-11">*</span>
                </label>
                <Select.Root
                  value={ticketData.category}
                  onValueChange={(value) =>
                    setTicketData({
                      ...ticketData,
                      category: value as TicketCategory,
                    })
                  }
                >
                  <Select.Trigger className="w-full bg-gray-1 border-gray-a4" />
                  <Select.Content>
                    {TICKET_CATEGORIES.map((category) => (
                      <Select.Item key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>

              <div>
                <label className="block text-3 font-medium mb-2 text-gray-12">
                  Priority
                </label>
                <Select.Root
                  value={ticketData.priority}
                  onValueChange={(value) =>
                    setTicketData({
                      ...ticketData,
                      priority: value as TicketPriority,
                    })
                  }
                >
                  <Select.Trigger className="w-full bg-gray-1 border-gray-a4" />
                  <Select.Content>
                    {TICKET_PRIORITIES.map((priority) => (
                      <Select.Item key={priority} value={priority}>
                        {priority.charAt(0) + priority.slice(1).toLowerCase()}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>

              <div>
                <label className="block text-3 font-medium mb-2 text-gray-12">
                  Subject <span className="text-red-11">*</span>
                </label>
                <input
                  type="text"
                  value={ticketData.subject}
                  onChange={(e) =>
                    setTicketData({ ...ticketData, subject: e.target.value })
                  }
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 rounded-lg border border-gray-a6 bg-gray-a2 text-gray-12 placeholder-gray-10 focus:outline-none focus:border-blue-9"
                />
              </div>

              <div>
                <label className="block text-3 font-medium mb-2 text-gray-12">
                  Description <span className="text-red-11">*</span>
                </label>
                <textarea
                  value={ticketData.description}
                  onChange={(e) =>
                    setTicketData({
                      ...ticketData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Please provide detailed information about your issue..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-a6 bg-gray-a2 text-gray-12 placeholder-gray-10 focus:outline-none focus:border-blue-9 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Dialog.Close>
                  <Button variant="surface" className="cursor-pointer">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleTicketSubmit}
                  variant="classic"
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </div>
          )}

          {/* Feedback Form */}
          {activeTab === "feedback" && (
            <div className="space-y-4">
              <div>
                <label className="block text-3 font-medium mb-2 text-gray-12">
                  Category <span className="text-red-11">*</span>
                </label>
                <Select.Root
                  value={feedbackData.category}
                  defaultValue="General"
                  onValueChange={(value) =>
                    setFeedbackData({
                      ...feedbackData,
                      category: value as FeedbackCategory,
                    })
                  }
                >
                  <Select.Trigger className="w-full bg-gray-1 border-gray-a4" />
                  <Select.Content>
                    {FEEDBACK_CATEGORIES.map((category) => (
                      <Select.Item key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>

              <div>
                <label className="block text-3 font-medium mb-2 text-gray-12">
                  Rating <span className="text-red-11">*</span>
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setFeedbackData({ ...feedbackData, rating })
                      }
                      className={`w-10 h-10 rounded-lg font-semibold transition-colors cursor-pointer ${
                        feedbackData.rating >= rating
                          ? "bg-blue-9 text-white"
                          : "bg-gray-a3 text-gray-11 hover:bg-gray-a4"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-3 font-medium mb-2 text-gray-12">
                  Your Feedback <span className="text-red-11">*</span>
                </label>
                <textarea
                  value={feedbackData.content}
                  onChange={(e) =>
                    setFeedbackData({
                      ...feedbackData,
                      content: e.target.value,
                    })
                  }
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-a6 bg-gray-a2 text-gray-12 placeholder-gray-10 focus:outline-none focus:border-blue-9 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Dialog.Close>
                  <Button variant="surface" className="cursor-pointer">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleFeedbackSubmit}
                  variant="classic"
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Root>

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
