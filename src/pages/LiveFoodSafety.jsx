import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LiveFoodSafetyDashboard from '@/components/operations/LiveFoodSafetyDashboard';

export default function LiveFoodSafety() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  return (
    <div className="w-full">
      {user && <LiveFoodSafetyDashboard user={user} autoRefreshInterval={30000} />}
    </div>
  );
}