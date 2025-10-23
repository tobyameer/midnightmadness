const mongoose = require("mongoose");

const EmailLogSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, index: true },
    to: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, trim: true },
    template: { type: String, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed, select: false },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    error: { type: String },
    attempt: { type: Number, default: 1 },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EmailLogSchema.pre("validate", function (next) {
  if (!this.meta && this.metadata) this.meta = this.metadata;
  next();
});

module.exports = mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema);
