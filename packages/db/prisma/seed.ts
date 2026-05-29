/**
 * Ananta — seed script
 * Run: pnpm db:seed
 *
 * Creates the 6 subjects, 6 teachers, KSEEB chapter list per subject,
 * default plans (₹299/mo, ₹799/qtr, ₹2,499/yr, sibling ₹499/mo),
 * and the launch-gate config.
 */
import { PrismaClient, Grade, SubjectCode, DayOfWeek, PlanInterval } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubjects() {
  const subjects = [
    {
      code: SubjectCode.MATHS,
      nameEn: 'Mathematics',
      nameKn: 'ಗಣಿತ',
      nameHi: 'गणित',
      teacherName: 'Praketa',
      teacherSlug: 'praketa',
      teacherBioEn: 'Praketa makes numbers approachable. Loves geometry, hates ambiguity.',
      teacherBioKn: 'ಪ್ರಕೇತ ಸಂಖ್ಯೆಗಳನ್ನು ಸುಲಭಗೊಳಿಸುತ್ತಾರೆ. ಜ್ಯಾಮಿತಿ ಪ್ರೀತಿ.',
      themeColor: '#3B82F6',
      weeklyDay: DayOfWeek.MON,
      isLanguage: false,
      orderIndex: 1,
    },
    {
      code: SubjectCode.SCIENCE,
      nameEn: 'Science',
      nameKn: 'ವಿಜ್ಞಾನ',
      teacherName: 'Vihaan',
      teacherSlug: 'vihaan',
      teacherBioEn: 'Vihaan brings the lab to your screen — animated experiments, real intuition.',
      themeColor: '#F59E0B',
      weeklyDay: DayOfWeek.TUE,
      isLanguage: false,
      orderIndex: 2,
    },
    {
      code: SubjectCode.SOCIAL,
      nameEn: 'Social Science',
      nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ',
      teacherName: 'Adhvara',
      teacherSlug: 'adhvara',
      teacherBioEn: 'Adhvara tells history like a story you remember at exam time.',
      themeColor: '#E11D48',
      weeklyDay: DayOfWeek.WED,
      isLanguage: false,
      orderIndex: 3,
    },
    {
      code: SubjectCode.KANNADA,
      nameEn: 'Kannada (1st Language)',
      nameKn: 'ಕನ್ನಡ (ಪ್ರಥಮ ಭಾಷೆ)',
      teacherName: 'Harini',
      teacherSlug: 'harini',
      teacherBioEn: 'Harini brings Kannada poetry alive — vachanas, kavyas, and modern prose.',
      teacherBioKn: 'ಹರಿಣಿ ಕನ್ನಡ ಸಾಹಿತ್ಯವನ್ನು ಜೀವಂತಗೊಳಿಸುತ್ತಾರೆ.',
      themeColor: '#0D9488',
      weeklyDay: DayOfWeek.THU,
      isLanguage: true,
      orderIndex: 4,
    },
    {
      code: SubjectCode.ENGLISH,
      nameEn: 'English (2nd Language)',
      nameKn: 'ಇಂಗ್ಲಿಷ್ (ದ್ವಿತೀಯ ಭಾಷೆ)',
      teacherName: 'Anika',
      teacherSlug: 'anika',
      teacherBioEn: 'Anika makes English feel like a conversation, not a textbook.',
      themeColor: '#0EA5E9',
      weeklyDay: DayOfWeek.FRI,
      isLanguage: true,
      orderIndex: 5,
    },
    {
      code: SubjectCode.HINDI,
      nameEn: 'Hindi (3rd Language)',
      nameKn: 'ಹಿಂದಿ (ತೃತೀಯ ಭಾಷೆ)',
      teacherName: 'Amita',
      teacherSlug: 'amita',
      teacherBioEn: 'Amita teaches Hindi with warmth and steady rhythm.',
      themeColor: '#D946EF',
      weeklyDay: DayOfWeek.SAT,
      isLanguage: true,
      orderIndex: 6,
    },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: s,
      create: s,
    });
  }
  console.log(`✓ Seeded ${subjects.length} subjects`);
}

async function seedPlans() {
  const plans = [
    {
      razorpayPlanId: 'plan_monthly_solo',
      name: 'Monthly Solo',
      interval: PlanInterval.MONTHLY,
      amountInr: 299,
      maxSeats: 1,
    },
    {
      razorpayPlanId: 'plan_quarterly_solo',
      name: 'Quarterly Solo',
      interval: PlanInterval.QUARTERLY,
      amountInr: 799,
      maxSeats: 1,
    },
    {
      razorpayPlanId: 'plan_yearly_solo',
      name: 'Yearly Solo',
      interval: PlanInterval.YEARLY,
      amountInr: 2499,
      maxSeats: 1,
    },
    {
      razorpayPlanId: 'plan_monthly_sibling',
      name: 'Sibling Pack (Monthly)',
      interval: PlanInterval.MONTHLY,
      amountInr: 499,
      maxSeats: 2,
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { razorpayPlanId: p.razorpayPlanId },
      update: p,
      create: p,
    });
  }
  console.log(`✓ Seeded ${plans.length} plans`);
}

async function seedLaunchGate() {
  const existing = await prisma.launchGateConfig.findFirst();
  if (!existing) {
    await prisma.launchGateConfig.create({
      data: {
        minMembers: 10,
        targetLaunchDate: new Date('2026-07-01T00:00:00Z'),
        isLaunched: false,
      },
    });
    console.log('✓ Seeded launch gate (≥10 members, target 2026-07-01)');
  } else {
    console.log('• Launch gate already configured');
  }
}

async function seedAchievements() {
  const achievements = [
    { slug: 'first-class', titleEn: 'First Steps', description: 'Attend your first live class', xpReward: 50 },
    { slug: '7-day-streak', titleEn: 'On Fire', description: '7-day attendance streak', xpReward: 200 },
    { slug: '30-day-streak', titleEn: 'Iron Will', description: '30-day attendance streak', xpReward: 1000 },
    { slug: 'quiz-perfect', titleEn: 'Bullseye', description: 'Score 100% on any quiz', xpReward: 100 },
    { slug: 'weekly-test-top10', titleEn: 'Top of the Class', description: 'Rank top 10 on weekly test', xpReward: 300 },
    { slug: 'memory-deck-50', titleEn: 'Memory Master', description: 'Master 50 Memory Deck cards', xpReward: 250 },
    { slug: 'doubt-asker', titleEn: 'Curious Mind', description: 'Ask 10 doubts in live class', xpReward: 150 },
    { slug: 'referrer', titleEn: 'Word of Mouth', description: 'Refer a friend who joins', xpReward: 500 },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
  }
  console.log(`✓ Seeded ${achievements.length} achievements`);
}

async function main() {
  console.log('🌱 Seeding Ananta database...\n');
  await seedSubjects();
  await seedPlans();
  await seedLaunchGate();
  await seedAchievements();
  console.log('\n✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
