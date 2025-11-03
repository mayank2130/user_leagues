import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<Response> {
	try {
		const requestBodyText = await request.text();
		const headers = Object.fromEntries(request.headers);
		const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

		if (webhookData.type === "payment.succeeded") {
			waitUntil(handlePaymentSucceeded(webhookData.data));
		}

		if (webhookData.type === "payment.failed") {
			waitUntil(handlePaymentFailed(webhookData.data));
		}

		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("Webhook error:", error);
		return new Response("Error", { status: 400 });
	}
}

async function handlePaymentSucceeded(payment: any) {
	try {
		// Payment structure from docs
		const planId = payment.product?.metadata?.plan_id;
		const communityId = payment.product?.metadata?.community_id;
		const userId = payment.user_id;
		const amount = payment.amount;

		if (!planId || !userId) {
			console.error("Missing required payment data", payment);
			return;
		}

		// Update or create subscription
		await prisma.subscription.upsert({
			where: {
				whopMembershipId: payment.id,
			},
			create: {
				communityId: communityId || "",
				userId,
				whopMembershipId: payment.id,
				planId,
				status: "active",
				startedAt: new Date(payment.created_at),
				expiresAt: new Date(
					planId === "yearly"
						? new Date().getTime() + 365 * 24 * 60 * 60 * 1000
						: new Date().getTime() + 30 * 24 * 60 * 60 * 1000
				),
				amount: (amount || 0) / 100, // Convert cents to dollars
			},
			update: {
				status: "active",
				expiresAt: new Date(
					planId === "yearly"
						? new Date().getTime() + 365 * 24 * 60 * 60 * 1000
						: new Date().getTime() + 30 * 24 * 60 * 60 * 1000
				),
			},
		});

		console.log(
			`[PAYMENT SUCCESS] User: ${userId}, Plan: ${planId}, Amount: $${amount / 100}`
		);
	} catch (error) {
		console.error("Error handling payment succeeded:", error);
	}
}

async function handlePaymentFailed(payment: any) {
	try {
		const userId = payment.user_id;
		const planId = payment.product?.metadata?.plan_id;

		console.log(
			`[PAYMENT FAILED] User: ${userId}, Plan: ${planId}, Reason: ${payment.failure_reason}`
		);

		// Optional: Send email notification or log to error tracking
	} catch (error) {
		console.error("Error handling payment failed:", error);
	}
}
