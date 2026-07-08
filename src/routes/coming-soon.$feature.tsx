import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/coming-soon/$feature")({
  head: ({ params }) => ({ meta: [{ title: `${params.feature} — Coming soon` }] }),
  component: ComingSoon,
});

function ComingSoon() {
  const { feature } = Route.useParams();
  const pretty = feature.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title={pretty} back="/payments" />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 pb-16 pt-16 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary-soft text-primary shadow-glow">
          <Sparkles className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">{pretty} is on the way</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          We're crafting {pretty.toLowerCase()} for Payroxa. You'll be first to know when it
          launches.
        </p>
        <button className="mt-6 h-11 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow">
          Notify me
        </button>
        <Link to="/home" className="mt-3 text-xs font-semibold text-muted-foreground">
          Back to home
        </Link>
      </main>
    </div>
  );
}
