// app/experiences/[experienceId]/page.tsx
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import MemberView from "@/components/member/MemberView";
import AdminDashboard from "@/components/admin/AdminDashboard";
import TrialExpired from "@/components/TrialExpired";
import { recordDailyCheckIn } from "@/actions/point-actions";
import {
  initializeFreeTrial,
  checkTrialStatus,
  updateExpiredSubscriptions,
} from "@/actions/subscription-actions";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await whopsdk.verifyUserToken(await headers());

  const [experience, user, access] = await Promise.all([
    whopsdk.experiences.retrieve(experienceId),
    whopsdk.users.retrieve(userId),
    whopsdk.users.checkAccess(experienceId, { id: userId }),
  ]);

  const companyId = experience.company.id;
  const isWhopAdmin = access.access_level === "admin";

  // Create/update community
  const community = await prisma.community.upsert({
    where: { whopId: companyId },
    update: {},
    create: {
      whopId: companyId,
      name: experience.company.title,
    },
  });

  // Update any expired subscriptions before checking trial status
  await updateExpiredSubscriptions();

  const memberRole = isWhopAdmin ? Role.ADMIN : Role.MEMBER;

  // Get or create the league for this community (only one per community)
  let league = await prisma.league.findUnique({
    where: { communityId: community.id },
    include: {
      tiers: {
        orderBy: { order: "asc" },
      },
    },
  });

  // If no league exists, create one with default tiers
  if (!league) {
    league = await prisma.league.create({
      data: {
        name: `${community.name} League`,
        communityId: community.id,
        tiers: {
          create: [
            { name: "Bronze", minScore: 0, order: 0 },
            { name: "Silver", minScore: 100, order: 1 },
            { name: "Gold", minScore: 250, order: 2 },
            { name: "Diamond", minScore: 500, order: 3 },
          ],
        },
      },
      include: {
        tiers: {
          orderBy: { order: "asc" },
        },
      },
    });
  }

  // Get the entry tier (lowest order)
  const entryTier = league.tiers[0];

  // Create or update member
  const member = await prisma.member.upsert({
    where: {
      communityId_whopId: {
        communityId: community.id,
        whopId: userId,
      },
    },
    update: {
      lastActive: new Date(),
      role: memberRole,
      name: user.name || user.username,
    },
    create: {
      communityId: community.id,
      whopId: userId,
      name: user.name || user.username,
      role: memberRole,
      currentTierId: entryTier.id,
      totalScore: 0,
    },
    include: {
      currentTier: {
        select: {
          id: true,
          name: true,
          order: true,
          color: true,
          icon: true,
        },
      },
    },
  });

  // Admin view
  if (member.role === Role.ADMIN) {
    // Initialize free trial for first-time admin
    await initializeFreeTrial(community.id, userId, "free_trial_5days");

    // Check trial status
    const trialStatus = await checkTrialStatus(community.id, userId);

    // If trial expired, show paywall
    //  if (!trialStatus.trialActive && trialStatus.status === "expired") {
    //    return <TrialExpired isAdmin={true} communityName={community.name} />;
    //  }

    return (
      <AdminDashboard
        params={{ communityId: community.id, experienceId }}
        trialDaysRemaining={trialStatus.daysRemaining}
        trialActive={trialStatus.trialActive}
        adminMemberId={member.id}
      />
    );
  }

  // Member view
  // Check trial status for members too
  const trialStatus = await checkTrialStatus(community.id, userId);

  // If trial expired, show locked screen for members
  //   if (!trialStatus.trialActive && trialStatus.status === "expired") {
  //     return <TrialExpired isAdmin={false} communityName={community.name} />;
  //   }

  await recordDailyCheckIn(member.id);

  // Member view - fetch full league data with tiers
  const leagueWithTiers = await prisma.league.findUnique({
    where: { id: league.id },
    include: {
      tiers: {
        orderBy: { order: "asc" },
        include: {
          messages: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  whopId: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      },
    },
  });

  // Refetch member to ensure all data is fresh (after check-in)
  const updatedMember = await prisma.member.findUnique({
    where: { id: member.id },
    include: {
      currentTier: {
        select: {
          id: true,
          name: true,
          order: true,
          color: true,
          icon: true,
        },
      },
    },
  });

  return (
    <MemberView
      member={updatedMember!}
      league={leagueWithTiers!}
      userName={user.name || user.username || "Member"}
      memberId={member.id}
    />
  );
}
