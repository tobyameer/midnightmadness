const mongoose = require("mongoose");

// ---------- Sub-schemas ----------

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

// ---------- Ticket schema ----------

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true, required: true },

    packageType: { type: String, enum: ["single", "couple"], required: true },

    // Canonical array of contact emails (use this everywhere going forward)
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

    // Legacy single email for back-compat. OPTIONAL now.
    contactEmail: { type: String, lowercase: true, trim: true, index: true },

    paymentNote: { type: String, trim: true },

    attendees: {
      type: [attendeeSchema],
      validate: {
        validator(attendees) {
          if (!Array.isArray(attendees)) return false;

          if (this.packageType === "single") {
            return (
              attendees.length === 1 &&
              ["male", "female"].includes(attendees[0]?.gender)
            );
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
  {
    minimize: false,
  }
);

// ---------- Hooks & virtuals ----------

// Ensure contactEmails is populated from legacy/contact/attendees and de-duplicated
ticketSchema.pre("validate", function (next) {
  let emails = Array.isArray(this.contactEmails)
    ? this.contactEmails.slice()
    : [];

  // include legacy single email if present
  if (this.contactEmail) {
    emails.push(String(this.contactEmail).toLowerCase().trim());
  }

  // include attendee emails
  if (Array.isArray(this.attendees)) {
    for (const a of this.attendees) {
      if (a && a.email) {
        emails.push(String(a.email).toLowerCase().trim());
      }
    }
  }

  // de-duplicate / clean
  emails = [...new Set(emails.filter(Boolean))];

  // write back
  this.contactEmails = emails;

  // keep legacy field populated for older code paths
  if (!this.contactEmail && emails.length) {
    this.contactEmail = emails[0];
  }

  next();
});

// All unique recipient emails (contact + attendees)
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

// ---------- Export (safe for hot reload / serverless) ----------
module.exports =
  mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
