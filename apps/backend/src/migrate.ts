// DEPRECATED: This file is for PostgreSQL migrations only
// For D1 database, use:
// 1. Schema: /src/schema/d1.sql
// 2. D1 migration: wrangler d1 execute --local --file=/src/schema/d1.sql
// 3. Or use migrate-d1.ts for programmatic migrations

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('❌ This migration script is for PostgreSQL only.');
console.log('For D1 database, use:');
console.log('1. wrangler d1 execute --local --file=src/schema/d1.sql');
console.log('2. Or run: npm run migrate:d1');
process.exit(1);