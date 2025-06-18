import { neon } from "@neondatabase/serverless";

// TODO: update this route to be able to only update properties
// that the user specifies - for example, updating email
// if only the email parameter is non-empty

// For now, it will only take the location
export async function PATCH(request: Request) {

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const {
      clerkId,
      country,
      state,
      city,
      username,
      nickname,
      incognito_name,
      color,
      email,
      salt
    } = await request.json();

    if (!clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If the user wants to update their nickname first check if nickname column exists
    if (nickname !== undefined) {
      const columnExists = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'nickname'
      `;

      if (columnExists.length === 0) {
        return Response.json(
          {
            error:
              "Database column missing. Please add the nickname column to your users table.",
            instructions:
              "Run this SQL in your database: ALTER TABLE users ADD COLUMN nickname VARCHAR(255) DEFAULT NULL;",
            sqlFile:
              "See scripts/add-friend-system-columns.sql for the complete migration script",
          },
          { status: 503 }
        );
      }
    }

    // If the user wants to update their incognito name first check if nickname column exists
    if (incognito_name !== undefined) {
      const columnExists = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'incognito_name'
      `;

      if (columnExists.length === 0) {
        return Response.json(
          {
            error:
              "Database column missing. Please add the incognito_name column to your users table.",
            instructions:
              "Run this SQL in your database: ALTER TABLE users ADD COLUMN incognito_name VARCHAR(255) DEFAULT NULL;",
            sqlFile:
              "See scripts/add-friend-system-columns.sql for the complete migration script",
          },
          { status: 503 }
        );
      }
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
    } else if (nickname !== undefined && incognito_name !== undefined) {
      console.log("ASDASDASDJADAJDIWIJDI");
      response = await sql`
        UPDATE users
        SET nickname = ${nickname}, incognito_name = ${incognito_name}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else if (nickname !== undefined) {
      response = await sql`
        UPDATE users
        SET nickname = ${nickname}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else if (incognito_name !== undefined) {
      response = await sql`
        UPDATE users
        SET incognito_name = ${incognito_name}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else if (
      country !== undefined &&
      state !== undefined &&
      city !== undefined
    ) {
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
    } else if (color !== undefined) {
      response = await sql`
        UPDATE users
        SET colors = ARRAY_APPEND(colors, ${color})
        WHERE clerk_id = ${clerkId}
        RETURNING *;
        `
    } else if (salt !== undefined) {
        response = await sql`
         UPDATE users
          SET salt = ${salt}
          WHERE clerk_id = ${clerkId}
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

    return new Response(JSON.stringify({ data: response,  status: 200 }));
  } catch (error: any) {
    console.error("Error updating user info:", error);
    // Check for username uniqueness violation
    if (error.code === "23505" && error.constraint === "users_username_key") {
      return Response.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
