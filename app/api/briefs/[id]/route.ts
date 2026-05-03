import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, brief, refinement } = await req.json();
    if (!status && !brief && !refinement) {
      return NextResponse.json({ message: "Missing update fields" }, { status: 400 });
    }

    await connectToDatabase();
    
    const updateQuery: any = {};
    if (status) {
      updateQuery.$set = { ...updateQuery.$set, status };
    }
    if (brief) {
      updateQuery.$set = { ...updateQuery.$set, brief };
    }
    if (refinement) {
      updateQuery.$push = { refinements: refinement };
    }

    const updatedBrief = await Brief.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      updateQuery,
      { new: true }
    );

    if (!updatedBrief) {
      return NextResponse.json({ message: "Not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedBrief);
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const deletedBrief = await Brief.findOneAndDelete({ _id: params.id, userId: session.user.id });

    if (!deletedBrief) {
      return NextResponse.json({ message: "Not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
