import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Upload,
  Save,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function GlobalInfo() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    restaurant_name: '',
    logo_url: '',
    tagline: '',
    theme_color: '#2E7D32',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
    website: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    supervisor_name: '',
    supervisor_email: '',
    supervisor_phone: '',
    assistant_manager_name: '',
    assistant_manager_phone: '',
    opening_hours: '',
    wifi_code: '',
    store_code: '',
    company_name: '',
    vat_number: '',
    hygiene_rating: 5,
    license_expiry_alcohol: '',
    license_expiry_music: '',
    license_expiry_food: '',
    insurance_policy_number: '',
    insurance_expiry: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: existingInfo, isLoading } = useQuery({
    queryKey: ['global-info'],
    queryFn: async () => {
      const results = await base44.entities.GlobalInfo.list('-created_date', 1);
      return results[0] || null;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (existingInfo) {
      setFormData(existingInfo);
    }
  }, [existingInfo]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingInfo?.id) {
        return base44.entities.GlobalInfo.update(existingInfo.id, data);
      } else {
        return base44.entities.GlobalInfo.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['global-info']);
      alert('✅ Restaurant information updated successfully!');
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
    } catch (error) {
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.restaurant_name) {
      alert('Please enter a restaurant name');
      return;
    }
    saveMutation.mutate(formData);
  };

  if (!user) return <LoadingSpinner />;
  if (isLoading) return <LoadingSpinner message="Loading restaurant information..." />;

  const isAdmin = user.role === 'admin' || user.role === 'owner' || user.role === 'manager';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold mb-2">Admin Access Required</h3>
            <p className="text-slate-600">Only administrators can edit restaurant information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Restaurant Information"
        description="Manage your restaurant's global information - updates automatically across all modules"
      />

      {/* Preview Footer Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview - Generated Footer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {formData.logo_url && (
                <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border bg-white p-2" />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{formData.restaurant_name || 'Restaurant Name'}</h3>
                {formData.tagline && <p className="text-sm text-slate-600 italic">{formData.tagline}</p>}
                <p className="text-sm text-slate-700 mt-2">
                  {formData.address && `${formData.address}, `}
                  {formData.city && `${formData.city} `}
                  {formData.postcode}
                </p>
                {formData.manager_name && (
                  <p className="text-sm text-slate-700">
                    Manager: {formData.manager_name} | Tel: {formData.phone || 'N/A'} | Email: {formData.email || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            Brand Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Restaurant Name *</Label>
            <Input
              value={formData.restaurant_name}
              onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
              placeholder="e.g., Chai Patta Coventry"
            />
          </div>

          <div>
            <Label>Logo Upload</Label>
            <div className="flex items-center gap-4">
              {formData.logo_url && (
                <img src={formData.logo_url} alt="Logo" className="w-20 h-20 object-contain border rounded-lg p-2" />
              )}
              <Button variant="outline" className="relative" disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>

          <div>
            <Label>Tagline</Label>
            <Input
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g., Every Cup Has a Story"
            />
          </div>

          <div>
            <Label>Theme Color</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                placeholder="#2E7D32"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Address</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 53 The Brow"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Watford"
              />
            </div>
            <div>
              <Label>Postcode</Label>
              <Input
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                placeholder="e.g., WD25 7NY"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01234 567890"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@restaurant.com"
              />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.restaurant.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Management Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Management Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Manager Name</Label>
              <Input
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                placeholder="Manager name"
              />
            </div>
            <div>
              <Label>Manager Email</Label>
              <Input
                type="email"
                value={formData.manager_email}
                onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                placeholder="manager@email.com"
              />
            </div>
            <div>
              <Label>Manager Phone</Label>
              <Input
                value={formData.manager_phone}
                onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                placeholder="Phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Supervisor Name</Label>
              <Input
                value={formData.supervisor_name}
                onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                placeholder="Supervisor name"
              />
            </div>
            <div>
              <Label>Supervisor Email</Label>
              <Input
                type="email"
                value={formData.supervisor_email}
                onChange={(e) => setFormData({ ...formData, supervisor_email: e.target.value })}
                placeholder="supervisor@email.com"
              />
            </div>
            <div>
              <Label>Supervisor Phone</Label>
              <Input
                value={formData.supervisor_phone}
                onChange={(e) => setFormData({ ...formData, supervisor_phone: e.target.value })}
                placeholder="Phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assistant Manager</Label>
              <Input
                value={formData.assistant_manager_name}
                onChange={(e) => setFormData({ ...formData, assistant_manager_name: e.target.value })}
                placeholder="Assistant manager name"
              />
            </div>
            <div>
              <Label>Assistant Manager Phone</Label>
              <Input
                value={formData.assistant_manager_phone}
                onChange={(e) => setFormData({ ...formData, assistant_manager_phone: e.target.value })}
                placeholder="Phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Opening Hours</Label>
              <Input
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                placeholder="e.g., 8:00 - 22:00"
              />
            </div>
            <div>
              <Label>Wi-Fi Code</Label>
              <Input
                value={formData.wifi_code}
                onChange={(e) => setFormData({ ...formData, wifi_code: e.target.value })}
                placeholder="Wi-Fi password"
              />
            </div>
            <div>
              <Label>Store Code</Label>
              <Input
                value={formData.store_code}
                onChange={(e) => setFormData({ ...formData, store_code: e.target.value })}
                placeholder="Internal code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Compliance & Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name (Legal)</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Registered company name"
              />
            </div>
            <div>
              <Label>VAT Number</Label>
              <Input
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                placeholder="GB123456789"
              />
            </div>
          </div>

          <div>
            <Label>FSA Hygiene Rating (1-5)</Label>
            <Input
              type="number"
              min="1"
              max="5"
              value={formData.hygiene_rating}
              onChange={(e) => setFormData({ ...formData, hygiene_rating: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Alcohol License Expiry</Label>
              <Input
                type="date"
                value={formData.license_expiry_alcohol}
                onChange={(e) => setFormData({ ...formData, license_expiry_alcohol: e.target.value })}
              />
            </div>
            <div>
              <Label>Music License Expiry</Label>
              <Input
                type="date"
                value={formData.license_expiry_music}
                onChange={(e) => setFormData({ ...formData, license_expiry_music: e.target.value })}
              />
            </div>
            <div>
              <Label>Food License Expiry</Label>
              <Input
                type="date"
                value={formData.license_expiry_food}
                onChange={(e) => setFormData({ ...formData, license_expiry_food: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Insurance Policy Number</Label>
              <Input
                value={formData.insurance_policy_number}
                onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                placeholder="Policy number"
              />
            </div>
            <div>
              <Label>Insurance Expiry</Label>
              <Input
                type="date"
                value={formData.insurance_expiry}
                onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-2xl text-lg px-8 py-6"
          size="lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Restaurant Info'}
        </Button>
      </div>
    </div>
  );
}