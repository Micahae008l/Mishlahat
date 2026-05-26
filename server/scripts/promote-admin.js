/**
 * Promote a user to admin by email.
 * Usage: node scripts/promote-admin.js [email]
 * Default email: mike.haddad.08@gmail.com
 */
import "../env.js";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const DEFAULT_EMAIL = "mike.haddad.08@gmail.com";

async function main() {
  const email = String(process.argv[2] || DEFAULT_EMAIL)
    .trim()
    .toLowerCase();

  if (!email.includes("@")) {
    console.error("Invalid email:", email);
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role: "admin" } },
    { new: true }
  );

  if (!user) {
    console.error(
      `No user found for ${email}. Log in once with OTP so the account exists, then run this script again.`
    );
    process.exit(1);
  }

  console.log(`Promoted to admin: ${user.email} (${user._id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
