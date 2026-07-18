import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = path.resolve(__dirname, '../dsasheet/DSA Master Sheet.xlsx');
const outPath = path.resolve(__dirname, '../src/data/dsaProblems.json');

const wb = xlsx.readFile(excelPath);
const ws = wb.Sheets['DSA Sheet Final'];
const range = xlsx.utils.decode_range(ws['!ref']);

const problems = [];
let currentPhase = '', currentTopic = '', currentSubtopic = '';
let studyDay = 0, globalOrder = 0;

const difficultyStarMap = {
  '★☆☆☆☆': 'Very Easy',
  '★★☆☆☆': 'Easy',
  '★★★☆☆': 'Medium',
  '★★★★☆': 'Hard',
  '★★★★★': 'Very Hard',
};

for (let R = 2; R <= range.e.r; R++) {
  const getCell = (c) => {
    const addr = xlsx.utils.encode_cell({ r: R, c });
    const cell = ws[addr];
    return cell ? (cell.v ?? '').toString().trim() : '';
  };

  const col0 = getCell(0);
  const col2 = getCell(2);
  const col3 = getCell(3);
  const col4 = getCell(4);
  const col6 = getCell(6);
  const col18 = getCell(18);

  if (col0.startsWith('PHASE')) {
    currentPhase = col0;
    continue;
  }

  if (col2) currentTopic = col2;
  if (col3) currentSubtopic = col3;
  if (!col4 || col4 === 'Problem Name') continue;

  // Extract hyperlink from column F
  const linkAddr = xlsx.utils.encode_cell({ r: R, c: 5 });
  const linkCell = ws[linkAddr];
  let url = '';
  if (linkCell?.l?.Target) url = linkCell.l.Target;

  const diffNum = parseInt(col6) || 0;
  const diffFromStars = difficultyStarMap[col18] || '';
  const difficulty = diffNum
    ? ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][diffNum] || ''
    : diffFromStars;

  globalOrder++;
  const problemsPerDay = 8;
  if (globalOrder % problemsPerDay === 1) studyDay++;

  problems.push({
    id: globalOrder,
    title: col4,
    difficulty,
    leetcodeUrl: url,
    companies: [],
    topic: currentTopic,
    subtopic: currentSubtopic,
    phase: currentPhase,
    studyDay,
    order: globalOrder,
    estimatedMinutes:
      difficulty === 'Very Easy' ? 5
      : difficulty === 'Easy' ? 10
      : difficulty === 'Medium' ? 20
      : difficulty === 'Hard' ? 35
      : difficulty === 'Very Hard' ? 45
      : 15,
  });
}

// Ensure data directory
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(problems, null, 2));

console.log(`✅ Generated ${problems.length} problems → src/data/dsaProblems.json`);
console.log(`   Topics: ${new Set(problems.map(p => p.topic)).size}`);
console.log(`   Study Days: ${studyDay}`);
console.log(`   Phases: ${new Set(problems.map(p => p.phase)).size}`);
