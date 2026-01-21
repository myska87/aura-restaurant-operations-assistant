import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Share2, TrendingUp, MessageSquare } from 'lucide-react';

export default function MarketingInsights({ dateRange = {} }) {
  const socialData = [
    { date: 'Mon', followers: 4200, engagement: 3.2, reach: 8500 },
    { date: 'Tue', followers: 4350, engagement: 3.8, reach: 9200 },
    { date: 'Wed', followers: 4520, engagement: 4.1, reach: 10100 },
    { date: 'Thu', followers: 4680, engagement: 3.9, reach: 9800 },
    { date: 'Fri', followers: 4920, engagement: 5.2, reach: 12500 },
    { date: 'Sat', followers: 5150, engagement: 6.1, reach: 15200 },
    { date: 'Sun', followers: 5380, engagement: 4.8, reach: 11800 }
  ];

  const campaignData = [
    { campaign: 'Weekend Brunch', reach: 12500, clicks: 845, conversions: 142, roi: 320 },
    { campaign: 'Lunch Combo Deal', reach: 9800, clicks: 623, conversions: 98, roi: 280 },
    { campaign: 'New Menu Launch', reach: 15200, clicks: 1280, conversions: 189, roi: 410 },
    { campaign: 'Student Discount', reach: 8500, clicks: 510, conversions: 76, roi: 220 }
  ];

  const topPosts = [
    { title: 'Butter Chicken Roll Showcase', likes: 1240, shares: 340, comments: 128 },
    { title: 'Behind-the-Scenes Kitchen', likes: 980, shares: 280, comments: 95 },
    { title: 'Customer Reviews Highlight', likes: 756, shares: 210, comments: 74 }
  ];

  const totalReach = socialData.reduce((sum, d) => sum + d.reach, 0);
  const avgEngagement = (socialData.reduce((sum, d) => sum + d.engagement, 0) / socialData.length).toFixed(1);
  const followerGrowth = ((5380 - 4200) / 4200 * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">5.3K</p>
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
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">£{totalReach.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Weekly Reach</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{avgEngagement}%</p>
                  <p className="text-xs text-slate-500">Avg Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">+{followerGrowth}%</p>
                  <p className="text-xs text-slate-500">Follower Growth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Social Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={socialData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="followers" stroke="#059669" strokeWidth={2} name="Followers" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaignData.map((camp, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800">{camp.campaign}</p>
                  <Badge className="bg-emerald-100 text-emerald-700">ROI: {camp.roi}%</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Reach</p>
                    <p className="font-bold">{camp.reach.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Clicks</p>
                    <p className="font-bold text-blue-600">{camp.clicks}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Conversions</p>
                    <p className="font-bold text-green-600">{camp.conversions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPosts.map((post, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{post.title}</p>
                  <div className="flex gap-4 mt-1 text-xs text-slate-600">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                    <span>↗️ {post.shares}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={socialData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="engagement" fill="#ec4899" radius={[8, 8, 0, 0]} name="Engagement %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Marketing Insights */}
      <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 mb-2">
            <strong>📱 Marketing Insights & Recommendations:</strong>
          </p>
          <ul className="text-xs text-blue-800 space-y-1 ml-4">
            <li>• Follower growth at {followerGrowth}% week-on-week — accelerating nicely!</li>
            <li>• New Menu Launch campaign driving highest ROI at 410% — replicate this format</li>
            <li>• Weekend engagement peaks at 5-6% — push more content Friday-Sunday</li>
            <li>• Behind-the-Scenes content performs well — increase production frequency</li>
            <li>• Reach averaging {(totalReach / 7).toFixed(0)}/day — target 12K+ daily reach</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}