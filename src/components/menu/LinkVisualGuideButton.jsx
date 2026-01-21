import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, Link as LinkIcon, ExternalLink, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createPageUrl } from '@/utils';

export default function LinkVisualGuideButton({ menuItem }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Check if already linked
  const { data: existingLink } = useQuery({
    queryKey: ['visualMenuLink', menuItem?.id],
    queryFn: () => base44.entities.VisualMenuLink.filter({ menu_item_id: menuItem?.id }).then(r => r[0]),
    enabled: !!menuItem?.id
  });

  // Get the linked guide if it exists
  const { data: linkedGuide } = useQuery({
    queryKey: ['linkedVisualGuide', existingLink?.visual_guide_id],
    queryFn: () => base44.entities.Visual_Dish_Guides_v1.filter({ id: existingLink.visual_guide_id }).then(r => r[0]),
    enabled: !!existingLink?.visual_guide_id
  });

  // Get all available guides for linking
  const { data: availableGuides = [] } = useQuery({
    queryKey: ['availableVisualGuides'],
    queryFn: () => base44.entities.Visual_Dish_Guides_v1.filter({ is_published: true }),
    enabled: open && !existingLink
  });

  const linkMutation = useMutation({
    mutationFn: async (guideId) => {
      const user = await base44.auth.me();
      const guide = availableGuides.find(g => g.id === guideId);
      return base44.entities.VisualMenuLink.create({
        menu_item_id: menuItem.id,
        visual_guide_id: guideId,
        menu_item_name: menuItem.name,
        visual_guide_name: guide.dish_name,
        linked_by_id: user.email,
        linked_by_name: user.full_name || user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['visualMenuLink']);
      queryClient.invalidateQueries(['menuVisualLink']);
      setOpen(false);
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: () => base44.entities.VisualMenuLink.delete(existingLink.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['visualMenuLink']);
      queryClient.invalidateQueries(['menuVisualLink']);
    }
  });

  // Auto-suggest matching guides
  const suggestedGuides = availableGuides.filter(guide => {
    const nameSimilarity = guide.dish_name?.toLowerCase().includes(menuItem.name?.toLowerCase()) ||
                           menuItem.name?.toLowerCase().includes(guide.dish_name?.toLowerCase());
    return nameSimilarity;
  });

  const filteredGuides = availableGuides.filter(guide =>
    guide.dish_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openGuide = (e) => {
    e.stopPropagation();
    window.open(createPageUrl('VisualDishGuideDetail') + '?id=' + linkedGuide.id, '_blank');
  };

  // If already linked, show view button
  if (existingLink && linkedGuide) {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          onClick={openGuide}
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          <Video className="w-4 h-4 mr-2" />
          View Preparation Guide
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Remove link to Visual Guide?')) unlinkMutation.mutate();
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // If not linked, show link button
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-slate-600 hover:text-orange-600 hover:border-orange-300"
      >
        <LinkIcon className="w-4 h-4 mr-2" />
        Link Visual Guide
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Link Visual Preparation Guide</DialogTitle>
            <p className="text-sm text-slate-600">Connect "{menuItem?.name}" to a visual cooking guide</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search guides..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Auto-suggested matches */}
            {suggestedGuides.length > 0 && !search && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-700 mb-2">✨ Suggested Matches</h4>
                <div className="space-y-2">
                  {suggestedGuides.map(guide => (
                    <div
                      key={guide.id}
                      onClick={() => linkMutation.mutate(guide.id)}
                      className="flex items-center justify-between p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {guide.hero_image_url && (
                          <img src={guide.hero_image_url} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{guide.dish_name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                            <Badge variant="outline" className="text-xs">{guide.difficulty}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="bg-emerald-600">
                        Link
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All guides */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">All Visual Guides</h4>
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {filteredGuides.map(guide => (
                    <div
                      key={guide.id}
                      onClick={() => linkMutation.mutate(guide.id)}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {guide.hero_image_url && (
                          <img src={guide.hero_image_url} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{guide.dish_name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                            <Badge variant="outline" className="text-xs">{guide.difficulty}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Link
                      </Button>
                    </div>
                  ))}
                  {filteredGuides.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No guides found</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}