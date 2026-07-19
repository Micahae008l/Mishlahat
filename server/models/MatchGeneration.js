import mongoose from "mongoose";

const RETENTION_DAYS = 90;

/** Append-only history of paid/free-use match generations (not cache hits). */
const matchGenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileHash: { type: String, default: "", index: true },
    engineVersion: { type: String, default: "" },
    roles: { type: Array, default: [] },
    topRole: { type: String, default: "" },
    topMatch: { type: Number, default: null },
  },
  { timestamps: true }
);

matchGenerationSchema.index({ userId: 1, createdAt: -1 });
matchGenerationSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

export default mongoose.model("MatchGeneration", matchGenerationSchema);
