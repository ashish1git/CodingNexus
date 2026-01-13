/**
 * Export all student submissions per question/problem
 * Creates a CSV file with all students' submissions organized by problem
 * 
 * Usage:
 *   node export-submissions-per-question.js --competition <id>
 *   node export-submissions-per-question.js --competition <id> --output ./exports
 */

import fs from 'fs';
import path from 'path';
import prisma from '../server/config/db.js';

/**
 * Export all submissions per question
 * @param {string} competitionId - Competition UUID
 * @param {string} outputDir - Output directory path
 * @returns {Promise<string>} Path to created CSV file
 */
async function exportSubmissionsPerQuestion(competitionId, outputDir = './exports') {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Fetch all problems for the competition
    const problems = await prisma.problem.findMany({
      where: { competitionId },
      orderBy: { orderIndex: 'asc' }
    });

    if (problems.length === 0) {
      console.warn(`No problems found for competition ${competitionId}`);
      return null;
    }

    // Fetch all submissions for this competition
    const submissions = await prisma.problemSubmission.findMany({
      where: {
        problem: { competitionId }
      },
      include: {
        user: {
          include: { studentProfile: true }
        },
        problem: true
      },
      orderBy: [
        { problemId: 'asc' },
        { user: { studentProfile: { name: 'asc' } } },
        { submittedAt: 'desc' }
      ]
    });

    if (submissions.length === 0) {
      console.warn(`No submissions found for competition ${competitionId}`);
      return null;
    }

    // Format data for CSV - one row per submission
    const csvData = submissions.map((sub) => ({
      'Problem Title': sub.problem.title,
      'Problem ID': sub.problem.id,
      'Student Name': sub.user.studentProfile?.name || 'N/A',
      'Roll Number': sub.user.studentProfile?.rollNo || 'N/A',
      'Email': sub.user.email,
      'Language': sub.language,
      'Status': sub.status,
      'Score': `${sub.score}/${sub.maxScore}`,
      'Tests Passed': `${sub.testsPassed}/${sub.totalTests}`,
      'Execution Time (ms)': sub.executionTime,
      'Memory Used (KB)': sub.memoryUsed,
      'Error': sub.errorMessage || 'N/A',
      'Submitted At': new Date(sub.submittedAt).toISOString(),
      'Code': sub.code
    }));

    // Get competition title for filename
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId }
    });

    const safeTitle = (competition?.title || 'competition')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);

    const filename = `${safeTitle}_all_submissions_${competitionId.substring(0, 8)}.csv`;
    const filepath = path.join(outputDir, filename);

    // Generate CSV manually
    const headers = [
      'Problem Title',
      'Problem ID',
      'Student Name',
      'Roll Number',
      'Email',
      'Language',
      'Status',
      'Score',
      'Tests Passed',
      'Execution Time (ms)',
      'Memory Used (KB)',
      'Error',
      'Submitted At',
      'Code'
    ];

    const csvContent = generateCSV(csvData, headers);
    fs.writeFileSync(filepath, csvContent, 'utf-8');

    console.log(`✅ Exported: ${filepath}`);
    console.log(`📊 Total submissions: ${submissions.length}`);
    console.log(`❓ Total problems: ${problems.length}`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Manually generate CSV to avoid dependency issues
 * @param {Array} data - Array of objects
 * @param {Array} headers - CSV headers
 * @returns {string} CSV content
 */
function generateCSV(data, headers) {
  // Escape CSV values
  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Create header row
  const headerRow = headers.map(escapeCsvValue).join(',');

  // Create data rows
  const dataRows = data.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Export multiple competitions at once
 */
async function exportMultipleCompetitions(competitionIds, outputDir) {
  const results = [];
  
  for (const id of competitionIds) {
    try {
      console.log(`\n📥 Processing competition: ${id}`);
      const filepath = await exportSubmissionsPerQuestion(id, outputDir);
      if (filepath) {
        results.push({ id, status: '✅ Success', path: filepath });
      }
    } catch (error) {
      results.push({ id, status: '❌ Failed', error: error.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.status} - ${r.id}`);
    if (r.path) console.log(`   📁 ${r.path}`);
    if (r.error) console.log(`   ⚠️  ${r.error}`);
  });
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

const args = process.argv.slice(2);
let competitionIds = [];
let outputDir = './exports';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--competition' && args[i + 1]) {
    // Support multiple competitions: --competition id1 id2 id3
    while (args[i + 1] && !args[i + 1].startsWith('--')) {
      competitionIds.push(args[i + 1]);
      i++;
    }
  } else if (args[i] === '--output' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  }
}

if (competitionIds.length === 0) {
  console.error('❌ Error: at least one --competition <id> is required');
  console.error('\nUsage:');
  console.error('  node export-submissions-per-question.js --competition <id>');
  console.error('  node export-submissions-per-question.js --competition <id1> <id2> <id3>');
  console.error('  node export-submissions-per-question.js --competition <id> --output ./exports');
  process.exit(1);
}

// Run export
if (competitionIds.length === 1) {
  exportSubmissionsPerQuestion(competitionIds[0], outputDir);
} else {
  exportMultipleCompetitions(competitionIds, outputDir);
}
