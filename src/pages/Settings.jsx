import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    notifications_email: true,
    notifications_shift: true,
    notifications_training: true,
    notifications_inventory: true,
    theme: 'light',
    language: 'en'
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.settings) {
          setSettings(prev => ({ ...prev, ...userData.settings }));
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500">Manage your account preferences</p>
      </motion.div>

      <Tabs defaultValue="notifications">
        <TabsList className="bg-white border">
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Control what notifications you receive via email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Shift Reminders</p>
                  <p className="text-sm text-slate-500">Get notified about upcoming shifts</p>
                </div>
                <Switch 
                  checked={settings.notifications_shift}
                  onCheckedChange={(checked) => setSettings({...settings, notifications_shift: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Training Updates</p>
                  <p className="text-sm text-slate-500">Notifications about new training content</p>
                </div>
                <Switch 
                  checked={settings.notifications_training}
                  onCheckedChange={(checked) => setSettings({...settings, notifications_training: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Inventory Alerts</p>
                  <p className="text-sm text-slate-500">Low stock and reorder notifications</p>
                </div>
                <Switch 
                  checked={settings.notifications_inventory}
                  onCheckedChange={(checked) => setSettings({...settings, notifications_inventory: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Digest</p>
                  <p className="text-sm text-slate-500">Receive daily summary emails</p>
                </div>
                <Switch 
                  checked={settings.notifications_email}
                  onCheckedChange={(checked) => setSettings({...settings, notifications_email: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={user.full_name || ''} disabled className="bg-slate-50" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email || ''} disabled className="bg-slate-50" />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={user.role || 'Staff'} disabled className="bg-slate-50 capitalize" />
              </div>
              <p className="text-sm text-slate-500">
                Contact an administrator to update your account details.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                Your account is secured with password authentication.
              </p>
              <Button variant="outline">Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => setSettings({...settings, theme: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Language</Label>
                <Select 
                  value={settings.language} 
                  onValueChange={(value) => setSettings({...settings, language: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className={`
            transition-all duration-300
            ${saved 
              ? 'bg-emerald-600 hover:bg-emerald-600' 
              : 'bg-gradient-to-r from-emerald-600 to-emerald-700'
            }
          `}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : saving ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}