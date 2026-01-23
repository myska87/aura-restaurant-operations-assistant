import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCw, Trash2, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from 'lucide-react';

export default function ImageControlPanel({ selectedImage, onRotate, onAlign, onDelete, onSizeChange }) {
  if (!selectedImage) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Image Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">Select an image in the document to edit</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          Image Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Rotate */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Rotate</Label>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onRotate(90)}
              className="flex-1"
            >
              <RotateCw className="w-3 h-3 mr-1" />
              90°
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onRotate(180)}
              className="flex-1"
            >
              <RotateCw className="w-3 h-3 mr-1" />
              180°
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onRotate(270)}
              className="flex-1"
            >
              <RotateCw className="w-3 h-3 mr-1" />
              270°
            </Button>
          </div>
        </div>

        {/* Align */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Alignment</Label>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onAlign('left')}
              className="flex-1"
            >
              <AlignLeft className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onAlign('center')}
              className="flex-1"
            >
              <AlignCenter className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onAlign('right')}
              className="flex-1"
            >
              <AlignRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Size */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Size</Label>
          <Select onValueChange={onSizeChange} defaultValue="100">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delete */}
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={onDelete}
          className="w-full"
        >
          <Trash2 className="w-3 h-3 mr-2" />
          Delete Image
        </Button>
      </CardContent>
    </Card>
  );
}