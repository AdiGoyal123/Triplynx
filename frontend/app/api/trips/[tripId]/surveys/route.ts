import type { NextRequest } from "next/server";

const MAINTENANCE_MESSAGE =
  "Tried to create a survey but that server functionality is under maintenance";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ tripId: string }> },
) {
  await context.params;
  console.log("survey created");

  return Response.json(
    { message: MAINTENANCE_MESSAGE },
    { status: 200 },
  );
}
