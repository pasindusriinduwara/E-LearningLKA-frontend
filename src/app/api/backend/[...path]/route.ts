import type { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/server/backend";

export const runtime = "nodejs";

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    return proxyBackend(request, path);
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as HEAD };
