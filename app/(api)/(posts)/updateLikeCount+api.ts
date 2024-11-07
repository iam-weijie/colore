import { neon, neonConfig } from "@neondatabase/serverless";

// Configure Neon client with longer timeouts
neonConfig.fetchConnectionCache = true;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.connectionTimeoutMillis = 60000; // 60 second timeout

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(request: Request) {
  try {
    // Parse the request body
    const { postId, increment } = await request.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ error: "Post ID is required" }),
        { status: 400 }
      );
    }

    // Perform the update in a single query to avoid race conditions
    const result = await sql`
      WITH current_likes AS (
        SELECT like_count 
        FROM posts 
        WHERE id = ${postId}
        FOR UPDATE
      )
      UPDATE posts 
      SET like_count = CASE 
        WHEN ${increment} THEN like_count + 1
        WHEN like_count > 0 THEN like_count - 1
        ELSE 0
      END
      WHERE id = ${postId}
      RETURNING like_count;
    `;

    if (!result || result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: { likeCount: result[0].like_count }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Database operation failed:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to update like count",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}