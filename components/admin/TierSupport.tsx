"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button, Badge } from "@whop/react/components";
import {
  getTickets,
  getFeedback,
  updateTicketStatus,
  deleteTicket,
  deleteFeedback,
  markTierAsViewed,
} from "@/actions/support-actions";
import { Trash2, Clock, CheckCircle, XCircle, Star } from "lucide-react";

// Module-level cache to persist across component mounts
const dataCache: {
  tickets: Ticket[] | null;
  feedback: Feedback[] | null;
  communityId: string | null;
} = {
  tickets: null,
  feedback: null,
  communityId: null,
};

interface Ticket {
  id: string;
  tierId: string | null;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  createdAt: Date;
  member: {
    id: string;
    name: string | null;
  };
}

interface Feedback {
  id: string;
  tierId: string | null;
  category: string;
  rating: number;
  content: string;
  createdAt: Date;
  member: {
    id: string;
    name: string | null;
  };
}

interface TierSupportProps {
  tierId: string;
  communityId: string;
  onViewed?: () => void;
}

export default function TierSupport({
  tierId,
  communityId,
  onViewed,
}: TierSupportProps) {
  const [activeTab, setActiveTab] = useState<"tickets" | "feedback">("tickets");
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTicket, setUpdatingTicket] = useState<string | null>(null);
  const hasMarkedViewed = useRef<Record<string, boolean>>({});

  // Filter data for current tier using useMemo
  const tickets = useMemo(() => {
    return allTickets.filter((t: Ticket) => t.tierId === tierId || !t.tierId);
  }, [allTickets, tierId]);

  const feedback = useMemo(() => {
    return allFeedback.filter(
      (f: Feedback) => f.tierId === tierId || !f.tierId
    );
  }, [allFeedback, tierId]);

  // Load data only when community changes
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const hasCache =
        dataCache.communityId === communityId &&
        dataCache.tickets &&
        dataCache.feedback;

      if (hasCache) {
        if (isMounted) {
          setAllTickets(dataCache.tickets!);
          setAllFeedback(dataCache.feedback!);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const [ticketsResult, feedbackResult] = await Promise.all([
          getTickets(communityId),
          getFeedback(communityId),
        ]);

        if (ticketsResult.success && isMounted) {
          setAllTickets(ticketsResult.tickets);
          dataCache.tickets = ticketsResult.tickets;
          dataCache.communityId = communityId;
        }

        if (feedbackResult.success && isMounted) {
          setAllFeedback(feedbackResult.feedback);
          dataCache.feedback = feedbackResult.feedback;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [communityId]);

  // Mark tier as viewed when tier changes
  useEffect(() => {
    if (!hasMarkedViewed.current[tierId]) {
      hasMarkedViewed.current[tierId] = true;

      markTierAsViewed(tierId, communityId).then(() => {
        if (onViewed) {
          onViewed();
        }
      });
    }
  }, [tierId, communityId, onViewed]);

  const handleUpdateTicketStatus = async (
    ticketId: string,
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  ) => {
    setUpdatingTicket(ticketId);
    try {
      const result = await updateTicketStatus(ticketId, status);
      if (result.success) {
        const updated = allTickets.map((t) =>
          t.id === ticketId ? { ...t, status } : t
        );
        setAllTickets(updated);
        dataCache.tickets = updated;
      } else {
        alert(result.error);
      }
    } finally {
      setUpdatingTicket(null);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;

    try {
      const result = await deleteTicket(ticketId);
      if (result.success) {
        const updated = allTickets.filter((t) => t.id !== ticketId);
        setAllTickets(updated);
        dataCache.tickets = updated;
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const result = await deleteFeedback(feedbackId);
      if (result.success) {
        const updated = allFeedback.filter((f) => f.id !== feedbackId);
        setAllFeedback(updated);
        dataCache.feedback = updated;
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "blue";
      case "IN_PROGRESS":
        return "yellow";
      case "RESOLVED":
        return "green";
      case "CLOSED":
        return "gray";
      default:
        return "gray";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "gray";
      case "MEDIUM":
        return "blue";
      case "HIGH":
        return "orange";
      case "URGENT":
        return "red";
      default:
        return "gray";
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-2 text-gray-11">Loading support data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-4 font-semibold text-gray-12">Member Support</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-a6">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 font-medium text-3 transition-colors cursor-pointer ${
            activeTab === "tickets"
              ? "text-blue-11 border-b-2 border-blue-9"
              : "text-gray-11 hover:text-gray-12"
          }`}
        >
          Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-2 font-medium text-3 transition-colors cursor-pointer ${
            activeTab === "feedback"
              ? "text-blue-11 border-b-2 border-blue-9"
              : "text-gray-11 hover:text-gray-12"
          }`}
        >
          Feedback ({feedback.length})
        </button>
      </div>

      {/* Tickets View */}
      {activeTab === "tickets" && (
        <div className="space-y-3">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-gray-a6 rounded-lg p-4 bg-gray-a2 hover:bg-gray-a3 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge color={getStatusColor(ticket.status)} size="1">
                        {ticket.status}
                      </Badge>
                      <Badge color={getPriorityColor(ticket.priority)} size="1">
                        {ticket.priority}
                      </Badge>
                      <span className="text-1 text-gray-11">
                        {formatCategory(ticket.category)}
                      </span>
                    </div>
                    <h4 className="text-3 font-semibold text-gray-12 mb-1">
                      {ticket.subject}
                    </h4>
                    <p className="text-2 text-gray-11 line-clamp-2 whitespace-pre-wrap">
                      {ticket.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="flex-shrink-0 p-1 hover:bg-red-a3 rounded transition-colors text-red-11 hover:text-red-12 cursor-pointer"
                    title="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-a6">
                  <div className="flex items-center gap-2 text-1 text-gray-11">
                    <span className="font-medium">
                      {ticket.member.name || "Unknown"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {ticket.status !== "IN_PROGRESS" && (
                      <Button
                        size="1"
                        variant="surface"
                        onClick={() =>
                          handleUpdateTicketStatus(ticket.id, "IN_PROGRESS")
                        }
                        disabled={updatingTicket === ticket.id}
                        className="cursor-pointer text-1"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        In Progress
                      </Button>
                    )}
                    {ticket.status !== "RESOLVED" && (
                      <Button
                        size="1"
                        variant="surface"
                        onClick={() =>
                          handleUpdateTicketStatus(ticket.id, "RESOLVED")
                        }
                        disabled={updatingTicket === ticket.id}
                        className="cursor-pointer text-1"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                    {ticket.status !== "CLOSED" && (
                      <Button
                        size="1"
                        variant="surface"
                        onClick={() =>
                          handleUpdateTicketStatus(ticket.id, "CLOSED")
                        }
                        disabled={updatingTicket === ticket.id}
                        className="cursor-pointer text-1"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-gray-a6 rounded-lg bg-gray-a2">
              <p className="text-2 text-gray-11">No tickets submitted yet</p>
            </div>
          )}
        </div>
      )}

      {/* Feedback View */}
      {activeTab === "feedback" && (
        <div className="space-y-3">
          {feedback.length > 0 ? (
            feedback.map((item) => (
              <div
                key={item.id}
                className="border border-gray-a6 rounded-lg p-4 bg-gray-a2 hover:bg-gray-a3 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < item.rating
                                ? "fill-yellow-9 text-yellow-9"
                                : "text-gray-a6"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-1 text-gray-11">
                        {formatCategory(item.category)}
                      </span>
                    </div>
                    <p className="text-2 text-gray-12 whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    className="flex-shrink-0 p-1 hover:bg-red-a3 rounded transition-colors text-red-11 hover:text-red-12 cursor-pointer"
                    title="Delete feedback"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-a6 text-1 text-gray-11">
                  <span className="font-medium">
                    {item.member.name || "Unknown"}
                  </span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-gray-a6 rounded-lg bg-gray-a2">
              <p className="text-2 text-gray-11">No feedback submitted yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
