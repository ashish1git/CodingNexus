/**
 * PRODUCTION-READY: Submission Export Utility for Node.js
 * Exports student submissions to CSV/JSON for manual evaluation
 * Compatible with Express.js backend
 * 
 * Usage:
 *   node export-submissions.js --competition <id> --format csv --output ./exports
 *   node export-submissions.js --problem <id> --format json
 */

import fs from 'fs';
import path from 'path';
import prisma from '../server/config/db.js';
import { Parser } from 'json2csv';
import { createWriteStream } from 'fs';

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export submissions by problem to CSV
 * @param {string} problemId - Problem UUID
 * @param {string} outputDir - Output directory path
 * @returns {Promise<string>} Path to created CSV file
 */
async function exportProblemToCSV(problemId, outputDir = './exports') {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Fetch submissions
    const submissions = await prisma.problemSubmission.findMany({
      where: { problemId },
      include: {
        user: {
          include: { studentProfile: true }
        },
        problem: true
      },
      orderBy: [
        { user: { studentProfile: { name: 'asc' } } },
        { submittedAt: 'desc' }
      ]
    });

    if (submissions.length === 0) {
      console.warn(`No submissions found for problem ${problemId}`);
      return null;
    }

    // Format data for CSV
    const csvData = submissions.map((sub) => ({
      'Student Name': sub.user.studentProfile?.name || 'N/A',
      'Roll Number': sub.user.studentProfile?.rollNo || 'N/A',
      'Email': sub.user.email,
      'Language': sub.language,
      'Status': sub.status,
      'Score': `${sub.score}/${sub.maxScore}`,
      'Tests Passed': `${sub.testsPassed}/${sub.totalTests}`,
      'Execution Time (ms)': sub.executionTime,
      'Error': sub.errorMessage || 'N/A',
      'Submitted At': new Date(sub.submittedAt).toISOString(),
      'Code': sub.code // Large field - may need separate handling
    }));

    // Get problem title for filename
    const problem = submissions[0].problem;
    const safeTitle = problem.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);

    const filename = `${safeTitle}_${problemId.substring(0, 8)}.csv`;
    const filepath = path.join(outputDir, filename);

    // Generate CSV
    try {
      const parser = new Parser({
        fields: [
          'Student Name', 'Roll Number', 'Email', 'Language', 'Status',
          'Score', 'Tests Passed', 'Execution Time (ms)', 'Error',
          'Submitted At', 'Code'
        ],
        quote: '"',
        escape: '"'
      });
      
      const csv = parser.parse(csvData);
      fs.writeFileSync(filepath, csv, 'utf-8');
      
      console.log(`✅ Exported: ${filepath} (${submissions.length} submissions)`);
      return filepath;
    } catch (parseError) {
      // Fallback: manual CSV generation without external parser
      return generateCSVManually(csvData, filepath, submissions.length);
    }
  } catch (error) {
    console.error('❌ Export error:', error.message);
    throw error;
  }
}

/**
 * Manual CSV generation (fallback)
 */
function generateCSVManually(data, filepath, count) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] || '';
        // Escape quotes in values
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  fs.writeFileSync(filepath, csv, 'utf-8');
  console.log(`✅ Exported: ${filepath} (${count} submissions)`);
  return filepath;
}

/**
 * Export entire competition (all problems) to separate CSVs
 * @param {string} competitionId - Competition UUID
 * @param {string} outputDir - Output directory path
 * @returns {Promise<Array>} Array of created file paths
 */
async function exportCompetitionToCSVs(competitionId, outputDir = './exports') {
  try {
    // Get all problems in competition
    const problems = await prisma.problem.findMany({
      where: { competitionId },
      orderBy: { orderIndex: 'asc' }
    });

    if (problems.length === 0) {
      console.warn(`No problems found for competition ${competitionId}`);
      return [];
    }

    const exportedFiles = [];
    
    // Export each problem
    for (const problem of problems) {
      const filepath = await exportProblemToCSV(problem.id, outputDir);
      if (filepath) {
        exportedFiles.push(filepath);
      }
    }

    // Also generate summary report
    const summaryPath = await generateSummaryReport(competitionId, outputDir);
    exportedFiles.push(summaryPath);

    console.log(`\n✅ Competition export complete: ${exportedFiles.length} files created`);
    return exportedFiles;
  } catch (error) {
    console.error('❌ Competition export error:', error.message);
    throw error;
  }
}

/**
 * Export to JSON format
 */
