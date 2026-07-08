import dotenv from 'dotenv';
import path from 'path';

const isProdRun = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const env = isProdRun ? 'production' : 'development';

// Ensure process.env.NODE_ENV is set correctly
process.env.NODE_ENV = env;

// Load environment-specific configuration file first
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

// Load default/common configurations from .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log(`[ENVIRONMENT] Loaded environment configurations in "${env}" mode.`);
