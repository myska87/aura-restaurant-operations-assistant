import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AIDishGuideAssistant from '@/components/dishes/AIDishGuideAssistant';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VisualDishGuideForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const guideId = urlParams.get('id');
  const isEditing = !!guideId;

  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    dish_name: '',
    menu_item_id: '',
    recipe_id: '',
    category: 'main',
    difficulty: 'easy',
    estimated_cook_time_minutes: 0,
    portion_size: 1,
    hero_image_url: '',
    ingredients_summary: [],
    cooking_steps: [],
    quality_tips: [],
    plating_photo_url: '',
    version: '1.0',
    is_published: false
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: existingGuide, isLoading } = useQuery({
    queryKey: ['visualDishGuide', guideId],
    queryFn: () => base44.entities.Visual_Dish_Guides_v1.filter({ id: guideId }).then(g => g[0]),
    enabled: isEditing
  });

  useEffect(() => {
    if (existingGuide) {
      setFormData({
        ...existingGuide,
        ingredients_summary: existingGuide.ingredients_summary || [],
        cooking_steps: existingGuide.cooking_steps || [],
        quality_tips: existingGuide.quality_tips || []
      });
    }
  }, [existingGuide]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const saveData = {
        ...data,
        last_updated_by_id: user?.email,
        last_updated_by_name: user?.full_name || user?.email
      };

      console.log('Mutation - saving data:', saveData);

      let result;
      if (isEditing) {
        result = await base44.entities.Visual_Dish_Guides_v1.update(guideId, saveData);
        console.log('Update result:', result);
      } else {
        result = await base44.entities.Visual_Dish_Guides_v1.create(saveData);
        console.log('Create result:', result);
      }
      
      return result;
    },
    onSuccess: (result) => {
      console.log('Save successful, result:', result);
      queryClient.invalidateQueries(['visualDishGuides']);
      const guideIdToUse = result.id || guideId;
      alert(`✅ Visual Dish Guide ${isEditing ? 'Updated' : 'Published'} Successfully!`);
      navigate(createPageUrl('VisualDishGuides'));
    },
    onError: (error) => {
      console.error('Save failed:', error);
      alert(`❌ Failed to save guide: ${error.message}`);
    }
  });

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleStepPhotoUpload = async (e, stepIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newSteps = [...formData.cooking_steps];
      newSteps[stepIndex].photo_url = file_url;
      setFormData(prev => ({ ...prev, cooking_steps: newSteps }));
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients_summary: [...prev.ingredients_summary, { ingredient_name: '', quantity: '', icon_url: '' }]
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients_summary: prev.ingredients_summary.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    const newStepNumber = formData.cooking_steps.length + 1;
    setFormData(prev => ({
      ...prev,
      cooking_steps: [...prev.cooking_steps, {
        step_number: newStepNumber,
        step_title: '',
        instruction_text: '',
        photo_url: '',
        video_url: '',
        duration_seconds: 0
      }]
    }));
  };

  const removeStep = (index) => {
    const newSteps = formData.cooking_steps.filter((_, i) => i !== index);
    const renumbered = newSteps.map((step, i) => ({ ...step, step_number: i + 1 }));
    setFormData(prev => ({ ...prev, cooking_steps: renumbered }));
  };

  const addTip = () => {
    setFormData(prev => ({
      ...prev,
      quality_tips: [...prev.quality_tips, { type: 'quality_check', text: '' }]
    }));
  };

  const removeTip = (index) => {
    setFormData(prev => ({
      ...prev,
      quality_tips: prev.quality_tips.filter((_, i) => i !== index)
    }));
  };

  const handleAIGenerate = (aiData) => {
    setFormData(prev => ({
      ...prev,
      ...aiData
    }));
  };

  const handleSave = (publishStatus) => {
    if (!formData.dish_name || formData.cooking_steps.length === 0) {
      alert('Please provide dish name and at least one cooking step');
      return;
    }
    
    const dataToSave = {
      ...formData,
      is_published: publishStatus
    };
    
    console.log('Saving Visual Dish Guide:', dataToSave);
    saveMutation.mutate(dataToSave);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('VisualDishGuides')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {isEditing ? 'Edit' : 'Create'} Dish Guide
            </h1>
            <p className="text-slate-600">Visual cooking guide with photos and videos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-orange-600 to-red-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Publishing...' : (isEditing ? 'Update & Publish' : 'Create & Publish')}
          </Button>
        </div>
      </div>

      {/* AI Assistant */}
      {!isEditing && <AIDishGuideAssistant onGenerate={handleAIGenerate} />}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Dish Name *</Label>
              <Input
                value={formData.dish_name}
                onChange={(e) => setFormData(prev => ({ ...prev, dish_name: e.target.value }))}
                placeholder="e.g., Butter Chicken Wrap"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wrap">Wrap</SelectItem>
                  <SelectItem value="curry">Curry</SelectItem>
                  <SelectItem value="drink">Drink</SelectItem>
                  <SelectItem value="bakery">Bakery</SelectItem>
                  <SelectItem value="chai">Chai</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="appetizer">Appetizer</SelectItem>
                  <SelectItem value="main">Main</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cook Time (minutes)</Label>
              <Input
                type="number"
                value={formData.estimated_cook_time_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cook_time_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Portion Size</Label>
              <Input
                type="number"
                value={formData.portion_size}
                onChange={(e) => setFormData(prev => ({ ...prev, portion_size: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div>
            <Label>Hero Image</Label>
            <div className="flex gap-2">
              <Input
                value={formData.hero_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_image_url: e.target.value }))}
                placeholder="Image URL"
              />
              <Button variant="outline" disabled={uploading} onClick={() => document.getElementById('hero-upload').click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <input
                id="hero-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'hero_image_url')}
              />
            </div>
            {formData.hero_image_url && (
              <img src={formData.hero_image_url} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Ingredients Summary
            <Button onClick={addIngredient} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredient
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.ingredients_summary.map((ing, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Input
                placeholder="Ingredient name"
                value={ing.ingredient_name}
                onChange={(e) => {
                  const newIngs = [...formData.ingredients_summary];
                  newIngs[index].ingredient_name = e.target.value;
                  setFormData(prev => ({ ...prev, ingredients_summary: newIngs }));
                }}
                className="flex-1"
              />
              <Input
                placeholder="Quantity"
                value={ing.quantity}
                onChange={(e) => {
                  const newIngs = [...formData.ingredients_summary];
                  newIngs[index].quantity = e.target.value;
                  setFormData(prev => ({ ...prev, ingredients_summary: newIngs }));
                }}
                className="w-32"
              />
              <Button variant="destructive" size="icon" onClick={() => removeIngredient(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cooking Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Cooking Steps *
            <Button onClick={addStep} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.cooking_steps.map((step, index) => (
            <Card key={index} className="border-2 border-orange-200">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-orange-900">Step {step.step_number}</h4>
                  <Button variant="destructive" size="sm" onClick={() => removeStep(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Step Title</Label>
                    <Input
                      value={step.step_title}
                      onChange={(e) => {
                        const newSteps = [...formData.cooking_steps];
                        newSteps[index].step_title = e.target.value;
                        setFormData(prev => ({ ...prev, cooking_steps: newSteps }));
                      }}
                      placeholder="e.g., Heat the pan"
                    />
                  </div>
                  <div>
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={step.duration_seconds}
                      onChange={(e) => {
                        const newSteps = [...formData.cooking_steps];
                        newSteps[index].duration_seconds = parseInt(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, cooking_steps: newSteps }));
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Instructions (1-2 lines)</Label>
                  <Textarea
                    value={step.instruction_text}
                    onChange={(e) => {
                      const newSteps = [...formData.cooking_steps];
                      newSteps[index].instruction_text = e.target.value;
                      setFormData(prev => ({ ...prev, cooking_steps: newSteps }));
                    }}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Photo</Label>
                  <div className="flex gap-2">
                    <Input
                      value={step.photo_url}
                      onChange={(e) => {
                        const newSteps = [...formData.cooking_steps];
                        newSteps[index].photo_url = e.target.value;
                        setFormData(prev => ({ ...prev, cooking_steps: newSteps }));
                      }}
                      placeholder="Photo URL"
                    />
                    <Button variant="outline" disabled={uploading} onClick={() => document.getElementById(`step-photo-${index}`).click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <input
                      id={`step-photo-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleStepPhotoUpload(e, index)}
                    />
                  </div>
                  {step.photo_url && (
                    <img src={step.photo_url} alt="Step preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                  )}
                </div>
                <div>
                  <Label>Video URL (optional - YouTube, Instagram, or MP4)</Label>
                  <Input
                    value={step.video_url}
                    onChange={(e) => {
                      const newSteps = [...formData.cooking_steps];
                      newSteps[index].video_url = e.target.value;
                      setFormData(prev => ({ ...prev, cooking_steps: newSteps }));
                    }}
                    placeholder="https://youtube.com/... or https://instagram.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Quality Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Quality Tips & Notes
            <Button onClick={addTip} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Tip
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.quality_tips.map((tip, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Select 
                value={tip.type} 
                onValueChange={(value) => {
                  const newTips = [...formData.quality_tips];
                  newTips[index].type = value;
                  setFormData(prev => ({ ...prev, quality_tips: newTips }));
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality_check">Quality Check</SelectItem>
                  <SelectItem value="common_mistake">Common Mistake</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="timing">Timing</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Tip text"
                value={tip.text}
                onChange={(e) => {
                  const newTips = [...formData.quality_tips];
                  newTips[index].text = e.target.value;
                  setFormData(prev => ({ ...prev, quality_tips: newTips }));
                }}
                className="flex-1"
              />
              <Button variant="destructive" size="icon" onClick={() => removeTip(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Plating Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Final Plating Photo (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={formData.plating_photo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, plating_photo_url: e.target.value }))}
              placeholder="Plating photo URL"
            />
            <Button variant="outline" disabled={uploading} onClick={() => document.getElementById('plating-upload').click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <input
              id="plating-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, 'plating_photo_url')}
            />
          </div>
          {formData.plating_photo_url && (
            <img src={formData.plating_photo_url} alt="Plating preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}