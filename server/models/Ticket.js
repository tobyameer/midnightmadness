const mongoose = require("mongoose");

const attendeeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female"], required: true },
  },
  { _id: false }
);

const paymentHistorySchema = new mongoose.Schema(
  {
    event: { type: String, trim: true },
    status: { type: String, trim: true },
    amountCents: { type: Number },
    ip: { type: String, trim: true },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true, required: true },
    packageType: { type: String, enum: ["single", "couple"], required: true },

    contactEmails: {
      type: [String],
      required: true,
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? arr.map((e) => String(e).toLowerCase().trim()).filter(Boolean)
          : [],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "At least one contact email is required.",
      },
      index: true,
    },

    // legacy single email (optional)
    contactEmail: { type: String, lowercase: true, trim: true, index: true },

    paymentNote: { type: String, trim: true },

    attendees: {
      type: [attendeeSchema],
      validate: {
        validator(attendees) {
          if (!Array.isArray(attendees)) return false;

          if (this.packageType === "single") {
            return attendees.length === 1 && ["male", "female"].includes(attendees[0]?.gender);
          }
          if (this.packageType === "couple") {
            if (attendees.length !== 2) return false;
            const genders = attendees.map((a) => a.gender);
            return genders.includes("male") && genders.includes("female");
          }
          return false;
        },
        message: "Attendees do not match package requirements.",
      },
    },

    status: {
      type: String,
      enum: ["pending_manual_payment", "paid", "used"],
      default: "pending_manual_payment",
      index: true,
    },

    qrCode: { type: String },

    payment: {
      emailSentAt: { type: Date },
      updatedAt: { type: Date },
      lastEmailError: { type: String },
    },

    paymentHistory: [paymentHistorySchema],

    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

ticketSchema.pre("validate", function (next) {
  let emails = Array.isArray(this.contactEmails) ? this.contactEmails.slice() : [];
  if (this.contactEmail) emails.push(String(this.contactEmail).toLowerCase().trim());
  if (Array.isArray(this.attendees)) {
    for (const a of this.attendees) {
      if (a && a.email) emails.push(String(a.email).toLowerCase().trim());
    }
  }
  emails = [...new Set(emails.filter(Boolean))];
  this.contactEmails = emails;
  if (!this.contactEmail && emails.length) this.contactEmail = emails[0];
  next();
});

ticketSchema.virtual("recipientEmails").get(function () {
  const emails = [];
  if (Array.isArray(this.contactEmails)) emails.push(...this.contactEmails);
  if (Array.isArray(this.attendees)) {
    for (const a of this.attendees) {
      if (a && a.email) emails.push(String(a.email).toLowerCase().trim());
    }
  }
  return [...new Set(emails.filter(Boolean))];
});

module.exports = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
