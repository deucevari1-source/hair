// Quick DB inspection
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) process.env[m[1]] = m[2];
});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('\n=== CLIENTS ===');
  console.table(clients.map(c => ({ id: c.id, name: c.name, phone: c.phone, created: c.createdAt.toISOString() })));

  const appts = await prisma.appointment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, clientName: true, clientPhone: true, clientId: true, date: true, time: true, status: true, createdAt: true },
  });
  console.log('\n=== APPOINTMENTS ===');
  console.table(appts.map(a => ({ id: a.id, name: a.clientName, phone: a.clientPhone, clientId: a.clientId, date: a.date.toISOString().slice(0,10), time: a.time, status: a.status })));

  console.log(`\nTotals: ${clients.length === 10 ? '10+' : clients.length} clients, ${appts.length === 10 ? '10+' : appts.length} appointments shown`);
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
