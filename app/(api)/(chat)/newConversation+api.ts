import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Received POST request.");
    const { clerkId_1, clerkId_2 } = await request.json();

    const response = await sql`
      INSERT INTO conversations (clerk_id_1, clerk_id_2, messages)
      VALUES (${clerkId_1}, ${clerkId_2}, ${[]})
      ;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
