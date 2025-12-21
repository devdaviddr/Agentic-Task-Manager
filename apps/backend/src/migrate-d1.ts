// D1 Migration utility for TaskManager
// This script helps create the D1 database and run migrations

import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export async function createDatabase() {
  console.log('Creating D1 database...');
  console.log('Run: npx wrangler d1 create taskmanager');
  console.log('Then update wrangler.toml with the database_id');
}

export async function runMigrations() {
  console.log('Running D1 migrations...');
  
  const schemaPath = path.join(__dirname, 'schema', 'd1.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  console.log('Run the following commands:');
  console.log('npx wrangler d1 execute taskmanager --local --file=./src/schema/d1.sql');
  console.log('npx wrangler d1 execute taskmanager --file=./src/schema/d1.sql');
  
  console.log('\nSchema content:');
  console.log(schema);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await createDatabase();
  await runMigrations();
}