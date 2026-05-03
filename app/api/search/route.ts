import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Suggestion } from "@/models/Suggestion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type");

    // Early return for empty or missing queries
    if (!q || !type || q.trim().length === 0) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    // Protect against excessively long queries (ReDoS mitigation)
    const sanitizedQuery = q.trim().slice(0, 50);

    await connectToDatabase();

    // Escape regex string for safety
    const safeQuery = sanitizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Case-insensitive regex matching
    // For large datasets, consider an anchored regex (`^${safeQuery}`) with an index,
    // or MongoDB Atlas Search for optimal performance.
    const suggestions = await Suggestion.find({
      type,
      text: { $regex: safeQuery, $options: "i" },
    })
      .limit(5)
      .select("text -_id")
      .lean()
      .maxTimeMS(2000); // Prevent long-running queries from blocking the DB

    const results = suggestions.map((s: { text: string }) => s.text);

    return NextResponse.json(
      { suggestions: results },
      {
        status: 200,
        headers: {
          // Cache responses at the CDN edge to reduce database load
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
