import { Format } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids"); // Retrieve the 'ids' query param

    if (!idsParam) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'ids' query parameter" }),
        { status: 400 }
      );
    }

    // Convert to an array of numbers
    const ids = idsParam
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id)); // Ensure all IDs are valid integers

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid post IDs" }), {
        status: 400,
      });
    }
    // Execute the query using `ANY($1::int[])` for safer parameter handling
    const response = await sql`
      SELECT *
      FROM posts p
      WHERE p.id = ANY(${ids}::int[])
        AND p.expires_at > NOW() 
        AND p.available_at <= NOW()
    `;
    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "No posts found" }), {
        status: 404,
      });
    }

     // Transform the response to match the Post interface
    const mappedPosts = response.map((post) => ({
      id: post.id,
      clerk_id: post.clerk_id,
      user_id: post.clerk_id, // Using clerk_id as user_id for temporary fix
      firstname: post.firstname,
      username: post.username,
      content: post.content,
      created_at: post.created_at,
      expires_at: post.expires_at, // Not available in query - set default
      city: post.city,
      state: post.state,
      country: post.country,
      like_count: post.like_count,
      report_count: post.report_count,
      unread_comments: post.unread_comments,
      recipient_user_id: post.recipient_user_id,
      pinned: post.pinned,
      color: post.color,
      emoji: post.emoji,
      notified: post.notified,
      prompt_id: post.prompt_id,
      prompt: post.prompt,
      board_id: post.board_id,
      reply_to: post.reply_to, 
      unread: post.unread,
      position: post.top !== null && post.left !== null 
        ? { top: Number(post.top), left: Number(post.left) } 
        : undefined,
      formatting: post.formatting as Format || [],
    }));

    // Return the posts data in the response
    return new Response(JSON.stringify({ data: mappedPosts }), { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
    });
  }
}
