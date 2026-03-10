import xlsx from 'xlsx';
import fs from 'fs';
import { parseString } from 'xml2js';

const xmlContent = fs.readFileSync('/home/apsit/projects/codingnexus/Mcodingnexus/users.xml', 'utf8');

parseString(xmlContent, {
  explicitArray: false,
  mergeAttrs: true
}, (err, result) => {
  if (err) {
    console.error('Error parsing XML:', err);
    process.exit(1);
  }

  const students = [];
  const workbook = result.Workbook;
  const worksheet = workbook['ss:Worksheet'] || workbook.Worksheet;
  const table = worksheet.Table;
  let rows = table.Row;

  if (!Array.isArray(rows)) rows = [rows];

  // Skip header, start from row 1
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    let cells = row.Cell;
    if (!Array.isArray(cells)) cells = [cells];

    if (cells.length < 2) continue;

    let moodleId = cells[0]?.Data?._ || cells[0]?.Data || '';
    let name = cells[1]?.Data?._ || cells[1]?.Data || '';

    if (moodleId && name) {
      students.push([moodleId.toString().trim(), name.toString().trim()]);
    }
  }

  // Create Excel file
  const data = [['Moodle ID', 'Name'], ...students];
  const ws = xlsx.utils.aoa_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Students');
  xlsx.writeFile(wb, '/home/apsit/projects/codingnexus/Mcodingnexus/users.xlsx');

  console.log(`✅ Created users.xlsx with ${students.length} students!`);
});
