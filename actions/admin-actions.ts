// app/actions/admin-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLeague(communityId: string) {
	try {
		const league = await prisma.league.findUnique({
			where: { communityId },
			include: {
				tiers: {
					orderBy: { order: "asc" },
				},
			},
		});
		return { success: true, league };
	} catch (error) {
		return { success: false, error: "Failed to fetch league" };
	}
}

export async function getTiers(leagueId: string) {
	try {
		const tiers = await prisma.tier.findMany({
			where: { leagueId },
		});
		return { success: true, tiers };
	} catch (error) {
		return { success: false, error: "Failed to fetch tiers" };
	}
}
export async function createLeague(
	communityId: string,
	experienceId: string,
	data: { name: string; description: string }
) {
	try {
		const league = await prisma.league.create({
			data: {
				communityId,
				name: data.name,
				description: data.description,
			},
		});
		revalidatePath(`/experiences/${experienceId}`);
		return { success: true, league };
	} catch (error) {
		console.error("Error creating league:", error);
		return { success: false, error: "Failed to create league" };
	}
}

export async function updateLeague(
	leagueId: string,
	data: { name: string; description: string }
) {
	try {
		const league = await prisma.league.update({
			where: { id: leagueId },
			data: {
				name: data.name,
				description: data.description,
			},
		});
		revalidatePath(`/admin`);
		return { success: true, league };
	} catch (error) {
		console.error("Error updating league:", error);
		return { success: false, error: "Failed to update league" };
	}
}

export async function createTier(
	leagueId: string,
	data: {
		name: string;
		description: string;
		minScore: number;
		order: number;
		icon: string;
		color: string;
	}
) {
	try {
		// Check if league exists first
		const league = await prisma.league.findUnique({
			where: { id: leagueId },
		});

		if (!league) {
			return { success: false, error: "League not found" };
		}

		const tier = await prisma.tier.create({
			data: {
				...data,
				leagueId, // Use leagueId directly, not communityId
			},
		});

		revalidatePath(`/admin`);
		return { success: true, tier };
	} catch (error) {
		console.error("Error creating tier:", error);
		return { success: false, error: "Failed to create tier" };
	}
}

export async function updateTier(
	tierId: string,
	data: {
		name: string;
		description?: string;
		minScore: number;
		order: number;
		icon?: string;
		color?: string;
	}
) {
	try {
		const tier = await prisma.tier.update({
			where: { id: tierId },
			data,
		});
		revalidatePath(`/admin`);
		return { success: true, tier };
	} catch (error) {
		console.error("Error updating tier:", error);
		return { success: false, error: "Failed to update tier" };
	}
}

export async function deleteTier(tierId: string) {
	try {
		// Check if tier exists
		const tier = await prisma.tier.findUnique({
			where: { id: tierId },
		});

		if (!tier) {
			return { success: false, error: "Tier not found" };
		}

		// Delete the tier
		await prisma.tier.delete({
			where: { id: tierId },
		});

		revalidatePath(`/admin`);
		return { success: true, message: "Tier deleted successfully" };
	} catch (error) {
		console.error("Error deleting tier:", error);
		return { success: false, error: "Failed to delete tier" };
	}
}

export async function sendTierMessage(tierId: string, content: string) {
	try {
		// Get the admin member (assuming admin is the sender)
		// You may need to pass adminMemberId or get it from context
		// For now, we'll create the message without author (admin tier messages)

		const message = await prisma.message.create({
			data: {
				content,
				tierId,
				authorId: "cmhj0xj9l0002v9ps3wqakyi4", // This should be the actual admin member ID
			},
		});

		revalidatePath(`/admin`);
		return { success: true, message };
	} catch (error) {
		console.error("Error sending message:", error);
		return { success: false, error: "Failed to send message" };
	}
}

export async function getTierMembers(tierId: string) {
	try {
		// Get the tier to find minScore
		const tier = await prisma.tier.findUnique({
			where: { id: tierId },
		});

		if (!tier) {
			return { success: false, error: "Tier not found", members: [] };
		}

		// Get members whose score is >= minScore of this tier AND <= minScore of next tier
		const league = await prisma.league.findUnique({
			where: { id: tier.leagueId },
			include: {
				tiers: {
					orderBy: { order: "asc" },
				},
			},
		});

		if (!league) {
			return { success: false, error: "League not found", members: [] };
		}

		// Find the next tier's minScore
		const tierIndex = league.tiers.findIndex((t) => t.id === tierId);
		const nextTier = league.tiers[tierIndex + 1];
		const maxScore = nextTier ? nextTier.minScore - 1 : Infinity;

		// Get all members with scores in this tier's range
		const members = await prisma.member.findMany({
			where: {
				communityId: league.communityId,
				totalScore: {
					gte: tier.minScore,
					lte: maxScore,
				},
			},
			select: {
				id: true,
				name: true,
				totalScore: true,
			},
		});

		return {
			success: true,
			members: members.map((m) => ({
				id: m.id,
				name: m.name || "Unknown",
				score: m.totalScore,
			})),
		};
	} catch (error) {
		console.error("Error fetching tier members:", error);
		return { success: false, error: "Failed to fetch members", members: [] };
	}
}

export async function getTierMessages(tierId: string) {
	try {
		const messages = await prisma.message.findMany({
			where: { tierId },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						whopId: true,
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});

		return { success: true, messages };
	} catch (error) {
		console.error("Error fetching tier messages:", error);
		return { success: false, error: "Failed to fetch messages", messages: [] };
	}
}
