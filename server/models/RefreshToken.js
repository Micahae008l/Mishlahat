import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: "",
      maxlength: 500,
    },
    ip: {
      type: String,
      default: "",
      maxlength: 120,
    },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
