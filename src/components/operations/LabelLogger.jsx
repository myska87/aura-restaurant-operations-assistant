import React from 'react';
import { base44 } from '@/api/base44Client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Automatically logs printed labels to LabelRegister and OperationReport
 * Called by LabelPrintingModal after successful print
 */
export async function logLabelPrint(labelData, user) {
  try {
    const labelId = uuidv4();
    const now = new Date();

    // Create LabelRegister entry
    const registerEntry = await base44.entities.LabelRegister.create({
      label_id: labelId,
      label_type: labelData.type || 'prep',
      item_name: labelData.itemName || labelData.item_name,
      batch_id: labelData.batchId || labelData.batch_id,
      prep_date_time: labelData.prepDateTime || labelData.prep_date_time || now.toISOString(),
      expiry_date_time: labelData.expiryDateTime || labelData.expiry_date_time,
      shelf_life_hours: labelData.shelfLifeHours || labelData.shelf_life_hours,
      allergens: labelData.allergens || [],
      storage_type: labelData.storageType || labelData.storage_type || 'ambient',
      printed_by_id: user?.id,
      printed_by_name: user?.full_name || user?.email,
      printed_by_email: user?.email,
      location_id: labelData.locationId || 'default',
      printed_at: now.toISOString(),
      printer_id: labelData.printerId,
      label_data: labelData
    });

    // Create OperationReport entry for traceability
    await base44.entities.OperationReport.create({
      reportId: labelId,
      reportType: 'LABEL',
      locationId: labelData.locationId || 'default',
      staffId: user?.id,
      staffName: user?.full_name || user?.email,
      staffEmail: user?.email,
      reportDate: new Date().toISOString().split('T')[0],
      completionPercentage: 100,
      status: 'completed',
      checklistItems: [
        {
          item_id: labelId,
          item_name: labelData.itemName || labelData.item_name,
          answer: labelData.type || 'label_printed'
        }
      ],
      sourceEntityId: registerEntry.id,
      sourceEntityType: 'LabelRegister',
      timestamp: now.toISOString()
    }).catch(() => {});

    return registerEntry;
  } catch (error) {
    console.error('Failed to log label:', error);
    throw new Error('Label cannot be printed without being recorded. Please try again.');
  }
}

export default function LabelLogger() {
  return null;
}