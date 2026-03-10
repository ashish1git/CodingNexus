import xlsx from 'xlsx';

// Read ODS file
const workbook = xlsx.readFile('/home/apsit/projects/codingnexus/Mcodingnexus/users.ods');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

// Write to XLSX
const ws = xlsx.utils.aoa_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Students');
xlsx.writeFile(wb, '/home/apsit/projects/codingnexus/Mcodingnexus/users.xlsx');

console.log(`✅ Created users.xlsx with ${data.length - 1} students!`);
