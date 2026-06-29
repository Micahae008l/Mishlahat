import mongoose from "mongoose";

/**
 * One row per checkout attempt. Lifecycle: pending → paid | failed (| refunded).
 * The grant is applied exactly once, when status first transitions to "paid".
 */
const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: { type: String, default: "" },
    productId: { type: String, required: true },
    provider: { type: String, required: true }, // "mock" | "grow"
    /** Provider-side identifier (Grow processId / transaction id). */
    providerRef: { type: String, default: null, index: true },
    amountAgorot: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ILS" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    /** True once the entitlement grant has been applied — guards against double-granting. */
    granted: { type: Boolean, default: false },
    /** Raw provider payload for auditing/debugging. */
    raw: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
