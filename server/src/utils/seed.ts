import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User, hashPassword } from '../models/User.js';

async function seed() {
  await connectDB();
  const existing = await User.findOne({ email: env.seed.email.toLowerCase() });
  if (existing) {
    console.log(`✓ Admin already exists: ${existing.email}`);
  } else {
    const user = await User.create({
      name: env.seed.name,
      email: env.seed.email.toLowerCase(),
      passwordHash: await hashPassword(env.seed.password),
      role: 'admin',
    });
    console.log(`✓ Created admin: ${user.email} (password from SEED_ADMIN_PASSWORD)`);
  }
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
