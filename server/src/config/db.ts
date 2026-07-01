import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.VITE_SUPABASE_DB_URL || '';
const isPlaceholder = !dbUrl || dbUrl.includes('your_') || dbUrl.includes('placeholder') || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('mysql://'));

export let sequelize: Sequelize;

if (dbUrl && !isPlaceholder) {
  console.log('📡 Database connection URL detected. Connecting to SQL Database...');
  
  // Use connection string for Postgres/MySQL/etc.
  sequelize = new Sequelize(dbUrl, {
    dialect: dbUrl.startsWith('mysql') ? 'mysql' : 'postgres',
    dialectOptions: {
      ssl: dbUrl.includes('supabase') || process.env.DB_SSL === 'true'
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
    },
    logging: false,
  });
} else {
  console.log('💾 No database URL detected. Falling back to SQLite local database (database.sqlite)...');
  
  const dbPath = path.resolve(__dirname, '../../database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};
