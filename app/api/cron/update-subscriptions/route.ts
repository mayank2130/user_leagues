// app/api/cron/update-subscriptions/route.ts
import { NextResponse } from "next/server";
import { updateExpiredSubscriptions } from "@/actions/subscription-actions";

/**
 * API endpoint to update expired subscriptions
 * Can be called by a cron job service (e.g., Vercel Cron, GitHub Actions, etc.)
 * 
 * Usage:
 * 1. Set up a cron job to call this endpoint periodically (e.g., every hour)
 * 2. Add authorization header with a secret token for security
 * 3. Example with Vercel Cron in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-subscriptions",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
	try {
		// Optional: Add authorization check
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Update all expired subscriptions
		const result = await updateExpiredSubscriptions();

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			updated: result.updated,
			message: `Successfully updated ${result.updated} expired subscription(s)`,
		});
	} catch (error) {
		console.error("Error in subscription update cron:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Also allow POST for flexibility
export async function POST(request: Request) {
	return GET(request);
}

