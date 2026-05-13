import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";
import EngineeringDashboardClient from "./EngineeringDashboardClient";

export const metadata = {
  title: "Nextstep | Engineering Dashboard",
};

export default async function EngineeringDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const briefs = await Brief.find({ 
    userId: session.user.id,
    domain: "engineering"
  })
    .sort({ createdAt: -1 })
    .lean();

  const userProp = {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };

  return (
    <EngineeringDashboardClient
      initialBriefs={JSON.parse(JSON.stringify(briefs))}
      user={userProp}
    />
  );
}
