import mongoose from "mongoose";

const RETENTION_DAYS = 30;

/**
 * Cache of a computed match result, keyed by a hash of everything that affects
 * it (profile + catalog + prompt + engine). An identical re-run returns the
 * saved roles instantly — no OpenAI cost, byte-identical output, and (because it
 * is logged as `cache_hit`, not `success`) it does not consume a free use.
 */
const aiMatchResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileHash: { type: String, required: true, index: true },
    engineVersion: { type: String, default: "" },
    endpoint: { type: String, default: "match-roles" },
    roles: { type: Array, default: [] },
  },
  { timestamps: true }
);

aiMatchResultSchema.index({ userId: 1, profileHash: 1 });
// Auto-expire so a stale profile's cache cannot outlive relevance.
aiMatchResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

export default mongoose.model("AiMatchResult", aiMatchResultSchema);
