import { sendNotification } from "@/lib/notification";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const {
      content,
      userId,
      color = "yellow",
      emoji = null,
      expires_at,
      available_at,
      static_emoji,
      post_type = "public",
      recipientId,
      promptId,
      board_id,
      formatting,
    } = await request.json();

    console.log("BOARD ID: ", board_id)

    if (!content || !userId) {
      console.error("Missing required fields:", {
        content,
        userId,
        expires_at,
        available_at,
      });
      return Response.json(
        { error: "content and clerkId are required" },
        { status: 400 }
      );
    }

    // Fix 1: Use a template literal for the interval
    // Fix 2: Handle null emoji properly
    // Fix 3: Ensure proper parenthesis placement
    

    const unread = post_type === "personal";
    const [insertedPost] = await sql`
      INSERT INTO posts 
        (user_id, content, like_count, report_count, post_type, recipient_user_id, color, emoji, expires_at, available_at, static_emoji, prompt_id, board_id, unread, formatting)
      VALUES 
        (${userId}, ${content}, 0, 0, ${post_type}, ${recipientId}, ${color}, ${emoji}, ${expires_at}, ${available_at}, ${static_emoji}, ${promptId}, ${board_id}, ${unread}, ${formatting})
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
      post_type === "personal" &&
      insertedPost.recipient_user_id !== userId &&
      insertedPost.unread
    ) {
      const posterUser = await sql.query(`
        SELECT 
          p.user_id,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM friendships f
              WHERE 
                (f.user_id = $1 AND f.friend_id = $2)
                OR
                (f.friend_id = $1 AND f.user_id = $2)
            ) THEN u.incognito_name
            ELSE u.username
          END AS username,
          u.country,
          u.state,
          u.city
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.user_id = $3
      `, [userId, recipientId, insertedPost.user_id]);

      const recipientPushToken = await sql`
        SELECT
          push_token
        FROM users
        WHERE clerk_id = ${insertedPost.recipient_user_id}
      `;

    // building notification object
    const notification = {
      ...insertedPost,
      ...posterUser[0],
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
