import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Link2, FileText, ChefHat, Utensils, ClipboardCheck, GraduationCap, Search } from 'lucide-react';

export default function SmartLinkSelector({ open, onClose, onLinkSelect }) {
  const [activeTab, setActiveTab] = useState('sop');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sops = [] } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list(),
    enabled: open && activeTab === 'sop'
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: open && activeTab === 'menu'
  });

  const { data: prepComponents = [] } = useQuery({
    queryKey: ['prepComponents'],
    queryFn: () => base44.entities.Prep_Components_v1.list(),
    enabled: open && activeTab === 'prep'
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    enabled: open && activeTab === 'task'
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => base44.entities.TrainingCourse.list(),
    enabled: open && activeTab === 'training'
  });

  const handleSelect = (type, item) => {
    onLinkSelect(type, item);
    onClose();
  };

  const filterItems = (items, nameKey = 'title') => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item[nameKey]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderList = (items, type, nameKey = 'title') => {
    const filtered = filterItems(items, nameKey);
    
    return filtered.length === 0 ? (
      <p className="text-center text-slate-500 py-8">No items found</p>
    ) : (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.map(item => (
          <div
            key={item.id}
            onClick={() => handleSelect(type, item)}
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition-all"
          >
            <p className="font-medium text-slate-800">{item[nameKey]}</p>
            {item.category && (
              <Badge variant="outline" className="mt-1 text-xs">{item.category}</Badge>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link to Entity
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="sop" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              SOPs
            </TabsTrigger>
            <TabsTrigger value="menu" className="text-xs">
              <ChefHat className="w-3 h-3 mr-1" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="prep" className="text-xs">
              <Utensils className="w-3 h-3 mr-1" />
              Prep
            </TabsTrigger>
            <TabsTrigger value="task" className="text-xs">
              <ClipboardCheck className="w-3 h-3 mr-1" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="training" className="text-xs">
              <GraduationCap className="w-3 h-3 mr-1" />
              Training
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="sop" className="mt-0 h-full overflow-y-auto">
              {renderList(sops, 'sop')}
            </TabsContent>
            <TabsContent value="menu" className="mt-0 h-full overflow-y-auto">
              {renderList(menuItems, 'menu', 'name')}
            </TabsContent>
            <TabsContent value="prep" className="mt-0 h-full overflow-y-auto">
              {renderList(prepComponents, 'prep', 'component_name')}
            </TabsContent>
            <TabsContent value="task" className="mt-0 h-full overflow-y-auto">
              {renderList(tasks, 'task')}
            </TabsContent>
            <TabsContent value="training" className="mt-0 h-full overflow-y-auto">
              {renderList(trainings, 'training', 'course_name')}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}