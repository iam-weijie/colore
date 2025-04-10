import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { content, clerkId, color = "yellow", emoji = null, expiration = '14 days', postType = 'public', recipientId, promptId, boardId } = await request.json();

    console.log("all params", content, clerkId, color, emoji , expiration, postType, recipientId, promptId, boardId)
    if (!content || !clerkId) {
      return Response.json(
        { error: "content and clerkId are required" },
        { status: 400 }
      );
    }

    // Validate expiration format
    if (!/^\d+\s+(day|month|hour|minute|second)s?$/.test(expiration)) {
      return Response.json(
        { error: "Invalid expiration format. Use formats like '14 days', '1 hour', etc." },
        { status: 400 }
      );
    }

    // Fix 1: Use a template literal for the interval
    // Fix 2: Handle null emoji properly
    // Fix 3: Ensure proper parenthesis placement
    const [insertedPost] = await sql`
      INSERT INTO posts 
        (user_id, content, like_count, report_count, post_type, recipient_user_id, color, emoji, expires_at, prompt_id, board_id)
      VALUES 
        (${clerkId}, ${content}, 0, 0, ${postType}, ${recipientId}, ${color}, ${emoji}, NOW() + ${expiration}::INTERVAL, ${promptId}, ${boardId})
      RETURNING id, color, expires_at;
    `;

    console.log("inserted Posts", insertedPost)

    return Response.json(
      { data: insertedPost },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Database operation failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return Response.json(
      { 
        error: "Failed to create post",
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}