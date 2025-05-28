const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(`${process.env.DATABASE_URL}`);

async function addColumn(name) {
  try {
    console.log(`🔄 Adding ${name} column to users table...`);

    // Check if column already exists
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = ${name}
    `;

    if (columnExists.length > 0) {
      console.log(`✅ Column ${name} already exists in users table.`);
      return;
    }

    // Add the column (interpolate identifier directly)
    await sql(`ALTER TABLE users ADD COLUMN ${name} VARCHAR(255) DEFAULT NULL`);

    console.log(`✅ Successfully added ${name} column to users table.`);

    // Verify the column was added
    const verification = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = ${name}
    `;

    if (verification.length > 0) {
      console.log("✅ Column verification successful:", verification[0]);
    } else {
      console.error(
        "❌ Column verification failed - column not found after creation"
      );
    }
  } catch (error) {
    console.error(`❌ Error adding ${name} column:`, error);
    process.exit(1);
  }
}

addColumn("nickname");
addColumn("incognito_name");
