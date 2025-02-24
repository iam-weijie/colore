import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { content, clerkId, recipientId, color = "yellow", emoji } = await request.json();

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
        report_count
      )
      VALUES (
        ${clerkId},
        ${content},
        'personal',
        ${recipientId},
        ${color},
        ${emoji},
        0,
        0
      )
      RETURNING id, color, recipient_user_id
    `;

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