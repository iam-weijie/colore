import { neon } from "@neondatabase/serverless";
import { Board } from "@/types/type";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");

    if (!user_id ) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400 }
      );
    }

    const fetch_boards = `
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
      WHERE b.user_id = '${user_id}'
      ORDER BY b.created_at ASC;
    `;
   
    const fetch_count = 
    `
    SELECT p.board_id, COUNT(*) AS post_count
    FROM posts p
    JOIN boards b ON p.board_id = b.id
    WHERE b.user_id = '${user_id}'
    GROUP BY p.board_id;
    `;

  
    const raw_boards = await sql`${fetch_boards}`;
    const board_count = await sql`${fetch_count}`;


    if (raw_boards.length === 0) {
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
      });
    }

    let boards: Board[] = board_count.map((b) => {
      const board = raw_boards.find((i) => i.id === b.board_id )

  
      const daysDifference = (Date.now() - new Date(board.created_at).getTime()) / (1000 * 60 * 60 * 24)

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
        commentAllowed: board.restrictions.includes("commentsAllowed"),
        imageUrl: "",
      }

    })

    if (boards.length < raw_boards.length) {
      const raw_empty_boards = raw_boards.filter(
        rawBoard => !boards.some(board => board.id === rawBoard.id)
      );

      const empty_boards = raw_empty_boards .map((board) => {
    
        const daysDifference = (Date.now() - new Date(board.created_at).getTime()) / (1000 * 60 * 60 * 24)
  
        return {
          id: board.id,
          title: board.title,
          user_id: board.user_id,
          description: board.description,
          members_id: board.members_id,
          board_type: board.board_type,
          restrictions: board.restrictions,
          created_at: board.created_at,
          count: 0,
          isNew: daysDifference < 3,
          isPrivate: board.restrictions.includes("Private"),
          commentAllowed: board.restrictions.includes("commentsAllowed"),
          imageUrl: "",
        }
  
      })
      boards = [...boards, ...empty_boards]
    }

    return new Response(JSON.stringify({ data: boards }), {
      status: 200,
    });
  
  } catch (error) {
    console.error("Error fetching personal posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch board" }),
      { status: 500 }
    );
  }
}
