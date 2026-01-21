import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function DishShareButton({ guideId, dishName }) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${createPageUrl('VisualDishGuideDetail')}?id=${guideId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dishName,
          text: `Check out this visual dish guide: ${dishName}`,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowShareDialog(true)}
      >
        <Share2 className="w-4 h-4" />
      </Button>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share "{dishName}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Share Link</label>
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className={copied ? 'bg-emerald-600' : ''}
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {copied && <p className="text-xs text-emerald-600 mt-1">Copied to clipboard!</p>}
            </div>

            {navigator.share && (
              <Button 
                onClick={handleShare}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share with Others
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}