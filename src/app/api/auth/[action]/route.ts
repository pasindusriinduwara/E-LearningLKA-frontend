import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
    const { action } = await context.params;
    return authenticate(request, action);
}