async function exportProblemToJSON(problemId, outputDir = './exports') {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const submissions = await prisma.problemSubmission.findMany({
      where: { problemId },
      include: {
        user: { include: { studentProfile: true } },
        problem: true
      },
      orderBy: [
        { user: { studentProfile: { name: 'asc' } } },
        { submittedAt: 'desc' }
      ]
    });

    const jsonData = {
      problem: submissions[0]?.problem,
      submissionCount: submissions.length,
      submissions: submissions.map(sub => ({
        studentName: sub.user.studentProfile?.name,
        rollNo: sub.user.studentProfile?.rollNo,
        email: sub.user.email,
        language: sub.language,
        code: sub.code,
        status: sub.status,
        score: `${sub.score}/${sub.maxScore}`,
        testsPassed: `${sub.testsPassed}/${sub.totalTests}`,
        submittedAt: sub.submittedAt
      }))
    };

    const problem = submissions[0].problem;
    const safeTitle = problem.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 50);

    const filepath = path.join(outputDir, `${safeTitle}.json`);
    fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2), 'utf-8');

    console.log(`✅ Exported JSON: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('❌ JSON export error:', error.message);
    throw error;
  }
}

/**
 * Generate evaluation summary report
 */
async function generateSummaryReport(competitionId, outputDir = './exports') {
  try {
    const summary = await prisma.problem.findMany({
      where: { competitionId },
      select: {
        id: true,
        title: true,
        difficulty: true,
        points: true,
        submissions: {
          select: {
            score: true,
            status: true,
            userId: true
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    const reportData = summary.map(problem => {
      const submissions = problem.submissions;
      const acceptedCount = submissions.filter(s => s.status === 'accepted').length;
      const avgScore = submissions.length > 0
        ? (submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length).toFixed(2)
        : 0;

      return {
        Problem: problem.title,
        Difficulty: problem.difficulty,
        'Max Points': problem.points,
        'Total Submissions': submissions.length,
        'Accepted': acceptedCount,
        'Acceptance Rate': submissions.length > 0
          ? ((acceptedCount / submissions.length) * 100).toFixed(2) + '%'
          : '0%',
        'Average Score': avgScore,
        'Max Score': Math.max(...submissions.map(s => s.score), 0),
        'Min Score': submissions.length > 0 ? Math.min(...submissions.map(s => s.score)) : 0
      };
    });

    const filepath = path.join(outputDir, 'evaluation-summary.csv');
    const headers = Object.keys(reportData[0]);
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...reportData.map(row =>
        headers.map(h => `"${row[h] || ''}"`).join(',')
      )
    ].join('\n');

    fs.writeFileSync(filepath, csv, 'utf-8');
    console.log(`✅ Summary report: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('❌ Summary report error:', error.message);
    throw error;
  }
}

/**
 * Export code files separately (for large submissions)
 */
async function exportCodeFiles(problemId, outputDir = './exports') {
  try {
    const submissions = await prisma.problemSubmission.findMany({
      where: { problemId },
      include: {
        user: { include: { studentProfile: true } },
        problem: true
      }
    });

    const problem = submissions[0].problem;
    const codeDir = path.join(outputDir, `${problem.title.replace(/\s+/g, '_')}_code`);

    if (!fs.existsSync(codeDir)) {
      fs.mkdirSync(codeDir, { recursive: true });
    }

    const extensionMap = {
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      javascript: 'js'
    };

    for (const sub of submissions) {
      const studentName = sub.user.studentProfile?.name?.replace(/\s+/g, '_') || 'unknown';
      const ext = extensionMap[sub.language] || 'txt';
      const filename = `${studentName}_${sub.language}.${ext}`;
      const filepath = path.join(codeDir, filename);

      fs.writeFileSync(filepath, sub.code, 'utf-8');
    }

    console.log(`✅ Code files exported to: ${codeDir}`);
    return codeDir;
  } catch (error) {
    console.error('❌ Code export error:', error.message);
    throw error;
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: node export-submissions.js [options]

Options:
  --competition <id>    Export all problems from competition
  --problem <id>        Export single problem
  --format <csv|json>   Output format (default: csv)
  --output <dir>        Output directory (default: ./exports)
  --code-files          Export code to separate files
  --summary             Generate summary report

Examples:
  node export-submissions.js --competition abc123 --format csv
  node export-submissions.js --problem xyz789 --format json
  node export-submissions.js --competition abc123 --code-files
    `);
    process.exit(0);
  }

  try {
    const competitionId = args[args.indexOf('--competition') + 1];
    const problemId = args[args.indexOf('--problem') + 1];
    const format = args[args.indexOf('--format') + 1] || 'csv';
    const outputDir = args[args.indexOf('--output') + 1] || './exports';
    const codeFiles = args.includes('--code-files');
    const summary = args.includes('--summary');

    if (competitionId) {
      console.log(`📊 Exporting competition: ${competitionId}\n`);
      await exportCompetitionToCSVs(competitionId, outputDir);
    } else if (problemId) {
      console.log(`📝 Exporting problem: ${problemId}\n`);
      if (format === 'json') {
        await exportProblemToJSON(problemId, outputDir);
      } else {
        await exportProblemToCSV(problemId, outputDir);
      }
      
      if (codeFiles) {
        console.log(`\n📁 Exporting code files separately...\n`);
        await exportCodeFiles(problemId, outputDir);
      }
    }

    if (summary) {
      console.log(`\n📊 Generating summary...\n`);
      await generateSummaryReport(competitionId || problemId, outputDir);
    }

    console.log(`\n✅ Export complete! Files in: ${outputDir}`);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  exportProblemToCSV,
  exportCompetitionToCSVs,
  exportProblemToJSON,
  exportCodeFiles,
  generateSummaryReport
};
