import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const {
      content,
      clerkId,
      color = "yellow",
      emoji = null,
      expires_at,
      available_at,
      static_emoji,
      postType = "public",
      recipientId,
      promptId,
      boardId,
      formatting,
    } = await request.json();

    if (!content || !clerkId) {
      console.error("Missing required fields:", {
        content,
        clerkId,
        expires_at,
        available_at,
      });
      return Response.json(
        { error: "content and clerkId are required" },
        { status: 400 }
      );
    }

    console.log("Creating new post with data:", {
      content,
      clerkId,
      color,
      emoji,
      expires_at,
      available_at,
      static_emoji,
      postType,
      recipientId,
      promptId,
      boardId,
      formatting,
    });

    // Literal for the interval
    // Fix 2: Handle null emoji properly
    // Fix 3: Ensure proper parenthesis placement

    const unread = postType === "personal";
    const [insertedPost] = await sql`
      INSERT INTO posts 
        (user_id, content, like_count, report_count, post_type, recipient_user_id, color, emoji, expires_at, available_at, static_emoji, prompt_id, board_id, unread, formatting)
      VALUES 
        (${clerkId}, ${content}, 0, 0, ${postType}, ${recipientId}, ${color}, ${emoji}, ${expires_at}, ${available_at}, ${static_emoji}, ${promptId}, ${boardId}, ${unread}, ${formatting})
      RETURNING id, color, expires_at, unread;
    `;

    console.log("inserted Posts", insertedPost);

    return Response.json({ data: insertedPost, status: 201 });
  } catch (error: unknown) {
    console.error("Database operation failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        error: "Failed to create post",
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
        }),
      },
      { status: 500 }
    );
  }
}
