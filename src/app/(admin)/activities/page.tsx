import { ActivitiesCard } from "@/app/(admin)/dashboard/activities-card";
import {
  buildDashboardActivities,
  getDashboardPageData,
} from "@/data/dashboard";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const data = await getDashboardPageData();
  const activities = buildDashboardActivities(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Activities
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View recent product, stock, and selling activity in one place.
        </p>
      </div>

      <ActivitiesCard activities={activities} />
    </div>
  );
}
