import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIProcedureAssistant({ onProcedureGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed visual procedure for: "${prompt}"
        
Generate a JSON object with this exact structure:
{
  "title": "Clear procedure title",
  "category": "food_prep/hygiene/equipment/safety/waste/opening/closing",
  "estimated_time_minutes": number,
  "station": "hot_line/grill/chai_station/fryer/bakery/cold_prep/wash_area/store_room/general",
  "intro_description": "Why this procedure matters and what it achieves",
  "steps": [
    {
      "step_number": 1,
      "step_title": "Short title",
      "instruction_text": "Clear 1-2 line instruction",
      "duration_seconds": number
    }
  ],
  "tips_warnings": [
    {
      "type": "hygiene/safety/quality/common_mistake",
      "text": "Important tip or warning"
    }
  ]
}

Make it practical, specific, and ready to use in a professional kitchen.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            category: { type: "string" },
            estimated_time_minutes: { type: "number" },
            station: { type: "string" },
            intro_description: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step_number: { type: "number" },
                  step_title: { type: "string" },
                  instruction_text: { type: "string" },
                  duration_seconds: { type: "number" }
                }
              }
            },
            tips_warnings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  text: { type: "string" }
                }
              }
            }
          }
        }
      });

      onProcedureGenerated({
        ...result,
        applicable_roles: ['all_staff'],
        version: '1.0',
        is_published: false,
        cover_image_url: '',
        ingredients_tools: []
      });

      setPrompt('');
    } catch (error) {
      console.error('Failed to generate procedure:', error);
      alert('Failed to generate procedure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Sparkles className="w-5 h-5" />
          AI Procedure Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the procedure you need... e.g., 'How to clean the fryer at end of day' or 'Proper way to store cooked chicken'"
          rows={3}
          disabled={loading}
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Procedure with AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}