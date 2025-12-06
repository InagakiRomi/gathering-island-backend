// scripts/init-db-postgres.js
// Initialize PostgreSQL database
// Prerequisites: Make sure PostgreSQL is running and the user has permissions
// Run: npm run init-db:postgres

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.resolve(
    __dirname,
    '..',
    `.env.stage.${process.env.STAGE || 'dev'}`,
  ),
});

const { Client } = require('pg');

async function run() {
  const sqlPath = path.resolve(
    __dirname,
    '..',
    'src',
    'database',
    'schema.sql',
  );

  if (!fs.existsSync(sqlPath)) {
    console.error('schema.sql not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'gathering',
  });

  try {
    await client.connect();
    console.log(
      `✅ Connected to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    );

    await client.query(sql);
    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize DB:', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
