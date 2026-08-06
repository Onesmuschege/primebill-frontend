import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  Calendar
} from 'lucide-react';

export default function PlatformSubscriptionAnalytics() {
  // Fetch subscription analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['platform-subscription-analytics'],
    queryFn: async () => {
      // This would be a new endpoint - for now using stats
      return {
        total_revenue: 15000,
        monthly_revenue: 2500,
        churn_rate: 2.5,
        trial_conversion: 65,
        new_subscriptions: 12,
        upgrades: 5,
        downgrades: 2,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue and subscription metrics</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${analytics?.total_revenue?.toLocaleString() || '0'}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend="+15%"
          trendUp={true}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${analytics?.monthly_revenue?.toLocaleString() || '0'}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="Churn Rate"
          value={`${analytics?.churn_rate || 0}%`}
          icon={<Users className="w-5 h-5" />}
          trend="-2%"
          trendUp={true}
        />
        <StatCard
          title="Trial Conversion"
          value={`${analytics?.trial_conversion || 0}%`}
          icon={<CreditCard className="w-5 h-5" />}
          trend="+5%"
          trendUp={true}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Subscription Activity</h2>
        <div className="space-y-3">
          <ActivityItem
            type="new"
            description="New subscription started"
            tenant="Acme ISP"
            plan="Professional"
            time="2 hours ago"
          />
          <ActivityItem
            type="upgrade"
            description="Subscription upgraded"
            tenant="XYZ Networks"
            plan="Starter → Professional"
            time="5 hours ago"
          />
          <ActivityItem
            type="renewal"
            description="Subscription renewed"
            tenant="Beta Telecom"
            plan="Enterprise"
            time="1 day ago"
          />
          <ActivityItem
            type="cancel"
            description="Subscription cancelled"
            tenant="Gamma ISP"
            plan="Starter"
            time="2 days ago"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-gray-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </div>
          )}
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );
}

function ActivityItem({ type, description, tenant, plan, time }) {
  const getIcon = () => {
    switch (type) {
      case 'new': return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'upgrade': return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'renewal': return <div className="w-2 h-2 bg-purple-500 rounded-full" />;
      case 'cancel': return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{description}</p>
        <p className="text-sm text-gray-600">{tenant} - {plan}</p>
      </div>
      <div className="text-xs text-gray-500">{time}</div>
    </div>
  );
}