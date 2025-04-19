import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

async function deleteExpiredPosts() {
  try {
    const result = await sql`
      DELETE FROM posts
      WHERE expired_at < NOW()
    `;
    console.log(`✅ Deleted ${result.rowCount} expired posts.`);
  } catch (error) {
    console.error('❌ Error deleting expired posts:', error);
    process.exit(1);
  }
}

deleteExpiredPosts();
