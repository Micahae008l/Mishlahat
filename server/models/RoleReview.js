import mongoose from "mongoose";

const roleReviewSchema = new mongoose.Schema(
  {
    roleTitle: { type: String, required: true, trim: true },
    roleSlug: { type: String, required: true, trim: true, index: true },
    displayName: { type: String, required: true, trim: true, maxlength: 40 },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    rating: { type: Number, min: 1, max: 5, default: null },
    servedInRole: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    userEmail: { type: String, default: "", lowercase: true, trim: true },
    moderatedAt: { type: Date, default: null },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectReason: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

roleReviewSchema.index({ roleSlug: 1, status: 1, createdAt: -1 });
roleReviewSchema.index({ userId: 1, roleSlug: 1, status: 1 });

export default mongoose.model("RoleReview", roleReviewSchema);
