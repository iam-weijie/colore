// This script adds encrypted columns for user identity fields
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function addUserEncryptionColumns() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL, { fullResults: true });
    
    const columnsToAdd = [
      'username_encrypted',
      'nickname_encrypted', 
      'incognito_name_encrypted'
    ];
    
    for (const columnName of columnsToAdd) {
      console.log(`Checking if ${columnName} column exists...`);
      const result = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = ${columnName}
      `;
      
      if (result.rows && result.rows.length > 0) {
        console.log(`Column ${columnName} already exists`);
        continue;
      }
      
      console.log(`Adding ${columnName} column to users table...`);
      
      // Use string interpolation for column name since template literals don't support dynamic column names
      if (columnName === 'username_encrypted') {
        await sql`ALTER TABLE users ADD COLUMN username_encrypted TEXT`;
      } else if (columnName === 'nickname_encrypted') {
        await sql`ALTER TABLE users ADD COLUMN nickname_encrypted TEXT`;
      } else if (columnName === 'incognito_name_encrypted') {
        await sql`ALTER TABLE users ADD COLUMN incognito_name_encrypted TEXT`;
      }
      
      console.log(`Column ${columnName} added successfully`);
    }
    
    console.log('All encryption columns processed successfully');
  } catch (error) {
    console.error('Error adding encryption columns:', error);
    process.exit(1);
  }
}

addUserEncryptionColumns()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
