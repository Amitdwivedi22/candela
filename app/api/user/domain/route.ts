import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain } = await req.json();
    const validDomains = ["tech", "commerce", "engineering", "medical"];
    if (!validDomains.includes(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { domain },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ domain: user.domain });
  } catch (error) {
    console.error("Error updating domain:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select("domain");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ domain: user.domain || "tech" });
  } catch (error) {
    console.error("Error fetching domain:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
