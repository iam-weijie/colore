import { neon } from "@neondatabase/serverless";
import { Board } from "@/types/type";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const user_id = url.searchParams.get("userId");

    const fetch_boards = await sql`
    SELECT 
      b.id,
      b.title,
      b.description,
      b.members_id,
      b.user_id,
      b.board_type,
      b.created_at,
      b.restrictions
    FROM boards b
    JOIN users u ON b.user_id = u.clerk_id
    WHERE b.members_id @> ARRAY[${user_id}]::text[]
      AND b.restrictions @> '{"Everyone"}'::text[]
    ORDER BY b.created_at ASC
    LIMIT 20;
`;

    const raw_boards = fetch_boards;
    const raw_boards_id: String[] = fetch_boards.map((b) => b.id);

    const ids = raw_boards_id
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));

    const fetch_count = await sql`
    SELECT p.board_id, COUNT(*) AS post_count
    FROM posts p
    JOIN boards b ON p.board_id = b.id
    WHERE b.id = ANY(${ids}::int[])
    GROUP BY p.board_id;
    `;

    if (raw_boards.length == 0 || fetch_count.length == 0) {
      return new Response(JSON.stringify({ data: [] }), {
        status: 201,
      });
    }

    const boards: Board[] = fetch_count.map((b) => {
      const board = raw_boards.find((i) => i.id === b.board_id);

      const daysDifference =
        (Date.now() - new Date(board.created_at).getTime()) /
        (1000 * 60 * 60 * 24);

      return {
        id: board.id,
        title: board.title,
        user_id: board.user_id,
        description: board.description,
        members_id: board.members_id,
        board_type: board.board_type,
        restrictions: board.restrictions,
        created_at: board.created_at,
        count: b.post_count,
        isNew: daysDifference < 3,
        isPrivate: board.restrictions.includes("Private"),
        allowedComments: board.restrictions.includes("commentsAllowed"),
        imageUrl: "",
      };
    });

    return new Response(JSON.stringify({ data: boards }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching boards:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch boards" }), {
      status: 500,
    });
  }
}
