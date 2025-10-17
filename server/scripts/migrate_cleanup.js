#!/usr/bin/env node

const path = require('path');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is required to run the migration.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const summary = {
    statusReset: 0,
    paymentCleaned: 0,
  };

  const statusResult = await Ticket.updateMany(
    { status: 'approved' },
    { $set: { status: 'pending_manual_payment' } },
  );
  summary.statusReset = statusResult.modifiedCount || 0;

  const tickets = await Ticket.find();
  for (const ticket of tickets) {
    const payment = ticket.payment || {};
    const cleaned = {
      emailSentAt: payment.emailSentAt || undefined,
      updatedAt: payment.updatedAt || undefined,
      lastEmailError: payment.lastEmailError || undefined,
    };

    const keys = Object.keys(payment || {});
    const extraKeys = keys.filter((key) => !Object.prototype.hasOwnProperty.call(cleaned, key));
    const shouldClean = extraKeys.length > 0;

    if (shouldClean) {
      ticket.payment = cleaned;
      await ticket.save();
      summary.paymentCleaned += 1;
    }
  }

  await mongoose.disconnect();

  console.log('Migration complete:', summary);
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
