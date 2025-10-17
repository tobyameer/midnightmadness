const { mongoose } = require("./_db");

const AttendeeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
    },
  },
  { _id: false }
);

const TicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    packageType: { type: String, enum: ["single", "couple"], required: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    paymentNote: { type: String, trim: true },
    attendees: { type: [AttendeeSchema], required: true },
    status: { type: String, default: "pending_manual_payment" },
  },
  { timestamps: true }
);

// Avoid OverwriteModelError on cold/warm starts
module.exports = () =>
  mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
