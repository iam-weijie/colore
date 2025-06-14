import { neon } from "@neondatabase/serverless";
import { AlgorithmRandomPosition } from "@/lib/utils";
import { Format } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const recipientId = url.searchParams.get("recipient_id");
    const viewerId = url.searchParams.get("user_id");

    if (!recipientId || !viewerId) {
      return new Response(
        JSON.stringify({ error: "Missing recipient_id or user_id parameter" }),
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        p.id, 
        p.user_id,
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
        p.pinned,
        p.color,
        p.emoji,
        p.board_id,
        p.prompt_id,
        p.recipient_user_id,
        p.notified,
        p.unread,
        p.top,
        p.left,
        p.expires_at,
        p.formatting,
        p.static_emoji,
        u.clerk_id,
        u.firstname, 
        u.lastname, 
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendships f
            WHERE 
              (f.user_id = $1 AND f.friend_id = u.clerk_id)
              OR
              (f.friend_id = $1 AND f.user_id = u.clerk_id)
          ) THEN u.incognito_name
          ELSE u.username
        END AS username,
        u.country, 
        u.state, 
        u.city,
        pr.content as prompt
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.recipient_user_id = $1
        AND p.post_type = 'personal'
        AND (p.board_id IS NULL OR p.board_id < 0)
        AND p.expires_at > NOW()
        AND p.available_at <= NOW()
      ORDER BY p.created_at DESC
      LIMIT $2;
    `;

    const response = await sql.query(query, [recipientId, number]);

    // Transform the response to match the Post interface
    const mappedPosts = response.map((post: any) => ({
      id: post.id,
      user_id: post.user_id,
      firstname: post.firstname,
      username: post.username,
      content: post.content,
      created_at: post.created_at,
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
      board_id: post.board_id || -1,
      unread: post.unread,
      position: {
        top: post.top,
        left: post.left,
      },
      expires_at: post.expires_at || "",
      formatting: (post.formatting as Format) || [],
      static_emoji: post.static_emoji,
    }));

    return new Response(JSON.stringify({ data: mappedPosts }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching personal posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch personal posts" }),
      { status: 500 }
    );
  }
}
