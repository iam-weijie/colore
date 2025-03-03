import { neon } from "@neondatabase/serverless";

// TODO: update this route to be able to only update properties
// that the user specifies - for example, updating email
// if only the email parameter is non-empty

// For now, it will only take the location
export async function PATCH(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { clerkId, country, state, city, username, email } = await request.json();

    if (!clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle each update case separately to ensure proper SQL syntax
    let response;
    
    if (username !== undefined) {
      response = await sql`
        UPDATE users
        SET username = ${username}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else if (country !== undefined && state !== undefined && city !== undefined) {
      response = await sql`
        UPDATE users
        SET 
          country = ${country},
          state = ${state},
          city = ${city}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else if (email !== undefined) {
      response = await sql`
         UPDATE users
          SET email = ${email}
          WHERE clerk_id = ${clerkId}
          AND NOT EXISTS (
            SELECT 1 FROM users WHERE email = ${email}
          )
          RETURNING *;
        `;
        
    } else {
      return Response.json(
        { error: "Invalid update parameters" },
        { status: 400 }
      );
    }

    // Check for email uniqueness violation
  
    if (response.length === 0 && email !== undefined) {
      throw new Error("Email is already taken.");
    }


    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Error updating user info:", error);
    // Check for username uniqueness violation
    if (error.code === '23505' && error.constraint === 'users_username_key') {
      return Response.json(
        { error: "Username already taken" },
        { status: 409 }
      );

    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}