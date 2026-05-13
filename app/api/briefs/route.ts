import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const domain = (searchParams.get("domain") as "tech" | "commerce" | "engineering") || "tech";

    await connectToDatabase();
    const briefs = await Brief.find({ userId: session.user.id, domain })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(briefs);
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { formInput, brief, domain = "tech" } = body;

    if (!formInput || !brief) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (
      typeof brief.problem !== "string" ||
      typeof brief.scaffold !== "string" ||
      !Array.isArray(brief.checkpoints) ||
      typeof brief.stretch !== "string"
    ) {
      return NextResponse.json({ message: "Invalid brief payload" }, { status: 400 });
    }

    await connectToDatabase();
    const newBrief = await Brief.create({
      userId: session.user.id,
      formInput,
      brief,
      domain,
    });

    return NextResponse.json(newBrief, { status: 201 });
  } catch (error) {
    console.error("Failed to create brief:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
