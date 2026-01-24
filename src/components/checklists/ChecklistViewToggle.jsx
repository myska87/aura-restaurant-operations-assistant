import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutList, LayoutGrid } from 'lucide-react';

export default function ChecklistViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-2 border rounded-lg p-1 bg-slate-50">
      <Button
        size="sm"
        variant={view === 'list' ? 'default' : 'ghost'}
        onClick={() => onChange('list')}
        className="flex items-center gap-2"
      >
        <LayoutList className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        size="sm"
        variant={view === 'tile' ? 'default' : 'ghost'}
        onClick={() => onChange('tile')}
        className="flex items-center gap-2"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Tile</span>
      </Button>
    </div>
  );
}