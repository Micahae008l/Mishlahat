import mongoose from "mongoose";

const reportHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, default: "" },
    direction: { type: String, default: "", trim: true },
    topRole: { type: String, default: "", trim: true },
    topMatch: { type: Number, default: null },
    report: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    promptVersion: { type: String, default: "" },
    model: { type: String, default: "" },
  },
  { timestamps: true }
);

reportHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ReportHistory", reportHistorySchema);
