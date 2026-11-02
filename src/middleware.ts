import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isTokenExpired = (token: string): boolean => {
	try {
		const payloadBase64 = token.split(".")[1];
		const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());

		const exp = payload.exp;
		if (!exp) return true;

		const now = Math.floor(Date.now() / 1000);
		return exp < now;
	} catch (error) {
		return true;
	}
};

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const accessToken = request.cookies.get("access_token")?.value;

	if (
		(!accessToken || isTokenExpired(accessToken)) &&
		!pathname.startsWith("/login")
	) {
		const response = NextResponse.redirect(new URL("/login", request.url));

		response.cookies.delete("access_token");
		return response;
	}

	if (pathname.startsWith("/login") && !isTokenExpired(accessToken as string)) {
		return NextResponse.redirect(
			new URL("/e-tariff-classification/manual-input", request.url)
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/customs-health-check/:path*",
		"/e-tariff-classification/:path*",
		"/login"
	]
};
