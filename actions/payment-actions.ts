"use server";

import { prisma } from "@/lib/prisma";

const PLAN_IDS = {
	monthly: "plan_r6sogDdGOW052",
	yearly: "plan_J952sOzS1Vac7",
} as const;

export async function getPlanId(planType: string) {
	try {
		const planId = PLAN_IDS[planType as keyof typeof PLAN_IDS];

		if (!planId) {
			return {
				success: false,
				error: `Plan ID not configured for ${planType}. Please create the plan in your Whop dashboard and set NEXT_PUBLIC_WHOP_${planType.toUpperCase()}_PLAN_ID in your environment variables.`,
			};
		}

		return {
			success: true,
			planId,
		};
	} catch (error) {
		console.error("Error getting plan ID:", error);
		return {
			success: false,
			error: "Failed to get plan ID",
		};
	}
}

export async function verifyAndProcessPayment(
	paymentData: any,
	communityId: string,
	userId: string
) {
	try {
		const planId = paymentData.metadata?.plan_id;

		if (!planId) {
			return { success: false, error: "No plan ID in payment" };
		}

		// Update subscription in database
		const subscription = await prisma.subscription.upsert({
			where: {
				whopMembershipId: paymentData.id,
			},
			create: {
				communityId,
				userId,
				whopMembershipId: paymentData.id,
				planId,
				status: "active",
				startedAt: new Date(paymentData.created_at),
				expiresAt: new Date(
					planId === "yearly"
						? new Date().getTime() + 365 * 24 * 60 * 60 * 1000
						: new Date().getTime() + 30 * 24 * 60 * 60 * 1000
				),
			},
			update: {
				status: "active",
				startedAt: new Date(paymentData.created_at),
				expiresAt: new Date(
					planId === "yearly"
						? new Date().getTime() + 365 * 24 * 60 * 60 * 1000
						: new Date().getTime() + 30 * 24 * 60 * 60 * 1000
				),
			},
		});

		return { success: true, subscription };
	} catch (error) {
		console.error("Error processing payment:", error);
		return { success: false, error: "Failed to process payment" };
	}
}
