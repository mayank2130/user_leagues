"use server";

import { prisma } from "@/lib/prisma";

export async function createTier(data: {
	name: string;
	description: string;
	minScore: number;
	order: number;
	color: string;
	icon: string;
	communityId: string;
}) {
	// Get the first league for this community
	let league = await prisma.league.findFirst({
		where: { communityId: data.communityId },
	});

	// If no league exists, create one
	if (!league) {
		league = await prisma.league.create({
			data: {
				name: "Default League",
				communityId: data.communityId,
			},
		});
	}

	const tier = await prisma.tier.create({
		data: {
			name: data.name,
			description: data.description,
			minScore: data.minScore,
			order: data.order,
			color: data.color,
			icon: data.icon,
			leagueId: league.id,
		},
	});
	return { success: true, tier };
}
