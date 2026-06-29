import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    preferredName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pre-Draft", "Active Duty", "Discharged"],
      default: "Pre-Draft",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    /** Per-user lifetime AI token cap; null inherits DEFAULT_USER_TOKEN_CAP. Admins ignore caps. */
    tokenCap: {
      type: Number,
      default: null,
      min: 0,
    },
    /** Paid plan. "pro" = active subscription (see planExpiresAt). Admins bypass all gates. */
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
      index: true,
    },
    /** When the "pro" plan lapses. null while on free. */
    planExpiresAt: {
      type: Date,
      default: null,
    },
    /** Prepaid full-report generations remaining. Consumed one per successful report. */
    reportCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
