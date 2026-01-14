import prisma from '../server/config/db.js';

async function migrateExistingEvaluations() {
  try {
    console.log('🔍 Finding Ashish\'s admin account...');
    
    // Find Ashish's user account
    const ashishUser = await prisma.user.findFirst({
      where: {
        adminProfile: {
          name: {
            contains: 'Ashish',
            mode: 'insensitive'
          }
        }
      },
      include: {
        adminProfile: true
      }
    });

    if (!ashishUser) {
      console.log('⚠️  Ashish\'s account not found. Please enter evaluator details manually.');
      console.log('Looking for any superadmin account...');
      
      const superadmin = await prisma.user.findFirst({
        where: {
          role: 'superadmin'
        },
        include: {
          adminProfile: true
        }
      });

      if (!superadmin) {
        throw new Error('No admin account found to assign as evaluator');
      }

      console.log(`✅ Using ${superadmin.adminProfile?.name || superadmin.email} as default evaluator`);
      var evaluatorId = superadmin.id;
      var evaluatorName = superadmin.adminProfile?.name || 'Admin';
    } else {
      console.log(`✅ Found Ashish: ${ashishUser.adminProfile.name}`);
      var evaluatorId = ashishUser.id;
      var evaluatorName = ashishUser.adminProfile.name;
    }

    // Find all submissions that have a score but are not marked as evaluated
    console.log('\n🔍 Finding submissions with scores but not marked as evaluated...');
    
    const submissionsToUpdate = await prisma.problemSubmission.findMany({
      where: {
        score: {
          gt: 0
        },
        isEvaluated: false
      }
    });

    console.log(`\n📊 Found ${submissionsToUpdate.length} submissions to mark as evaluated`);

    if (submissionsToUpdate.length === 0) {
      console.log('✅ No submissions need migration. All done!');
      return;
    }

    console.log('\n🔄 Migrating submissions...');
    let updated = 0;
    let failed = 0;

    for (const submission of submissionsToUpdate) {
      try {
        // Update submission to mark as evaluated
        await prisma.problemSubmission.update({
          where: { id: submission.id },
          data: {
            manualMarks: submission.score, // Use the score as manual marks
            evaluatedBy: evaluatorId,
            evaluatedAt: submission.judgedAt || submission.submittedAt,
            isEvaluated: true,
            evaluatorComments: 'Previously evaluated'
          }
        });

        // Create evaluation history record
        await prisma.submissionEvaluation.create({
          data: {
            submissionId: submission.id,
            evaluatorId: evaluatorId,
            evaluatorName: evaluatorName,
            evaluatorRole: 'superadmin',
            marks: submission.score,
            comments: 'Previously evaluated (migrated)',
            action: 'create',
            previousMarks: null,
            previousComments: null,
            createdAt: submission.judgedAt || submission.submittedAt
          }
        });

        updated++;
        if (updated % 10 === 0) {
          console.log(`  ✓ Updated ${updated}/${submissionsToUpdate.length} submissions`);
        }
      } catch (error) {
        failed++;
        console.error(`  ✗ Failed to update submission ${submission.id}:`, error.message);
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${submissionsToUpdate.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingEvaluations()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
