import mongoose from 'mongoose';

const SignupTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true }, // we’ll hash the chosen password prior to verify
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// auto-remove expired in background (TTL)
SignupTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SignupToken = mongoose.model('SignupToken', SignupTokenSchema);
