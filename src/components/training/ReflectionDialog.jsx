import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { values } from './ValuesSection';

export default function ReflectionDialog({ 
  course, 
  user,
  open, 
  onClose, 
  onSubmit 
}) {
  const [reflection, setReflection] = useState({
    what_learned: '',
    connected_value: '',
    connected_value_why: '',
    proud_moment: '',
    concerns: '',
    suggestions: '',
    feedback_visibility: 'public'
  });

  const handleSubmit = () => {
    onSubmit(reflection);
    setReflection({
      what_learned: '',
      connected_value: '',
      connected_value_why: '',
      proud_moment: '',
      concerns: '',
      suggestions: '',
      feedback_visibility: 'public'
    });
  };

  const isComplete = reflection.what_learned.trim() && 
                     reflection.connected_value && 
                     reflection.proud_moment.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle>Learning Reflection</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">Help us understand your experience</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Safe Space Message */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-900 font-medium mb-1">
                📝 Your feedback helps us grow
              </p>
              <p className="text-xs text-blue-700">
                Honesty is valued here. Your reflections shape how we train and improve. Be open, be respectful, be you.
              </p>
            </CardContent>
          </Card>

          {/* Question 1 */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              1. What did you learn from this training? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reflection.what_learned}
              onChange={(e) => setReflection({...reflection, what_learned: e.target.value})}
              placeholder="Share the key lessons or insights you gained..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Question 2 */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              2. Which Chai Patta value do you connect with most? <span className="text-red-500">*</span>
            </label>
            <Select 
              value={reflection.connected_value} 
              onValueChange={(v) => setReflection({...reflection, connected_value: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a value..." />
              </SelectTrigger>
              <SelectContent>
                {values.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reflection.connected_value && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <Textarea
                  value={reflection.connected_value_why}
                  onChange={(e) => setReflection({...reflection, connected_value_why: e.target.value})}
                  placeholder="Why does this value resonate with you?"
                  rows={2}
                  className="resize-none"
                />
              </motion.div>
            )}
          </div>

          {/* Question 3 */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              3. What made you feel proud or happy during this training? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reflection.proud_moment}
              onChange={(e) => setReflection({...reflection, proud_moment: e.target.value})}
              placeholder="Celebrate your wins - big or small..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Question 4 */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              4. What did you not like or did not fully agree with?
            </label>
            <p className="text-xs text-slate-500 mb-2">This helps us improve. Be honest - no negative consequences.</p>
            <Textarea
              value={reflection.concerns}
              onChange={(e) => setReflection({...reflection, concerns: e.target.value})}
              placeholder="Share your concerns openly and respectfully..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Question 5 */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              5. What would you improve or change?
            </label>
            <Textarea
              value={reflection.suggestions}
              onChange={(e) => setReflection({...reflection, suggestions: e.target.value})}
              placeholder="Your suggestions matter - help us make this better..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Visibility */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <label className="text-sm font-semibold text-slate-800 mb-2 block">
                Feedback Visibility
              </label>
              <Select 
                value={reflection.feedback_visibility} 
                onValueChange={(v) => setReflection({...reflection, feedback_visibility: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Manager can see</SelectItem>
                  <SelectItem value="private">Private - HR/Admin only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-700 mt-2">
                {reflection.feedback_visibility === 'public' 
                  ? 'Your manager will see this feedback and may respond.' 
                  : 'Only HR and admin will see this. Your manager will not.'}
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isComplete}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Reflection
            </Button>
          </div>

          {!isComplete && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Please complete all required fields (marked with *)
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}