// functions/api.js
// Minimal Netlify function router with CORS.
// Endpoints:
//   GET  /api/test
//   POST /api/tickets/manual-payment

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // tighten to your origin later
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Normalize path (Netlify invokes as "/.netlify/functions/api/...")
  const rawPath = event.path || "/";
  const path = rawPath.replace(/^\/\.netlify\/functions\/api/, "") || "/";

  try {
    // Health / smoke test
    if (event.httpMethod === "GET" && (path === "/" || path === "/test")) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "ok",
          message: "Netlify function is working",
        }),
      };
    }

    // Public form submit (manual payment registration)
    if (event.httpMethod === "POST" && path === "/tickets/manual-payment") {
      const body = event.body ? JSON.parse(event.body) : {};
      const required = ["fullName", "phone", "nationalId", "email"];
      const missing = required.filter((k) => !body[k]);
      if (missing.length) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            ok: false,
            error: `Missing: ${missing.join(", ")}`,
          }),
        };
      }

      // Generate simple ticket id (stub). Replace later with DB + mail if needed.
      const ticketId =
        "MM-" + Math.random().toString(36).slice(2, 8).toUpperCase();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ ok: true, ticketId }),
      };
    }

    // Fallback 404 (function exists but route doesn't)
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ ok: false, error: "Route not found", path }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: err?.message || "Internal error",
      }),
    };
  }
};
