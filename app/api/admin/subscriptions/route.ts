// app/api/admin/subscriptions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Admin API to view all subscriptions and their statuses
 * GET /api/admin/subscriptions - View all subscriptions
 * POST /api/admin/subscriptions - Manually update expired ones
 */
export async function GET() {
	try {
		const subscriptions = await prisma.subscription.findMany({
			orderBy: { createdAt: "desc" },
			take: 50,
		});

		const now = new Date();

		// Add computed fields
		const enrichedSubs = subscriptions.map((sub) => ({
			...sub,
			isExpired: sub.expiresAt ? sub.expiresAt < now : false,
			shouldBeExpired: sub.expiresAt && sub.expiresAt < now && sub.status === "active",
		}));

		return NextResponse.json({
			success: true,
			count: subscriptions.length,
			subscriptions: enrichedSubs,
			currentTime: now.toISOString(),
		});
	} catch (error) {
		console.error("Error fetching subscriptions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch subscriptions" },
			{ status: 500 }
		);
	}
}

export async function POST() {
	try {
		const now = new Date();

		// Find and update expired subscriptions
		const result = await prisma.subscription.updateMany({
			where: {
				status: "active",
				expiresAt: {
					lt: now,
				},
			},
			data: {
				status: "expired",
			},
		});

		return NextResponse.json({
			success: true,
			updated: result.count,
			message: `Updated ${result.count} subscription(s)`,
			currentTime: now.toISOString(),
		});
	} catch (error) {
		console.error("Error updating subscriptions:", error);
		return NextResponse.json(
			{ error: "Failed to update subscriptions" },
			{ status: 500 }
		);
	}
}

