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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
