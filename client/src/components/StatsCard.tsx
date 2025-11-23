import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <div className="space-y-2" data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <Card className="bg-blue-100 dark:bg-blue-900/20">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold" data-testid="text-stat-value">
              {value}
            </div>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          {trend && (
            <p
              className={`text-xs mt-1 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
              data-testid="text-stat-trend"
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}% from last month
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
