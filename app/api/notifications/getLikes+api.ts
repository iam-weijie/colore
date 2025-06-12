import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

    if (!clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID parameter" }),
        { status: 400 }
      );
    }

    /*  
        n: {
            id,
            post_id,
            post_content,
            post_color,
            liker_username
        }
    */

    const postLikes = await sql`
        SELECT
            pl.id,
            p.id AS post_id,
            p.content AS post_content,
            p.color AS post_color,
            u.username AS liker_username
        FROM post_likes pl
        JOIN posts p ON pl.post_id = p.id
        JOIN users u ON pl.user_id = u.clerk_id
        WHERE pl.user_id != ${clerkId} AND p.user_id = ${clerkId} AND pl.unread = TRUE
        ORDER BY pl.created_at DESC
    `;

    /*
        n:      {
                    id,
                    comment_id,
                    post_id,
                    comment_content,
                    liker_username
                }
    */

    const commentLikes = await sql`
        SELECT
            cl.id,
            c.id AS comment_id,
            c.post_id,
            c.content AS comment_content,
            u.username AS liker_username
        FROM comment_likes cl
        JOIN comments c ON cl.comment_id = c.id
        JOIN users u ON cl.user_id = u.clerk_id
        WHERE cl.user_id != ${clerkId} AND c.user_id = ${clerkId} AND cl.unread = TRUE
        ORDER BY cl.created_at DESC
    `;

    const allLikeNotifications = [...postLikes, ...commentLikes];

    return new Response(
      JSON.stringify({
        toStore: allLikeNotifications,
        unread_likes: allLikeNotifications.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user post and comment likes." }),
      { status: 500 }
    );
  }
}
