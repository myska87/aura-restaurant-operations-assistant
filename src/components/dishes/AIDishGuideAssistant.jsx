import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIDishGuideAssistant({ onGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional chef creating visual cooking guides for restaurant staff.

DISH: ${prompt}

Generate a detailed cooking guide with the following structure. Be precise and professional.

IMPORTANT: Do NOT include any fields for editing existing procedures. This is for NEW dish guide creation only.

Output MUST be valid JSON matching this schema:
{
  "dish_name": "string",
  "category": "wrap|curry|drink|bakery|chai|dessert|appetizer|main",
  "difficulty": "easy|medium|advanced",
  "estimated_cook_time_minutes": number,
  "portion_size": number,
  "ingredients_summary": [
    {"ingredient_name": "string", "quantity": "string"}
  ],
  "cooking_steps": [
    {
      "step_number": number,
      "step_title": "string (short, action-oriented)",
      "instruction_text": "string (1-2 lines max)",
      "duration_seconds": number
    }
  ],
  "quality_tips": [
    {
      "type": "quality_check|common_mistake|temperature|timing",
      "text": "string"
    }
  ]
}

Generate 4-8 cooking steps. Be specific and actionable. Include timing for each step.`,
        response_json_schema: {
          type: "object",
          properties: {
            dish_name: { type: "string" },
            category: { type: "string", enum: ["wrap", "curry", "drink", "bakery", "chai", "dessert", "appetizer", "main"] },
            difficulty: { type: "string", enum: ["easy", "medium", "advanced"] },
            estimated_cook_time_minutes: { type: "number" },
            portion_size: { type: "number" },
            ingredients_summary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ingredient_name: { type: "string" },
                  quantity: { type: "string" }
                }
              }
            },
            cooking_steps: {
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
            quality_tips: {
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

      const guideData = {
        ...response,
        version: "1.0",
        is_published: false
      };

      onGenerate(guideData);
      setPrompt('');
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate guide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5" />
          AI Dish Guide Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe the dish... e.g., 'Butter Chicken Wrap - grilled chicken in butter sauce with naan wrap'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Guide...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Cooking Guide
            </>
          )}
        </Button>
        <p className="text-xs text-slate-600 text-center">
          AI will generate cooking steps - you can edit before saving
        </p>
      </CardContent>
    </Card>
  );
}