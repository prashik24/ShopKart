import mongoose from 'mongoose';
import { config } from './config.js';

function maskMongoUri(uri = '') {
  // Hide credentials in logs
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    if (u.username) u.username = '***';
    if (u.password) u.password = '***';
    const proto = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
    return proto + u.host + (u.pathname || '') + (u.search || '');
  } catch {
    return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//***:***@');
  }
}

export async function connectDb() {
  // Fail fast if missing in production
  if (!config.mongoUri) {
    console.error(
      '[db] MONGODB_URI is not set. ' +
      'On Render you must use a MongoDB Atlas connection string (mongodb+srv://...). ' +
      'Add MONGODB_URI in the Render service Environment.'
    );
    process.exit(1);
  }

  if (config.isProd && /127\.0\.0\.1|localhost/.test(config.mongoUri)) {
    console.error(
      '[db] Your MONGODB_URI points to localhost, which is not accessible on Render. ' +
      'Use MongoDB Atlas (mongodb+srv://...).'
    );
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000
    });
    const masked = maskMongoUri(config.mongoUri);
    console.log('[db] connected to', masked);
  } catch (err) {
    console.error('[db] Mongo connection failed:', err?.message || err);
    console.error('       URI:', maskMongoUri(config.mongoUri));
    process.exit(1);
  }
}
