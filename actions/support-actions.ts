// actions/support-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TicketCategory, TicketPriority, FeedbackCategory } from "@prisma/client";

// ===== TICKET ACTIONS =====

export async function createTicket(data: {
	memberId: string;
	communityId: string;
	tierId: string | null;
	category: TicketCategory;
	priority: TicketPriority;
	subject: string;
	description: string;
}) {
	try {
		const ticket = await prisma.ticket.create({
			data: {
				memberId: data.memberId,
				communityId: data.communityId,
				tierId: data.tierId,
				category: data.category,
				priority: data.priority,
				subject: data.subject,
				description: data.description,
				status: "OPEN",
			},
		});

		revalidatePath("/experiences");
		return { success: true, ticket };
	} catch (error) {
		console.error("Error creating ticket:", error);
		return { success: false, error: "Failed to create ticket" };
	}
}

export async function getTickets(communityId: string, memberId?: string) {
	try {
		const tickets = await prisma.ticket.findMany({
			where: {
				communityId,
				...(memberId && { memberId }),
			},
			include: {
				member: {
					select: {
						id: true,
						name: true,
						whopId: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return { success: true, tickets };
	} catch (error) {
		console.error("Error fetching tickets:", error);
		return { success: false, error: "Failed to fetch tickets", tickets: [] };
	}
}

export async function getMemberTickets(memberId: string) {
	try {
		const tickets = await prisma.ticket.findMany({
			where: { memberId },
			orderBy: { createdAt: "desc" },
		});

		return { success: true, tickets };
	} catch (error) {
		console.error("Error fetching member tickets:", error);
		return { success: false, error: "Failed to fetch tickets", tickets: [] };
	}
}

export async function updateTicketStatus(
	ticketId: string,
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
) {
	try {
		const ticket = await prisma.ticket.update({
			where: { id: ticketId },
			data: {
				status,
				...(status === "RESOLVED" && { resolvedAt: new Date() }),
			},
		});

		revalidatePath("/admin");
		return { success: true, ticket };
	} catch (error) {
		console.error("Error updating ticket status:", error);
		return { success: false, error: "Failed to update ticket status" };
	}
}

export async function deleteTicket(ticketId: string) {
	try {
		await prisma.ticket.delete({
			where: { id: ticketId },
		});

		revalidatePath("/admin");
		return { success: true };
	} catch (error) {
		console.error("Error deleting ticket:", error);
		return { success: false, error: "Failed to delete ticket" };
	}
}

// ===== FEEDBACK ACTIONS =====

export async function createFeedback(data: {
	memberId: string;
	communityId: string;
	tierId: string | null;
	category: FeedbackCategory;
	rating: number;
	content: string;
}) {
	try {
		// Validate rating is between 1-5
		if (data.rating < 1 || data.rating > 5) {
			return { success: false, error: "Rating must be between 1 and 5" };
		}

		const feedback = await prisma.feedback.create({
			data: {
				memberId: data.memberId,
				communityId: data.communityId,
				tierId: data.tierId,
				category: data.category,
				rating: data.rating,
				content: data.content,
			},
		});

		revalidatePath("/experiences");
		return { success: true, feedback };
	} catch (error) {
		console.error("Error creating feedback:", error);
		return { success: false, error: "Failed to create feedback" };
	}
}

export async function getFeedback(communityId: string, memberId?: string) {
	try {
		const feedback = await prisma.feedback.findMany({
			where: {
				communityId,
				...(memberId && { memberId }),
			},
			include: {
				member: {
					select: {
						id: true,
						name: true,
						whopId: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return { success: true, feedback };
	} catch (error) {
		console.error("Error fetching feedback:", error);
		return { success: false, error: "Failed to fetch feedback", feedback: [] };
	}
}

export async function getMemberFeedback(memberId: string) {
	try {
		const feedback = await prisma.feedback.findMany({
			where: { memberId },
			orderBy: { createdAt: "desc" },
		});

		return { success: true, feedback };
	} catch (error) {
		console.error("Error fetching member feedback:", error);
		return { success: false, error: "Failed to fetch feedback", feedback: [] };
	}
}

export async function deleteFeedback(feedbackId: string) {
	try {
		await prisma.feedback.delete({
			where: { id: feedbackId },
		});

		revalidatePath("/admin");
		return { success: true };
	} catch (error) {
		console.error("Error deleting feedback:", error);
		return { success: false, error: "Failed to delete feedback" };
	}
}

// ===== NOTIFICATION ACTIONS =====

export async function getUnreadCounts(communityId: string) {
	try {
		const [tickets, feedback] = await Promise.all([
			prisma.ticket.findMany({
				where: {
					communityId,
					viewedByAdmin: false,
				},
				select: {
					tierId: true,
				},
			}),
			prisma.feedback.findMany({
				where: {
					communityId,
					viewedByAdmin: false,
				},
				select: {
					tierId: true,
				},
			}),
		]);

		// Count by tier
		const counts: Record<string, { tickets: number; feedback: number }> = {};

		for (const ticket of tickets) {
			const tierId = ticket.tierId || "general";
			if (!counts[tierId]) counts[tierId] = { tickets: 0, feedback: 0 };
			counts[tierId].tickets++;
		}

		for (const item of feedback) {
			const tierId = item.tierId || "general";
			if (!counts[tierId]) counts[tierId] = { tickets: 0, feedback: 0 };
			counts[tierId].feedback++;
		}

		return { success: true, counts };
	} catch (error) {
		console.error("Error getting unread counts:", error);
		return { success: false, error: "Failed to get unread counts", counts: {} };
	}
}

export async function markTierAsViewed(tierId: string, communityId: string) {
	try {
		await Promise.all([
			prisma.ticket.updateMany({
				where: {
					communityId,
					OR: [
						{ tierId },
						{ tierId: null },
					],
					viewedByAdmin: false,
				},
				data: {
					viewedByAdmin: true,
				},
			}),
			prisma.feedback.updateMany({
				where: {
					communityId,
					OR: [
						{ tierId },
						{ tierId: null },
					],
					viewedByAdmin: false,
				},
				data: {
					viewedByAdmin: true,
				},
			}),
		]);

		return { success: true };
	} catch (error) {
		console.error("Error marking tier as viewed:", error);
		return { success: false, error: "Failed to mark as viewed" };
	}
}

