import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar, MapPin, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PersonalDetails({ user, staffProfile }) {
  const details = [
    { icon: Mail, label: 'Email', value: user.email, color: 'blue' },
    { icon: Phone, label: 'Phone', value: staffProfile?.phone, color: 'emerald' },
    { icon: Calendar, label: 'Joined', value: staffProfile?.hire_date ? format(new Date(staffProfile.hire_date), 'MMM d, yyyy') : null, color: 'purple' },
    { icon: MapPin, label: 'Location', value: 'Main Store', color: 'amber' },
    { icon: User, label: 'Emergency Contact', value: staffProfile?.emergency_contact, color: 'red' }
  ].filter(d => d.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Personal Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {details.map((detail, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${detail.color}-100 flex items-center justify-center flex-shrink-0`}>
              <detail.icon className={`w-5 h-5 text-${detail.color}-600`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{detail.label}</p>
              <p className="font-medium text-sm truncate">{detail.value}</p>
            </div>
          </div>
        ))}
        
        {staffProfile?.notes && (
          <div className="p-3 bg-slate-50 rounded-lg mt-4">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{staffProfile.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}