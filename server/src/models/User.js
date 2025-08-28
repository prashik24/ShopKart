import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  qty: { type: Number, default: 1 }
}, { _id: false });

/* Accept both id & productId coming from client; keep both so nothing is lost */
const OrderItemSchema = new mongoose.Schema({
  id: String,            // optional client-side id
  productId: String,     // normalized id we use server-side
  title: String,
  price: Number,
  image: String,
  qty: Number
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true },       // e.g. SK-<timestamp>
  total: { type: Number, required: true },
  payment: {
    mode: { type: String, enum: ['COD', 'UPI'], required: true },
    upiId: { type: String, default: null }
  },
  address: {
    name: String, line1: String, city: String, state: String, zip: String, phone: String
  },
  items: [OrderItemSchema],
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  gender: { type: String, default: 'Prefer not to say' },

  cart:   { type: [CartItemSchema], default: [] },
  orders: { type: [OrderSchema],   default: [] },

  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
