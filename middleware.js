// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. Identify if this is an internal call from your dashboard/live API
  const isInternalDashboardCall = request.headers.get('x-internal-call') === 'dashboard-combine';

  // 2. If it's an internal call, let it proceed without authentication checks by this middleware.
  //    This is because your internal APIs (alcohol, drowsiness, etc.) don't require auth themselves.
  if (isInternalDashboardCall) {
    return NextResponse.next();
  }

  // 3. For ALL other requests (i.e., external client requests to any /api route),
  //    you might still want to enforce authentication.
  //    This part assumes you HAVE some form of external user authentication.
  //    If your application doesn't have any external user authentication,
  //    you can simplify this by just returning NextResponse.next() here.

  const authorizationHeader = request.headers.get('authorization');

  // Check if an Authorization header is present for external calls
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    // If not, return a 401 Unauthorized response for external clients
    // The Vercel platform-level check might still catch this too, but it's good practice.
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Unauthorized: Authentication required.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 4. (Optional) If you DO have external user authentication,
  //    this is where you would validate the user's JWT.
  //    The token from `x-vercel-sc-headers` is for Vercel's internal use,
  //    so your user's actual token would be the one directly in `Authorization`.
  //    Example (you'll need to import `jwt` library if using this):
  /*
  const token = authorizationHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.YOUR_USER_JWT_SECRET);
    // You can attach decoded user info to the request for your API routes if needed
    // request.headers.set('x-user-data', JSON.stringify(decoded));
    return NextResponse.next(); // Allow valid authenticated external requests
  } catch (error) {
    // Token is invalid (e.g., expired, wrong signature for YOUR secret)
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Unauthorized: Invalid or expired token.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  */

  // If no explicit external authentication is needed, just allow all requests past the internal check.
  return NextResponse.next();
}

// This config tells the middleware to run for all requests to paths starting with /api/
export const config = {
  matcher: '/api/:path*',
};