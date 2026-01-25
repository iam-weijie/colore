import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { clerkId, shorthandEmojis } = await request.json();

    if (!clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(shorthandEmojis) || shorthandEmojis.length !== 6) {
      return Response.json(
        { error: "Shorthand emojis must be an array of exactly 6 emojis" },
        { status: 400 }
      );
    }

    // Check if shorthand_emojis column exists
    const columnExists = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'shorthand_emojis'
    `;

    if (columnExists.length === 0) {
      return Response.json(
        {
          error: "Database column missing. Please add the shorthand_emojis column to your users table.",
          instructions: "Run this SQL in your database: ALTER TABLE users ADD COLUMN shorthand_emojis JSONB DEFAULT NULL;",
          sqlFile: "See scripts/add-emoji-column.sql for the complete migration script"
        },
        { status: 503 }
      );
    }

    // Update user's shorthand emoji preferences
    const response = await sql`
      UPDATE users
      SET shorthand_emojis = ${JSON.stringify(shorthandEmojis)}
      WHERE clerk_id = ${clerkId}
      RETURNING *
    `;

    if (response.length === 0) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Emoji preferences updated successfully",
        data: response[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating emoji preferences:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("clerkId");

    if (!clerkId) {
      return Response.json(
        { error: "Missing clerkId parameter" },
        { status: 400 }
      );
    }

    // Check if shorthand_emojis column exists
    const columnExists = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'shorthand_emojis'
    `;

    if (columnExists.length === 0) {
      // Return default emojis if column doesn't exist yet
      return Response.json(
        {
          success: true,
          data: {
            shorthandEmojis: null
          }
        },
        { status: 200 }
      );
    }

    // Get user's shorthand emoji preferences
    const response = await sql`
      SELECT shorthand_emojis
      FROM users
      WHERE clerk_id = ${clerkId}
    `;

    if (response.length === 0) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const shorthandEmojis = response[0].shorthand_emojis;

    return Response.json(
      {
        success: true,
        data: {
          shorthandEmojis: shorthandEmojis || null
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching emoji preferences:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
