import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { firstname, lastname, dateOfBirth, userLocation } =
      await request.json();

    if (!firstname || !lastname || !dateOfBirth || !userLocation) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
  INSERT INTO users (firstname, lastname, date_of_birth, user_location)
  VALUES (${firstname}, ${lastname}, ${dateOfBirth}, ${userLocation})
  `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
