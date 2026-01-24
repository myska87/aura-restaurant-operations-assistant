import { base44 } from '@/api/base44Client';

/**
 * Automatically logs CCP failures to IncidentRecord
 * Creates permanent legal audit trail for food safety incidents
 * Called when CCP check fails
 */
export async function logFoodSafetyIncident(ccp, check, user) {
  try {
    // Determine severity based on failure magnitude
    const recordedNum = parseFloat(check.recorded_value);
    const criticalNum = parseFloat(ccp.critical_limit);
    const variance = Math.abs(recordedNum - criticalNum);
    const percentVariance = (variance / criticalNum) * 100;

    let severity = 'minor';
    if (percentVariance > 20) severity = 'critical';
    else if (percentVariance > 10) severity = 'major';

    // Create incident record
    const incident = await base44.entities.IncidentRecord.create({
      ccp_check_id: check.id,
      ccp_id: ccp.id,
      ccp_name: ccp.name,
      failure_value: `${check.recorded_value}${check.unit === 'celsius' ? '°C' : check.unit === 'fahrenheit' ? '°F' : check.unit === 'visual' ? ' (visual)' : ''}`,
      critical_limit: ccp.critical_limit,
      unit: check.unit,
      incident_time: new Date().toISOString(),
      detected_by_id: user?.id,
      detected_by_name: user?.full_name || user?.email,
      detected_by_email: user?.email,
      corrective_action_type: 'pending',
      corrective_action_description: 'Awaiting corrective action',
      action_taken_by_id: user?.id,
      action_taken_by_email: user?.email,
      action_time: new Date().toISOString(),
      resolution_result: 'pending',
      blocked_menu_items: ccp.linked_menu_items || [],
      incident_severity: severity,
      is_legal_hold: true
    });

    // Notify managers
    try {
      const managers = await base44.entities.Staff.filter({
        role: 'manager',
        status: 'active'
      });

      managers?.forEach(manager => {
        base44.entities.Notification.create({
          recipient_email: manager.email,
          recipient_name: manager.full_name,
          title: '🚨 FOOD SAFETY INCIDENT LOGGED',
          message: `${ccp.name} failed: ${check.recorded_value} (limit: ${ccp.critical_limit}). Incident #${incident.id}`,
          type: 'critical',
          priority: 'critical',
          is_read: false
        }).catch(() => {});
      });
    } catch (notifError) {
      console.warn('Could not notify managers:', notifError);
    }

    return incident;
  } catch (error) {
    console.error('Failed to log incident:', error);
    throw error;
  }
}

/**
 * Add manager notes to incident (only managers can do this)
 */
export async function addIncidentNotes(incidentId, notes, user) {
  try {
    if (user?.role !== 'manager' && user?.role !== 'owner' && user?.role !== 'admin') {
      throw new Error('Only managers can add notes to incidents');
    }

    await base44.entities.IncidentRecord.update(incidentId, {
      manager_notes: notes,
      manager_notes_by_id: user?.id,
      manager_notes_by_email: user?.email,
      manager_notes_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to add notes:', error);
    throw error;
  }
}

/**
 * Update incident when corrective action is completed
 */
export async function updateIncidentResolution(incidentId, resolution, recheckPassResult, user) {
  try {
    const updateData = {
      resolution_result: resolution,
      recheck_passed: recheckPassResult,
      action_taken_by_id: user?.id,
      action_taken_by_name: user?.full_name || user?.email,
      action_taken_by_email: user?.email,
      action_time: new Date().toISOString()
    };

    await base44.entities.IncidentRecord.update(incidentId, updateData);
  } catch (error) {
    console.error('Failed to update incident:', error);
    throw error;
  }
}

export default function IncidentLogger() {
  return null;
}