import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Brief from "@/models/Brief";
import User from "@/models/User";
import DashboardClient from "./DashboardClient";

// Force dynamic rendering so Vercel never serves a cached version of this page.
// Without this, the router cache can redirect back to /select-domain even after
// the domain PATCH has been saved — because /dashboard is served from a stale snapshot.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  // Redirect based on chosen domain
  const user = await User.findById(session.user.id);
  if (!user?.domain || !["tech", "commerce", "engineering"].includes(user.domain)) {
    redirect("/dashboard/select-domain");
  } else if (user.domain !== "tech") {
    redirect(`/dashboard/${user.domain}`);
  }

  const briefs = await Brief.find({ userId: session.user.id, domain: { $in: ["tech", null] } })
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
