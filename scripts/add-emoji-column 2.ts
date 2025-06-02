import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

async function addEmojiColumn() {
  try {
    console.log('🔄 Adding shorthand_emojis column to users table...');
    
    // Check if column already exists
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'shorthand_emojis'
    `;

    if (columnExists.length > 0) {
      console.log('✅ Column shorthand_emojis already exists in users table.');
      return;
    }

    // Add the column
    await sql`
      ALTER TABLE users 
      ADD COLUMN shorthand_emojis JSONB DEFAULT NULL
    `;

    console.log('✅ Successfully added shorthand_emojis column to users table.');
    
    // Verify the column was added
    const verification = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'shorthand_emojis'
    `;

    if (verification.length > 0) {
      console.log('✅ Column verification successful:', verification[0]);
    } else {
      console.error('❌ Column verification failed - column not found after creation');
    }

  } catch (error) {
    console.error('❌ Error adding shorthand_emojis column:', error);
    process.exit(1);
  }
}

addEmojiColumn();
