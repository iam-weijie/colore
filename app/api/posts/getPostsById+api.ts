import { Format } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids"); // Retrieve the 'ids' query param
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const offset = page * limit;

    if (!idsParam) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'ids' query parameter" }),
        { status: 400 }
      );
    }

    console.log("[getPostsById] ids: ", idsParam)
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

    
    // Get total count first
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM posts p
      WHERE p.id = ANY(${ids}::int[])
    `;
    
    console.log("[getPostsById] countResult: ", countResult)
    const total = parseInt(countResult[0].total);
    
    // Execute the query with pagination
    const response = await sql`
      SELECT 
        p.*,
        u.firstname,
        u.username,
        u.city,
        u.state,
        u.country
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.clerk_id
      WHERE p.id = ANY(${ids}::int[])
        AND p.expires_at > NOW() 
        AND p.available_at <= NOW()
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Check if posts were found
    if (response.length === 0 && page === 0) {
      return new Response(JSON.stringify({ error: "No posts found" }), {
        status: 404,
      });
    }
  
    

  

    // Transform the response to match the Post interface
    const mappedPosts = response.map((post) => ({
      id: post.id,
      clerk_id: post.clerk_id,
      user_id: post.user_id, // Using clerk_id as user_id for temporary fix
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
      position:
        post.top !== null && post.left !== null
          ? { top: Number(post.top), left: Number(post.left) }
          : undefined,
      formatting: (post.formatting as Format) || [],
      formatting_encrypted: post.formatting_encrypted || null,
      static_emoji: post.static_emoji,
    }));

     const hasMore = offset + response.length < total;
    // Return the posts data in the response
    return new Response(JSON.stringify({ 
      data: mappedPosts,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    }), { status: 200 });
  
} catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
    });
  }
}
