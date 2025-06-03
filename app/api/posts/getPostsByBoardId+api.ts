import { Format } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const boardId = url.searchParams.get("id");

    const response = await sql`
      SELECT 
        p.id, 
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
        p.recipient_user_id,
        p.pinned,
        p.color,
        p.emoji,
        p.top,
        p.left,
        p.prompt_id,
        p.reply_to,
        p.board_id,
        p.notified,
        p.unread,
        p.formatting,
        u.clerk_id,
        u.firstname, 
        u.lastname, 
        u.username,
        u.country, 
        u.state, 
        u.city,
        pr.content as prompt
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      JOIN boards b ON p.board_id = b.id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.board_id = ${boardId}
        AND p.expires_at > NOW() 
        AND p.available_at <= NOW()
      ORDER BY p.created_at ASC;
    `;

    // Transform the response to match the Post interface
    const mappedPosts = response.map((post) => ({
      id: post.id,
      clerk_id: post.clerk_id,
      user_id: post.user_id, // Using clerk_id as user_id for temporary fix
      firstname: post.firstname,
      username: post.username,
      content: post.content,
      created_at: post.created_at,
      expires_at: "", // Not available in query - set default
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

    console.log("Mapped Post", mappedPosts)
    return new Response(JSON.stringify({ data: mappedPosts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Error fetching board posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch board posts" }),
      { status: 500 }
    );
  }
}