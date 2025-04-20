import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const {
      content,
      clerkId,
      recipientId,
      color = "yellow",
      emoji,
      pinned = false
    } = await request.json();

    // console.log(content, clerkId, recipientId, color, emoji);

    if (!content || !clerkId || !recipientId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const response = await sql`
      INSERT INTO posts (
        user_id,
        content,
        post_type,
        recipient_user_id,
        color,
        emoji,
        like_count,
        report_count,
        pinned,
        expires_at,
        unread
      )
      VALUES (
        ${clerkId},
        ${content},
        'personal',
        ${recipientId},
        ${color},
        ${emoji},
        0,
        0,
        ${pinned},
        NOW() + INTERVAL '14 days',
        TRUE
      )
      RETURNING id, color, recipient_user_id, unread
    `;

    console.log("res", response)
    // console.log("personal post", response);
    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating personal post:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create personal post" }),
      { status: 500 }
    );
  }
}
