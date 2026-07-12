import mongoose from "mongoose";

const blockedIpSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reason: { type: String, default: "" },
    blockedBy: { type: String, default: "", lowercase: true, trim: true },
    /** Hits rejected while this block has been active. */
    hitCount: { type: Number, default: 0, min: 0 },
    lastHitAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("BlockedIp", blockedIpSchema);
