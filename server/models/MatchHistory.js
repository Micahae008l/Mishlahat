import mongoose from "mongoose";

const matchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topRole: { type: String, default: "", trim: true },
    topMatch: { type: Number, default: null },
    confidence: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    confidenceNotes: { type: [String], default: [] },
    roles: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    /** Profile snapshot at run time — lets the UI explain "why results changed". */
    profileSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    promptVersion: { type: String, default: "" },
    model: { type: String, default: "" },
  },
  { timestamps: true }
);

matchHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("MatchHistory", matchHistorySchema);
