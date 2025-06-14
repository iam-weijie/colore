// This script adds the formatting_encrypted column to the posts table
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function addFormattingEncryptedColumn() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL, { fullResults: true });
    
    console.log('Checking if formatting_encrypted column exists...');
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'formatting_encrypted'
    `;
    
    if (result.rows && result.rows.length > 0) {
      console.log('Column formatting_encrypted already exists');
      return;
    }
    
    console.log('Adding formatting_encrypted column to posts table...');
    await sql`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS formatting_encrypted TEXT
    `;
    
    console.log('Column formatting_encrypted added successfully');
  } catch (error) {
    console.error('Error adding formatting_encrypted column:', error);
    process.exit(1);
  }
}

addFormattingEncryptedColumn()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 