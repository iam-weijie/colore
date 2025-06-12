import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { email, clerkId, salt } = await request.json();

    if (!email || !clerkId || !salt) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
  INSERT INTO users (email, clerk_id, salt)
  VALUES (${email}, ${clerkId}, ${salt})
  `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
