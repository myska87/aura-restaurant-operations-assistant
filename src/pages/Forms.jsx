import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Plus, ArrowRight, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Forms() {
  const [user, setUser] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [responses, setResponses] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.filter({ is_active: true }),
    enabled: !!user
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ['mySubmissions', user?.email],
    queryFn: () => base44.entities.FormSubmission.filter({ submitted_by: user.email }, '-submission_date', 20),
    enabled: !!user?.email
  });

  const submitFormMutation = useMutation({
    mutationFn: (data) => base44.entities.FormSubmission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['mySubmissions']);
      setSelectedForm(null);
      setResponses({});
      alert('Form submitted successfully!');
    }
  });

  const handleSubmit = () => {
    submitFormMutation.mutate({
      form_id: selectedForm.id,
      form_title: selectedForm.title,
      submitted_by: user.email,
      submitted_by_name: user.full_name || user.email,
      submission_date: new Date().toISOString(),
      responses
    });
  };

  if (!user) return <LoadingSpinner />;

  const isFormComplete = selectedForm && selectedForm.fields?.every(field => 
    !field.required || responses[field.name]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quick Forms"
        description="Fill and submit forms quickly"
      />

      {/* Available Forms */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map(form => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedForm(form)}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <Badge>{form.category}</Badge>
              </div>
              <h3 className="font-bold text-lg mb-2">{form.title}</h3>
              <p className="text-sm text-slate-600">{form.fields?.length || 0} fields</p>
              <Button className="w-full mt-4" size="sm">
                Fill Form
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Submissions */}
      {mySubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mySubmissions.map(sub => (
                <div key={sub.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{sub.form_title}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(sub.submission_date), 'MMM d, HH:mm')}
                      </span>
                      <Badge variant="outline" className="text-xs">{sub.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedForm && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedForm.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedForm.fields?.map((field, idx) => (
                  <div key={idx}>
                    <Label>
                      {field.label}
                      {field.required && <span className="text-red-600 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        value={responses[field.name] || ''}
                        onChange={(e) => setResponses({...responses, [field.name]: e.target.value})}
                        placeholder={field.label}
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        value={responses[field.name] || ''}
                        onChange={(e) => setResponses({...responses, [field.name]: e.target.value})}
                        placeholder={field.label}
                        rows={4}
                      />
                    )}
                    
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        value={responses[field.name] || ''}
                        onChange={(e) => setResponses({...responses, [field.name]: e.target.value})}
                        placeholder={field.label}
                      />
                    )}
                    
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={responses[field.name] || ''}
                        onChange={(e) => setResponses({...responses, [field.name]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedForm(null)}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormComplete || submitFormMutation.isPending}
                    className="bg-emerald-600"
                  >
                    Submit Form
                  </Button>
                  <Button
                    onClick={() => {
                      setResponses({});
                    }}
                    variant="outline"
                  >
                    Fill Another
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}