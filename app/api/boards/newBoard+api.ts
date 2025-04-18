import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { title, clerkId, description, type, restrictions } = await request.json();

    // Basic input validation
    if (!title || !clerkId || !type) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields (title, clerkId, or type)" 
        }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    console.log("Board: ", title, clerkId, description, type, restrictions)
    // Transaction with proper error handling
    const [response] = await sql`
      INSERT INTO boards (
        user_id,
        description, 
        title, 
        board_type, 
        restrictions,
        members_id
      )
      VALUES (
        ${clerkId}, 
        ${description}, 
        ${title}, 
        ${type}, 
        ${restrictions},
        ${[clerkId]}
      )
      RETURNING *
    `;


    //console.log("response", response)
    return new Response(
      JSON.stringify({ 
        success: true,
        data: response 
      }), 
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to create board",
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}