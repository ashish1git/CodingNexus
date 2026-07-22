#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import prisma from '../server/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const codesFile = path.join(__dirname, '..', 'server', 'dsa-codes.json');

const data = JSON.parse(fs.readFileSync(codesFile, 'utf-8'));
const [, , action, ...args] = process.argv;

function save() { fs.writeFileSync(codesFile, JSON.stringify(data, null, 2)); }

async function main() {
  if (action === 'add') {
    const label = args[0] || 'default';
    const maxUses = parseInt(args[1]) || 0;
    const code = 'CNX-DSA-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    data.codes.push({ code, label, maxUses: maxUses || 0, used: 0, created: new Date().toISOString() });
    save();
    console.log(`✅ Code: ${code}  (label: ${label}${maxUses ? ', max uses: ' + maxUses : ', unlimited'})`);
  } else if (action === 'list') {
    if (data.codes.length === 0) console.log('No codes yet. Run: node scripts/dsa-codes.mjs add');
    else data.codes.forEach(c => console.log(`${c.code} | ${c.label} | used: ${c.used}${c.maxUses ? '/' + c.maxUses : '/∞'} | ${c.created}`));
  } else if (action === 'remove') {
    const code = args[0];
    if (!code) { console.log('Usage: node scripts/dsa-codes.mjs remove <code>'); process.exit(1); }
    const idx = data.codes.findIndex(c => c.code === code);
    if (idx === -1) { console.log('Code not found:', code); process.exit(1); }
    data.codes.splice(idx, 1);
    save();
    console.log(`Removed code: ${code} (already-unlocked students still have access — use revoke <email>)`);
  } else if (action === 'revoke') {
    const email = args[0];
    if (!email) { console.log('Usage: node scripts/dsa-codes.mjs revoke <email>'); process.exit(1); }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.log('Student not found:', email); process.exit(1); }
    await prisma.student.upsert({
      where: { userId: user.id },
      update: { dsaAccess: false },
      create: { userId: user.id, name: user.name || 'Unknown', batch: 'unknown', dsaAccess: false },
    });
    console.log(`✅ Revoked DSA access from: ${email}`);
  } else if (action === 'revoke-all') {
    const { count } = await prisma.student.updateMany({ where: { dsaAccess: true }, data: { dsaAccess: false } });
    console.log(`✅ Revoked DSA access from ${count} student(s)`);
  } else {
    console.log(`
  node scripts/dsa-codes.mjs add [label] [maxUses]   — generate a code
  node scripts/dsa-codes.mjs list                     — list all codes
  node scripts/dsa-codes.mjs remove <code>            — delete a code (does NOT revoke)
  node scripts/dsa-codes.mjs revoke <email>           — revoke access from one student
  node scripts/dsa-codes.mjs revoke-all               — revoke access from ALL students`);
  }
  await prisma.$disconnect();
  process.exit(0);
}
main();
