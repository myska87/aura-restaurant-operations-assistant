import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MarketingInsights({ dateRange = {} }) {
  // Placeholder social data (would be connected to real APIs)
  const socialMetrics = {
    instagram: { followers: 2450, engagement: 5.8, reach: 8920 },
    tiktok: { followers: 1230, engagement: 7.2, reach: 15600 },
    google: { reviews: 87, rating: 4.7, visits: 1230 }
  };

  const weeklyEngagementData = [
    { day: 'Mon', instagram: 4.2, tiktok: 6.1, google: 3.9 },
    { day: 'Tue', instagram: 4.8, tiktok: 6.8, google: 4.2 },
    { day: 'Wed', instagram: 5.1, tiktok: 6.9, google: 4.5 },
    { day: 'Thu', instagram: 5.2, tiktok: 7.1, google: 4.8 },
    { day: 'Fri', instagram: 6.2, tiktok: 8.3, google: 5.2 },
    { day: 'Sat', instagram: 6.8, tiktok: 8.9, google: 5.9 },
    { day: 'Sun', instagram: 6.1, tiktok: 7.8, google: 5.1 }
  ];

  const campaigns = [
    { name: 'Winter Menu Launch', status: 'Active', engagement: '8.2%', reach: 12400, days: 14 },
    { name: 'Loyalty Rewards', status: 'Active', engagement: '6.1%', reach: 5600, days: 7 },
    { name: 'Weekend Brunch Push', status: 'Pending', engagement: '-', reach: 0, days: 0 }
  ];

  const totalFollowers = 
    socialMetrics.instagram.followers + 
    socialMetrics.tiktok.followers;

  const avgEngagement = (
    (socialMetrics.instagram.engagement + socialMetrics.tiktok.engagement) / 2
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-600">{totalFollowers.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Total Followers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{avgEngagement}%</p>
                  <p className="text-xs text-slate-500">Avg Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{socialMetrics.google.reviews}</p>
                  <p className="text-xs text-slate-500">Google Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{socialMetrics.google.rating}</p>
                  <p className="text-xs text-slate-500">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Social Platforms */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 Instagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Followers</p>
                <p className="text-2xl font-bold text-slate-800">{socialMetrics.instagram.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Engagement Rate</p>
                <p className="text-2xl font-bold text-pink-600">{socialMetrics.instagram.engagement}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Weekly Reach</p>
                <p className="text-lg font-semibold text-slate-800">{socialMetrics.instagram.reach.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎵 TikTok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Followers</p>
                <p className="text-2xl font-bold text-slate-800">{socialMetrics.tiktok.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Engagement Rate</p>
                <p className="text-2xl font-bold text-purple-600">{socialMetrics.tiktok.engagement}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Weekly Reach</p>
                <p className="text-lg font-semibold text-slate-800">{socialMetrics.tiktok.reach.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Google
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Reviews</p>
                <p className="text-2xl font-bold text-slate-800">{socialMetrics.google.reviews}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Rating</p>
                <p className="text-2xl font-bold text-amber-600">⭐ {socialMetrics.google.rating}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Monthly Visits</p>
                <p className="text-lg font-semibold text-slate-800">{socialMetrics.google.visits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Engagement Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyEngagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Area type="monotone" dataKey="instagram" stackId="1" stroke="#e1306c" fill="#e1306c" opacity={0.8} name="Instagram" />
              <Area type="monotone" dataKey="tiktok" stackId="1" stroke="#000" fill="#000" opacity={0.6} name="TikTok" />
              <Area type="monotone" dataKey="google" stackId="1" stroke="#4285f4" fill="#4285f4" opacity={0.6} name="Google" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.map((campaign, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{campaign.name}</p>
                  <p className="text-xs text-slate-600">{campaign.days} days running</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={campaign.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}
                  >
                    {campaign.status}
                  </Badge>
                  {campaign.engagement !== '-' && (
                    <Badge className="bg-blue-100 text-blue-700">{campaign.engagement}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900 mb-2">
            <strong>🔮 Marketing Insights:</strong>
          </p>
          <ul className="text-xs text-amber-800 space-y-1 ml-4">
            <li>• TikTok engagement is 24% higher than Instagram — boost TikTok content budget</li>
            <li>• Friday-Saturday show 28% higher engagement — schedule top content for weekends</li>
            <li>• Winter Menu campaign performing well at 8.2% — continue momentum into Q1</li>
            <li>• Google reviews improved +5 this month — feature positive reviews in ads</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}