import { neon } from "@neondatabase/serverless";

export async function GET() {
  const startedAt = Date.now();

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const [db] = await sql`
      SELECT
        NOW() AS checked_at,
        (SELECT COUNT(*)::int FROM drivers) AS driver_count;
    `;

    console.log("[API] health ok", {
      durationMs: Date.now() - startedAt,
      driverCount: db.driver_count,
    });

    return Response.json({
      ok: true,
      api: "reachable",
      database: "reachable",
      driverCount: db.driver_count,
      checkedAt: db.checked_at,
    });
  } catch (error) {
    console.error("[API] health failed", {
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        ok: false,
        api: "reachable",
        database: "unreachable",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
