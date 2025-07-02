import { neon } from "@neondatabase/serverless";

// NOTE: for some reason you get a "Method not allowed" if you
// use the handler instead of just putting a POST request in
// the function name, even with the methods specified in
// the control statements ¯\_(ツ)_/¯

// export async function handler(request: Request) {
export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    if (request.method === "POST") {
      //console.log("Received POST request.");
      const { 
        username, 
        incognito_name, 
        city, 
        state, 
        country, 
        clerkId,
        username_encrypted,
        incognito_name_encrypted 
      } = await request.json();

      if (
        !city ||
        !state ||
        !country ||
        !clerkId ||
        (!username && !username_encrypted) ||
        (!incognito_name && !incognito_name_encrypted)
      ) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Prefer encrypted fields over plaintext
      let response;
      if (username_encrypted && incognito_name_encrypted) {
        // Use encrypted fields
        response = await sql`
          UPDATE users
          SET
            username_encrypted = ${username_encrypted},
            incognito_name_encrypted = ${incognito_name_encrypted},
            city = ${city},
            state = ${state},
            country = ${country}
          WHERE clerk_id = ${clerkId} 
          RETURNING *
        `;
      } else {
        // Fallback to plaintext (for legacy compatibility)
        response = await sql`
          UPDATE users
          SET
            username = ${username || ''},
            incognito_name = ${incognito_name || ''},
            city = ${city},
            state = ${state},
            country = ${country}
          WHERE clerk_id = ${clerkId} 
          RETURNING *
        `;
      }

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
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
