"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to get points config
async function getPointsValues(communityId: string) {
	const config = await prisma.pointsConfig.findUnique({
		where: { communityId },
	});

	return (
		config || {
			dailyCheckIn: 10,
			messageRead: 2,
			sessionTime5Min: 5,
			streak7Days: 35,
			streak14Days: 70,
			streak30Days: 150,
		}
	);
}

export async function recordDailyCheckIn(memberId: string) {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const member = await prisma.member.findUnique({
			where: { id: memberId },
			include: {
				currentTier: {
					include: {
						league: {
							include: {
								tiers: {
									orderBy: { order: "asc" },
								},
							},
						},
					},
				},
				community: true,
			},
		});

		if (!member || !member.currentTier) {
			return { success: false, error: "Member not found" };
		}

		// Get dynamic points config
		const POINTS = await getPointsValues(member.communityId);

		// Check if already checked in today
		const lastCheckIn = member.lastCheckedInDate;
		const lastCheckInDate = lastCheckIn ? new Date(lastCheckIn) : null;
		lastCheckInDate?.setHours(0, 0, 0, 0);

		if (lastCheckInDate?.getTime() === today.getTime()) {
			return { success: false, error: "Already checked in today" };
		}

		// Calculate streak
		let newStreak = member.checkInStreak;
		let streakBonus = 0;

		if (lastCheckInDate) {
			const daysDiff = Math.floor(
				(today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (daysDiff === 1) {
				newStreak += 1;

				if (newStreak % 30 === 0) streakBonus = POINTS.streak30Days;
				else if (newStreak % 14 === 0) streakBonus = POINTS.streak14Days;
				else if (newStreak % 7 === 0) streakBonus = POINTS.streak7Days;
			} else {
				newStreak = 1;
			}
		} else {
			newStreak = 1;
		}

		const totalPoints = POINTS.dailyCheckIn + streakBonus;
		const newTotalScore = member.totalScore + totalPoints;

		// Find new tier
		const tiers = member.currentTier?.league.tiers ?? [];
		const newTier = tiers
			.filter((t) => newTotalScore >= t.minScore)
			.sort((a, b) => b.order - a.order)[0];

		// Update member
		const updatedMember = await prisma.member.update({
			where: { id: memberId },
			data: {
				totalScore: newTotalScore,
				lastCheckedInDate: today,
				checkInStreak: newStreak,
				currentTierId: newTier.id,
				lastActive: new Date(),
			},
			include: {
				currentTier: true,
			},
		});

		// Log score history
		await prisma.scoreHistory.create({
			data: {
				memberId,
				points: POINTS.dailyCheckIn,
				reason: "Daily check-in",
				sourceType: "daily_checkin",
			},
		});

		if (streakBonus > 0) {
			await prisma.scoreHistory.create({
				data: {
					memberId,
					points: streakBonus,
					reason: `${newStreak}-day streak bonus`,
					sourceType: "streak_bonus",
				},
			});
		}

		revalidatePath("/");
		return { success: true, member: updatedMember, pointsEarned: totalPoints };
	} catch (error) {
		console.error("Error recording check-in:", error);
		return { success: false, error: "Failed to record check-in" };
	}
}

export async function recordMessageRead(memberId: string, messageId: string) {
	try {
		const existing = await prisma.messageRead.findUnique({
			where: {
				messageId_memberId: { messageId, memberId },
			},
		});

		if (existing?.pointsAwarded) {
			return { success: false, error: "Points already awarded" };
		}

		const member = await prisma.member.findUnique({
			where: { id: memberId },
			include: {
				currentTier: {
					include: {
						league: {
							include: {
								tiers: {
									orderBy: { order: "asc" },
								},
							},
						},
					},
				},
				community: true,
			},
		});

		if (!member) {
			return { success: false, error: "Member not found" };
		}

		// Get dynamic points config
		const POINTS = await getPointsValues(member.communityId);

		await prisma.messageRead.upsert({
			where: { messageId_memberId: { messageId, memberId } },
			create: { messageId, memberId, pointsAwarded: true },
			update: { pointsAwarded: true },
		});

		const newTotalScore = member.totalScore + POINTS.messageRead;

		const tiers = member.currentTier?.league.tiers ?? [];
		const newTier = tiers
			.filter((t) => newTotalScore >= t.minScore)
			.sort((a, b) => b.order - a.order)[0];

		const updatedMember = await prisma.member.update({
			where: { id: memberId },
			data: {
				totalScore: newTotalScore,
				currentTierId: newTier.id,
				lastActive: new Date(),
			},
			include: {
				currentTier: true,
			},
		});

		await prisma.scoreHistory.create({
			data: {
				memberId,
				points: POINTS.messageRead,
				reason: "Message read",
				sourceType: "message_read",
				sourceId: messageId,
			},
		});

		revalidatePath("/");
		return {
			success: true,
			member: updatedMember,
			pointsEarned: POINTS.messageRead,
		};
	} catch (error) {
		console.error("Error recording message read:", error);
		return { success: false, error: "Failed to record message read" };
	}
}

export async function recordSessionTime(
	memberId: string,
	minutesSpent: number
) {
	try {
		if (minutesSpent < 5) {
			return { success: false, error: "Need at least 5 minutes" };
		}

		const member = await prisma.member.findUnique({
			where: { id: memberId },
			include: {
				currentTier: {
					include: {
						league: {
							include: {
								tiers: {
									orderBy: { order: "asc" },
								},
							},
						},
					},
				},
				community: true,
			},
		});

		if (!member) {
			return { success: false, error: "Member not found" };
		}

		// Get dynamic points config
		const POINTS = await getPointsValues(member.communityId);

		const points = POINTS.sessionTime5Min;
		const newTotalScore = member.totalScore + points;

		const tiers = member.currentTier?.league.tiers ?? [];
		const newTier = tiers
			.filter((t) => newTotalScore >= t.minScore)
			.sort((a, b) => b.order - a.order)[0];

		const updatedMember = await prisma.member.update({
			where: { id: memberId },
			data: {
				totalScore: newTotalScore,
				totalSessionTime: member.totalSessionTime + minutesSpent,
				currentTierId: newTier.id,
				lastActive: new Date(),
			},
			include: {
				currentTier: true,
			},
		});

		await prisma.scoreHistory.create({
			data: {
				memberId,
				points,
				reason: `${minutesSpent} minutes session`,
				sourceType: "session_time",
			},
		});

		revalidatePath("/");
		return { success: true, member: updatedMember, pointsEarned: points };
	} catch (error) {
		console.error("Error recording session:", error);
		return { success: false, error: "Failed to record session" };
	}
}
export async function getPointsConfig(communityId: string) {
	try {
		let config = await prisma.pointsConfig.findUnique({
			where: { communityId },
		});

		// Create default config if doesn't exist
		if (!config) {
			config = await prisma.pointsConfig.create({
				data: {
					communityId,
					dailyCheckIn: 10,
					messageRead: 2,
					sessionTime5Min: 5,
					streak7Days: 35,
					streak14Days: 70,
					streak30Days: 150,
				},
			});
		}

		return { success: true, config };
	} catch (error) {
		console.error("Error fetching points config:", error);
		return { success: false, error: "Failed to fetch configuration" };
	}
}

export async function updatePointsConfig(
	communityId: string,
	data: {
		dailyCheckIn: number;
		messageRead: number;
		sessionTime5Min: number;
		streak7Days: number;
		streak14Days: number;
		streak30Days: number;
	}
) {
	try {
		const config = await prisma.pointsConfig.upsert({
			where: { communityId },
			create: {
				communityId,
				...data,
			},
			update: data,
		});

		revalidatePath("/admin");
		return { success: true, config };
	} catch (error) {
		console.error("Error updating points config:", error);
		return { success: false, error: "Failed to update configuration" };
	}
}
