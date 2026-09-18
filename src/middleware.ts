import { NextResponse, type NextRequest } from "next/server";

const STUDENT_ROUTES = [
  "/dashboard",
  "/classes",
  "/schedule",
  "/fees",
  "/materials",
  "/assessments",
  "/enrollment",
  "/messages",
  "/settings",
];

const TEACHER_ROUTES = [
  "/teacher",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("user_role")?.value?.toUpperCase();

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isTeacherRoute = TEACHER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isStudentRoute = STUDENT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  // If already authenticated and trying to visit login/register, redirect to appropriate dashboard
  if (isAuthRoute && token) {
    const target = role === "TEACHER" ? "/teacher/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // If unauthenticated and trying to access protected routes, redirect to login
  if (!token && (isTeacherRoute || isStudentRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cross-role protection if role is known
  if (token && role) {
    if (role === "STUDENT" && isTeacherRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (role === "TEACHER" && isStudentRoute) {
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/classes/:path*",
    "/schedule/:path*",
    "/fees/:path*",
    "/materials/:path*",
    "/assessments/:path*",
    "/enrollment/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/teacher/:path*",
    "/login",
    "/register",
  ],
};
