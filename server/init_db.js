const db = require('./db');

async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_users (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB
      );
    `);

    console.log("Database tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    process.exit();
  }
}

initDB();
