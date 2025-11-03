"use server";

import { whopsdk } from "@/lib/whop-sdk";
import { prisma } from "@/lib/prisma";
import { PlanType } from "@whop/sdk/resources";

const PLAN_CONFIG = {
	monthly: {
		name: "Monthly Plan",
		price: 3500, // $35 in cents
		plan_type: "subscription",
		billing_period: "month",
	},
	yearly: {
		name: "Yearly Plan",
		price: 29900, // $299 in cents
		plan_type: "subscription",
		billing_period: "year",
	},
} as const;

export async function createCheckoutConfiguration(planId: string) {
	try {
		const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];

		if (!plan) {
			return { success: false, error: "Invalid plan" };
		}

		const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

		if (!companyId) {
			return { success: false, error: "Company ID not configured" };
		}

		const checkoutConfiguration = await whopsdk.checkoutConfigurations.create({
			plan: {
				company_id: companyId,
				initial_price: plan.price,
				plan_type: plan.plan_type as PlanType,
				billing_period: Number(plan.billing_period),
			},
			metadata: {
				plan_id: planId,
				plan_name: plan.name,
			},
		});

		// Type guard - check for success
		if (!checkoutConfiguration.plan) {
			return { success: false, error: "Failed to create checkout" };
		}

		return {
			success: true,
			plan: checkoutConfiguration.plan,
			id: checkoutConfiguration.id,
			purchase_url: checkoutConfiguration.purchase_url,
		};
	} catch (error) {
		console.error("Error creating checkout configuration:", error);
		return {
			success: false,
			error: "Failed to create checkout configuration",
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
