import { neon } from "@neondatabase/serverless";

export async function handler(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    if (request.method === "POST") {
      const { firstName, lastName, dateOfBirth, userLocation } =
        await request.json();

      if (!firstName || !lastName || !dateOfBirth || !userLocation) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const response = await sql`
      UPDATE users
      SET
        firstname = ${firstName},
        lastname = ${lastName},
        date_of_birth = ${dateOfBirth},
        user_location = ${userLocation}
      WHERE email = ${userEmail} 
  `;

      return new Response(JSON.stringify({ data: response }), {
        status: 201,
      });
    } else if (request.method === "GET") {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");

      if (!userId) {
        return Response.json(
          { error: "Missing userId parameter" },
          { status: 400 }
        );
      }

      const response = await sql`
      SELECT * FROM users WHERE clerk_id = ${userId}`;
      if (response.length === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
        });
      }

      return new Response(JSON.stringify({ data: response[0] }), {
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
      });
    }
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
