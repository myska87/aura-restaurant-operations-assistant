import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditFormsLibrary({ auditForms = [], user }) {
  const frequencyColors = {
    daily: 'bg-blue-100 text-blue-800',
    weekly: 'bg-emerald-100 text-emerald-800',
    monthly: 'bg-purple-100 text-purple-800',
    custom: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📋 Audit Forms Library</CardTitle>
            <Badge variant="outline">{auditForms.length} forms</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {auditForms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No audit forms available yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditForms.map(form => (
                <div key={form.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold">{form.title}</p>
                      <Badge className={frequencyColors[form.frequency] || 'bg-slate-100'}>
                        {form.frequency?.toUpperCase()}
                      </Badge>
                      {form.status === 'approved' && (
                        <Badge className="bg-emerald-100 text-emerald-800">✓ Approved</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{form.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-slate-500">
                      <span>Assigned to: {form.assigned_to || 'All'}</span>
                      <span>Updated: {format(new Date(form.updated_date), 'MMM d')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {user?.role === 'admin' && (
                      <>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Audit Form</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Create custom audit forms to track specific compliance requirements
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              + Create New Form
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}