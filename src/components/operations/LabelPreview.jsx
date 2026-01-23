import React from 'react';
import { format, addDays, addHours } from 'date-fns';
import { QrCode } from 'lucide-react';

export default function LabelPreview({ formData, logo }) {
  const calculateExpiry = () => {
    if (!formData.shelfLife) return null;
    const [value, unit] = formData.shelfLife.split(' ');
    const printedDate = new Date();
    if (unit === 'hours') {
      return addHours(printedDate, parseInt(value));
    } else {
      return addDays(printedDate, parseInt(value));
    }
  };

  const expiryDate = calculateExpiry();

  return (
    <div className="mt-6 p-6 bg-white border-2 border-slate-300 rounded-lg">
      <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-widest">
        📋 Label Preview (57mm x 32mm thermal)
      </p>

      {/* Thermal Label Preview */}
      <div className="bg-white border-2 border-slate-900 p-3 rounded text-center text-xs space-y-1" style={{ width: '150px', margin: '0 auto' }}>
        {logo && <img src={logo} alt="Logo" className="h-6 mx-auto mb-1" />}

        <p className="font-bold text-sm text-slate-900">{formData.dishName || 'Dish Name'}</p>
        
        <div className="border-t border-slate-400 my-1 pt-1">
          <p className="text-[10px]">Prepared by</p>
          <p className="font-semibold text-xs">{formData.preparedBy || 'Name'}</p>
        </div>

        <p className="text-[10px]">
          📅 {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </p>

        {expiryDate && (
          <div className="bg-amber-100 border border-amber-400 rounded p-0.5">
            <p className="font-bold text-[9px] text-amber-900">
              ⏰ USE BY
            </p>
            <p className="font-bold text-xs text-amber-900">
              {format(expiryDate, 'dd/MM HH:mm')}
            </p>
          </div>
        )}

        {formData.batchCode && (
          <p className="text-[9px] text-slate-600">Batch: {formData.batchCode}</p>
        )}

        <div className="border-t border-slate-400 mt-1 pt-1 flex justify-center">
          <QrCode className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-3">
        ✓ Ready to print on thermal printer
      </p>
    </div>
  );
}