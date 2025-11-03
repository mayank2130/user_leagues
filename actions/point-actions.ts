"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Point values
const POINTS = {
	DAILY_CHECK_IN: 10,
	STREAK_7: 35, // 7-day streak
	STREAK_14: 70, // 14-day streak
	STREAK_30: 150, // 30-day streak
	MESSAGE_READ: 2,
	SESSION_TIME_5MIN: 5,
	LINK_CLICK: 2,
	SUBSCRIPTION_DAILY: 5,
} as const;

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
			},
		});

		if (!member || !member.currentTier) {
			return { success: false, error: "Member not found" };
		}

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

				if (newStreak % 30 === 0) streakBonus = POINTS.STREAK_30;
				else if (newStreak % 14 === 0) streakBonus = POINTS.STREAK_14;
				else if (newStreak % 7 === 0) streakBonus = POINTS.STREAK_7;
			} else {
				newStreak = 1; // Reset streak
			}
		} else {
			newStreak = 1;
		}

		const totalPoints = POINTS.DAILY_CHECK_IN + streakBonus;
		const newTotalScore = member.totalScore + totalPoints;

		// Find new tier
		const tiers = member.currentTier?.league?.tiers || [];
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
				points: POINTS.DAILY_CHECK_IN,
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
		// Check if already read
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
			},
		});

		if (!member) {
			return { success: false, error: "Member not found" };
		}

		// Create or update read record
		await prisma.messageRead.upsert({
			where: { messageId_memberId: { messageId, memberId } },
			create: { messageId, memberId, pointsAwarded: true },
			update: { pointsAwarded: true },
		});

		const newTotalScore = member.totalScore + POINTS.MESSAGE_READ;

		// Find new tier
		const tiers = member.currentTier?.league?.tiers || [];
		const newTier = tiers
			.filter((t) => newTotalScore >= t.minScore)
			.sort((a, b) => b.order - a.order)[0];

		// Update member
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

		// Log score history
		await prisma.scoreHistory.create({
			data: {
				memberId,
				points: POINTS.MESSAGE_READ,
				reason: "Message read",
				sourceType: "message_read",
				sourceId: messageId,
			},
		});

		revalidatePath("/");
		return {
			success: true,
			member: updatedMember,
			pointsEarned: POINTS.MESSAGE_READ,
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
			},
		});

		if (!member) {
			return { success: false, error: "Member not found" };
		}

		const points = POINTS.SESSION_TIME_5MIN;
		const newTotalScore = member.totalScore + points;

		// Find new tier
		const tiers = member.currentTier?.league?.tiers || [];
		const newTier = tiers
			.filter((t) => newTotalScore >= t.minScore)
			.sort((a, b) => b.order - a.order)[0];

		// Update member
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

		// Log score history
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
