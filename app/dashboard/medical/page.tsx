import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";
import MedicalDashboardClient from "./MedicalDashboardClient";

export const metadata = {
  title: "Candela | Medical Dashboard",
};

export default async function MedicalDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const briefs = await Brief.find({ 
    userId: session.user.id,
    domain: "medical"
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

  return <MedicalDashboardClient initialBriefs={serializedBriefs} user={userProp} />;
}
