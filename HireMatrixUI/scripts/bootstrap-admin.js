const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    console.log("[bootstrap-admin] users already exist; skipping seed");
    return;
  }

  const tenantId = process.env.ADMIN_TENANT_ID || "00000000-0000-0000-0000-000000000001";
  const tenantName = process.env.ADMIN_TENANT_NAME || "Default Tenant";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@hirematrix.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminName = process.env.ADMIN_NAME || "Admin";

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: tenantName },
    create: {
      id: tenantId,
      name: tenantName,
      plan: "free",
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: "admin",
      tenantId: tenant.id,
      password: passwordHash,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: "admin",
      tenantId: tenant.id,
      password: passwordHash,
    },
  });

  console.log(`[bootstrap-admin] created default admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error("[bootstrap-admin] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
