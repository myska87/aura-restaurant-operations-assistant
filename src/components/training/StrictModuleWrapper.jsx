import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const trainingModules = [
  { id: 'invitation', index: 0 },
  { id: 'vision', index: 1 },
  { id: 'values', index: 2 },
  { id: 'raving_fans', index: 3 },
  { id: 'skills', index: 4 },
  { id: 'hygiene', index: 5 },
  { id: 'certification', index: 6 },
  { id: 'growth', index: 7 }
];

export default function StrictModuleWrapper({ moduleId, children }) {
  const [user, setUser] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const progress = await base44.entities.TrainingJourneyProgress.filter({
          staff_email: userData.email
        });

        if (progress.length === 0) {
          setAllowed(true); // First module
          setLoading(false);
          return;
        }

        const jp = progress[0];
        const currentModuleIndex = jp.currentModuleIndex ?? 0;
        const moduleData = trainingModules.find(m => m.id === moduleId);

        if (!moduleData) {
          setLoading(false);
          return;
        }

        // Only allow if this is the current module OR it's completed
        const isCompleted = jp.moduleStatuses?.[moduleId] === 'completed';
        const isCurrentModule = moduleData.index === currentModuleIndex;

        if (isCurrentModule || isCompleted) {
          setAllowed(true);
        }

        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };

    checkAccess();
  }, [moduleId]);

  if (loading) {
    return <LoadingSpinner message="Checking module access..." />;
  }

  if (!allowed) {
    return (
      <Card className="border-red-300 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">Module Not Accessible</h3>
              <p className="text-red-800 mb-4">
                You must complete all previous modules in sequence before accessing this one.
              </p>
              <Button onClick={() => navigate(-1)} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}