import { sendNotification } from "@/lib/notification";
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

    // Fix 1: Use a template literal for the interval
    // Fix 2: Handle null emoji properly
    // Fix 3: Ensure proper parenthesis placement

    const unread = postType === "personal";
    const [insertedPost] = await sql`
      INSERT INTO posts 
        (user_id, content, like_count, report_count, post_type, recipient_user_id, color, emoji, expires_at, available_at, static_emoji, prompt_id, board_id, unread, formatting)
      VALUES 
        (${clerkId}, ${content}, 0, 0, ${postType}, ${recipientId}, ${color}, ${emoji}, ${expires_at}, ${available_at}, ${static_emoji}, ${promptId}, ${boardId}, ${unread}, ${formatting})
      RETURNING 
        id,
        user_id, 
        content, 
        like_count, 
        report_count, 
        created_at, 
        unread_comments, 
        pinned, 
        color, 
        emoji, 
        recipient_user_id,
        notified,
        expires_at, 
        unread,
        post_type
    `;

    if (
      postType === "personal" &&
      insertedPost.recipient_user_id !== clerkId &&
      insertedPost.unread
    ) {
      const posterUser = await sql`
          SELECT 
            clerk_id,
            firstname,
            lastname,
            username,
            country,
            state,
            city
          FROM posts 
          WHERE clerk_id = ${insertedPost.user_id}
        `;

      const recipientPushToken = await sql`
        SELECT
          push_token
        FROM users
        WHERE clerk_id = ${insertedPost.recipient_user_id}
      `;

      // building notification object
      const notification = {
        ...insertedPost,
        ...posterUser,
      };

      sendNotification(
        insertedPost.recipient_user_id,
        "Posts",
        notification,
        {},
        recipientPushToken[0]?.push_token
      );
    }

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
