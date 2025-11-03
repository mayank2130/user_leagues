import { Prisma } from "@prisma/client";

// Member with current tier info
export type MemberWithTier = Prisma.MemberGetPayload<{
	include: {
		currentTier: {
			select: {
				id: true;
				name: true;
				order: true;
				color: true;
				icon: true;
			};
		};
	};
}>;

// Simple tier without messages (for lists, etc)
export type SimpleTier = Prisma.TierGetPayload<{
	select: {
		id: true;
		name: true;
		description: true;
		minScore: true;
		order: true;
		color: true;
		icon: true;
	};
}>;

// Tier with all its messages and authors
export type TierWithMessages = Prisma.TierGetPayload<{
	include: {
		messages: {
			include: {
				author: {
					select: {
						id: true;
						name: true;
						whopId: true;
					};
				};
			};
		};
	};
}>;

// Full league with tiers and messages
export type LeagueWithTiers = Prisma.LeagueGetPayload<{
	include: {
		tiers: {
			include: {
				messages: {
					include: {
						author: {
							select: {
								id: true;
								name: true;
								whopId: true;
							};
						};
					};
				};
			};
		};
	};
}>;

// Message with author
export type MessageWithAuthor = Prisma.MessageGetPayload<{
	include: {
		author: {
			select: {
				id: true;
				name: true;
				whopId: true;
			};
		};
	};
}>;
