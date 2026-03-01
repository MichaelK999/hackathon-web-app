import { NextResponse } from "next/server";

const APP_VERSION = 1;

export function GET() {
	return NextResponse.json({ version: APP_VERSION });
}
