import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const isPersonal = url.searchParams.get("personal") === "true";

    const {
      content,
      clerkId,
      recipientId,
      color = "yellow",
      emoji = null,
      pinned = false,
      expires_at,
      available_at,
      static_emoji = null,
      promptId = null,
      boardId = null,
      formatting = null,
    } = await request.json();

    // Basic validation
    if (!content || !clerkId || (isPersonal && !recipientId)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const postType = isPersonal ? "personal" : "public";
    const unread = isPersonal;

    // Insert, with conditional default for personal expiry
    const [insertedPost] = await sql`
      INSERT INTO posts (
        user_id,
        content,
        like_count,
        report_count,
        post_type,
        recipient_user_id,
        color,
        emoji,
        expires_at,
        available_at,
        static_emoji,
        prompt_id,
        board_id,
        unread,
        pinned,
        formatting
      ) VALUES (
        ${clerkId},
        ${content},
        0,
        0,
        ${postType},
        ${recipientId},
        ${color},
        ${emoji},
        ${isPersonal ? sql`NOW() + INTERVAL '365 days'` : expires_at},
        ${isPersonal ? null : available_at},
        ${static_emoji},
        ${promptId},
        ${boardId},
        ${unread},
        ${pinned},
        ${formatting}
      )
      RETURNING *
    `;

    // Only for personal posts: dispatch a notification
    if (
      isPersonal &&
      insertedPost.recipient_user_id !== clerkId &&
      insertedPost.unread
    ) {
      const [posterUser] = await sql`
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

      // send the notification
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/dispatch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: insertedPost.recipient_user_id,
            type: "Posts",
            notification: { ...insertedPost, ...posterUser },
            content: { ...insertedPost, ...posterUser },
          }),
        }
      );
      const data = await res.json();
      if (!data.success) console.log("Notification error:", data.message);
    }

    return new Response(JSON.stringify({ data: insertedPost }), {
      status: 201,
    });
  } catch (err: unknown) {
    console.error("Error creating post:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Failed to create post",
        ...(process.env.NODE_ENV === "development" && { details: message }),
      }),
      { status: 500 }
    );
  }
}
