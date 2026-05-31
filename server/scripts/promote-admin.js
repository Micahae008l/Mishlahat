/**
 * Promote a user to admin by email.
 * Usage: node scripts/promote-admin.js [email]
 * Or set ADMIN_EMAIL in server/.env and run without args.
 */
import "../env.js";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

async function main() {
  const email = String(process.argv[2] || process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();

  if (!email.includes("@")) {
    console.error("Usage: node scripts/promote-admin.js <email>");
    console.error("Or set ADMIN_EMAIL in server/.env and run without arguments.");
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
