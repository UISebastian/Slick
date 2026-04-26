import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "slick",
    timestamp: new Date().toISOString()
  });
}
