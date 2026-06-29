import mongoose from "mongoose";

const roleReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleSlug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    roleTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    wouldRecommend: {
      type: Boolean,
      required: true,
    },
    pros: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    cons: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    tip: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  { timestamps: true },
);

roleReviewSchema.index({ roleSlug: 1, createdAt: -1 });
roleReviewSchema.index({ userId: 1, roleSlug: 1 }, { unique: true });

export default mongoose.model("RoleReview", roleReviewSchema);
