import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChefHat, ExternalLink, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function LinkedMenuItemBadge({ visualGuideId }) {
  const queryClient = useQueryClient();

  // Check if linked to a menu item
  const { data: existingLink } = useQuery({
    queryKey: ['menuVisualLink', visualGuideId],
    queryFn: () => base44.entities.VisualMenuLink.filter({ visual_guide_id: visualGuideId }).then(r => r[0]),
    enabled: !!visualGuideId
  });

  // Get the linked menu item
  const { data: linkedMenuItem } = useQuery({
    queryKey: ['linkedMenuItem', existingLink?.menu_item_id],
    queryFn: () => base44.entities.MenuItem.filter({ id: existingLink.menu_item_id }).then(r => r[0]),
    enabled: !!existingLink?.menu_item_id
  });

  const unlinkMutation = useMutation({
    mutationFn: () => base44.entities.VisualMenuLink.delete(existingLink.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menuVisualLink']);
      queryClient.invalidateQueries(['visualMenuLink']);
    }
  });

  if (!existingLink) {
    return (
      <Badge variant="outline" className="text-slate-500">
        <ChefHat className="w-3 h-3 mr-1" />
        Not linked to menu
      </Badge>
    );
  }

  if (!linkedMenuItem) return null;

  return (
    <div className="flex items-center gap-2">
      <Link to={createPageUrl('MenuManager')} className="no-underline">
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer">
          <ChefHat className="w-3 h-3 mr-1" />
          Linked to: {linkedMenuItem.name}
          <ExternalLink className="w-3 h-3 ml-1" />
        </Badge>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-slate-400 hover:text-red-600"
        onClick={() => {
          if (confirm('Remove link to menu item?')) unlinkMutation.mutate();
        }}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}