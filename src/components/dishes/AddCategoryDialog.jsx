import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AddCategoryDialog({ categories, onCategoryAdded }) {
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = () => {
    if (newCategory.trim() && !categories.includes(newCategory.toLowerCase())) {
      onCategoryAdded(newCategory.toLowerCase());
      setNewCategory('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Add new category">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-2">Category name:</p>
            <Input
              placeholder="e.g., sauces"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!newCategory.trim()}
            >
              Add Category
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}