"use server";

import { prisma } from "@/lib/prisma";

export async function initializeFreeTrial(
	communityId: string,
	userId: string,
	planId: string
) {
	try {
		// Check if subscription already exists
		const existing = await prisma.subscription.findFirst({
			where: { communityId, userId },
		});

		if (existing) {
			return { success: true, subscription: existing };
		}

		// Create new subscription with 5-day free trial
		const startDate = new Date();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 5); // 5 days from now

		const subscription = await prisma.subscription.create({
			data: {
				communityId,
				userId,
				planId,
				status: "active",
				startedAt: startDate,
				expiresAt,
			},
		});

		return { success: true, subscription, daysRemaining: 5 };
	} catch (error) {
		console.error("Error initializing free trial:", error);
		return { success: false, error: "Failed to initialize free trial" };
	}
}

export async function checkTrialStatus(communityId: string, userId: string) {
	try {
		const subscription = await prisma.subscription.findFirst({
			where: { communityId, userId },
		});

		if (!subscription) {
			return { success: false, error: "No subscription found", trialActive: false };
		}

		const now = new Date();
		const isExpired = subscription.expiresAt && subscription.expiresAt < now;

		if (isExpired) {
			// Mark as expired
			await prisma.subscription.update({
				where: { id: subscription.id },
				data: { status: "expired" },
			});

			return {
				success: true,
				trialActive: false,
				status: "expired",
				daysRemaining: 0,
			};
		}

		// Calculate days remaining
		const daysRemaining = subscription.expiresAt
			? Math.ceil(
				(subscription.expiresAt.getTime() - now.getTime()) /
				(1000 * 60 * 60 * 24)
			)
			: 0;

		return {
			success: true,
			trialActive: subscription.status === "active" && daysRemaining > 0,
			status: subscription.status,
			daysRemaining: Math.max(0, daysRemaining),
			subscription,
		};
	} catch (error) {
		console.error("Error checking trial status:", error);
		return {
			success: false,
			error: "Failed to check trial status",
			trialActive: false,
		};
	}
}