import StatsCard from "../StatsCard";
import { Package, TrendingUp, Clock, Archive } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Active Offers"
        value={12}
        icon={Package}
        trend={{ value: 20, isPositive: true }}
      />
      <StatsCard
        title="Total Views"
        value="2,547"
        icon={TrendingUp}
        trend={{ value: 15, isPositive: true }}
      />
      <StatsCard
        title="Ending Soon"
        value={3}
        icon={Clock}
      />
      <StatsCard
        title="Expired"
        value={45}
        icon={Archive}
        trend={{ value: 8, isPositive: false }}
      />
    </div>
  );
}
