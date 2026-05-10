import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";
import CommerceDashboardClient from "./CommerceDashboardClient";

export const metadata = {
  title: "Candela | Commerce Dashboard",
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
  }).sort({ createdAt: -1 });

  const serializedBriefs = briefs.map((b) => ({
    _id: b._id.toString(),
    formInput: b.formInput,
    brief: b.brief,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  }));

  const userProp = {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };

  return <CommerceDashboardClient initialBriefs={serializedBriefs} user={userProp} />;
}
