import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const briefs = await Brief.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <DashboardClient
      initialBriefs={JSON.parse(JSON.stringify(briefs))}
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        id: session.user.id,
      }}
    />
  );
}
