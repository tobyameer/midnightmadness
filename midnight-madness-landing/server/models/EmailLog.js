// server/models/EmailLog.js
const mongoose = require("mongoose");

const EmailLogSchema = new mongoose.Schema(
  {
    // Business key (e.g., "MM-XXXX"); index for quick lookups
    ticketId: { type: String, required: true, index: true },

    // One log entry per recipient - handle both string and array
    to: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // Convert array to string if needed
      set: function (val) {
        if (Array.isArray(val)) {
          return val[0]; // Take first email if array is passed
        }
        return val;
      },
    },

    // Optional details for debugging/auditing
    subject: { type: String, trim: true },
    template: { type: String, trim: true },

    // Provider response or any extra context
    meta: { type: mongoose.Schema.Types.Mixed },
    // Back-compat: some callers may still write "metadata"
    metadata: { type: mongoose.Schema.Types.Mixed, select: false },

    // Outcome of the send operation
    status: { type: String, enum: ["success", "failed"], default: "success" },
    error: { type: String },
    attempt: { type: Number, default: 1 },

    // When the email was actually sent
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Keep backward compatibility: if only "metadata" is set, mirror it into "meta"
EmailLogSchema.pre("validate", function (next) {
  if (!this.meta && this.metadata) {
    this.meta = this.metadata;
  }
  next();
});

module.exports =
  mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema);
