import { stackServerApp } from "@/stack";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const user = await stackServerApp.getUser({ tokenStore: request });

    if (!user) {
        return NextResponse.redirect(new URL('/handler/sign-in', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/projects/:path*",
        "/admin/:path*",
        "/account-settings",
    ],
};
