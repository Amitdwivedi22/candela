import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";
import CommerceDashboardClient from "./CommerceDashboardClient";

export const metadata = {
  title: "Nextstep | Commerce Dashboard",
};

export default async function CommerceDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const briefs = await Brief.find({ 
    userId: session.user.id,
    domain: "commerce"
  })
    .sort({ createdAt: -1 })
    .lean();

  const userProp = {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };

  return (
    <CommerceDashboardClient
      initialBriefs={JSON.parse(JSON.stringify(briefs))}
      user={userProp}
    />
  );
}
