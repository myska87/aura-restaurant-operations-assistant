import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Calculator,
  Flame,
  Coffee,
  Salad,
  UtensilsCrossed,
  Croissant,
  AlertCircle,
  Circle,
  PlayCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

const STATIONS = [
  { 
    id: 'hot_line', 
    name: 'Hot Line', 
    icon: Flame, 
    color: 'bg-red-100 text-red-700 border-red-300',
    emoji: '🔥'
  },
  { 
    id: 'fryer', 
    name: 'Fryer', 
    icon: ChefHat, 
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    emoji: '🍟'
  },
  { 
    id: 'chai_station', 
    name: 'Chai Station', 
    icon: Coffee, 
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    emoji: '☕'
  },
  { 
    id: 'cold_prep', 
    name: 'Cold Prep', 
    icon: Salad, 
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    emoji: '🥗'
  },
  { 
    id: 'grill', 
    name: 'Grill', 
    icon: UtensilsCrossed, 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    emoji: '🔥'
  },
  { 
    id: 'bakery', 
    name: 'Bakery', 
    icon: Croissant, 
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    emoji: '🥐'
  }
];

const PORTION_PRESETS = [20, 50, 100, 150];

export default function PrepPlanner() {
  const [user, setUser] = useState(null);
  const [selectedPortions, setSelectedPortions] = useState(50);
  const [customPortions, setCustomPortions] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list('name'),
  });

  const { data: recipes = [], isLoading: loadingRecipes } = useQuery({
    queryKey: ['recipes_v2'],
    queryFn: () => base44.entities.Recipe_Engine_v2.list(),
  });

  // Auto-generate prep tasks from menu items and recipes
  const generatePrepTasks = () => {
    const portions = customPortions ? parseInt(customPortions) : selectedPortions;
    if (!portions || portions <= 0) return;

    const tasks = [];

    // Get active menu items with recipes
    const activeItems = menuItems.filter(item => item.is_active);

    activeItems.forEach(menuItem => {
      const recipe = recipes.find(r => r.menu_item_id === menuItem.id);
      if (!recipe) return;

      // Determine station from menu item or recipe
      const station = menuItem.preparation_location || 'hot_line';

      // Create prep task for this dish
      tasks.push({
        id: `task-${menuItem.id}-${Date.now()}`,
        menu_item_id: menuItem.id,
        menu_item_name: menuItem.name,
        recipe_id: recipe.id,
        station: station,
        portions_needed: portions,
        prep_components: recipe.preparation_method || [],
        ingredients: recipe.ingredients_per_serving?.map(ing => ({
          ...ing,
          total_qty: ing.quantity * portions
        })) || [],
        priority: menuItem.category?.includes('breakfast') ? 'critical' : 'standard',
        estimated_time: recipe.preparation_method?.length * 5 || 15,
        status: 'not_started',
        assigned_to: null,
        completed_by: null
      });
    });

    setGeneratedTasks(tasks);
    
    // Initialize all statuses as 'not_started'
    const initialStatuses = {};
    tasks.forEach(task => {
      initialStatuses[task.id] = 'not_started';
    });
    setTaskStatuses(initialStatuses);
  };

  // Group tasks by station
  const tasksByStation = STATIONS.map(station => {
    const stationTasks = generatedTasks.filter(t => t.station === station.id);
    const completed = stationTasks.filter(t => taskStatuses[t.id] === 'completed').length;
    const inProgress = stationTasks.filter(t => taskStatuses[t.id] === 'in_progress').length;
    const notStarted = stationTasks.filter(t => taskStatuses[t.id] === 'not_started').length;

    return {
      ...station,
      tasks: stationTasks,
      completed,
      inProgress,
      notStarted,
      total: stationTasks.length,
      progress: stationTasks.length > 0 ? (completed / stationTasks.length) * 100 : 0
    };
  });

  const handleStatusChange = (taskId, newStatus) => {
    setTaskStatuses(prev => ({
      ...prev,
      [taskId]: newStatus
    }));
  };

  const overallProgress = generatedTasks.length > 0
    ? (Object.values(taskStatuses).filter(s => s === 'completed').length / generatedTasks.length) * 100
    : 0;

  const portions = customPortions ? parseInt(customPortions) : selectedPortions;

  if (loadingMenu || loadingRecipes) return <LoadingSpinner message="Loading prep data..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Prep Planner"
        description="Dish-driven preparation planning by station"
      />

      {/* Portion Calculator */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Plan Prep by Portions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-3">Select target portions to auto-generate prep tasks</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PORTION_PRESETS.map(num => (
                <Button
                  key={num}
                  variant={selectedPortions === num && !customPortions ? 'default' : 'outline'}
                  onClick={() => { setSelectedPortions(num); setCustomPortions(''); }}
                  className={selectedPortions === num && !customPortions ? 'bg-emerald-600' : ''}
                >
                  {num} portions
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom portions..."
                value={customPortions}
                onChange={(e) => setCustomPortions(e.target.value)}
                min="1"
                className="flex-1"
              />
              <Button 
                onClick={generatePrepTasks}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!portions || portions <= 0}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Generate Prep Tasks
              </Button>
            </div>
          </div>

          {portions > 0 && generatedTasks.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-emerald-300">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{portions}</p>
                  <p className="text-xs text-slate-600">Portions Planned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{generatedTasks.length}</p>
                  <p className="text-xs text-slate-600">Prep Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {Object.values(taskStatuses).filter(s => s === 'completed').length}
                  </p>
                  <p className="text-xs text-slate-600">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{overallProgress.toFixed(0)}%</p>
                  <p className="text-xs text-slate-600">Progress</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calculator className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Prep Tasks Generated</h3>
            <p className="text-slate-500 mb-6">Select portions above and click "Generate Prep Tasks"</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Progress */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Overall Progress</h3>
                  <p className="text-sm text-slate-600">
                    {Object.values(taskStatuses).filter(s => s === 'completed').length} of {generatedTasks.length} tasks completed
                  </p>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {overallProgress.toFixed(0)}%
                </div>
              </div>
              <Progress value={overallProgress} className="h-3 bg-blue-200" />
            </CardContent>
          </Card>

          {/* Station Dashboards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasksByStation.map(station => (
              <Card key={station.id} className={`border-2 ${station.color} hover:shadow-xl transition-all`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{station.emoji}</span>
                      <span className="text-base">{station.name}</span>
                    </div>
                    <Badge className={station.color}>
                      {station.completed}/{station.total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={station.progress} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-white rounded">
                      <Circle className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                      <p className="font-bold">{station.notStarted}</p>
                      <p className="text-slate-500">Not Started</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <PlayCircle className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                      <p className="font-bold">{station.inProgress}</p>
                      <p className="text-slate-500">In Progress</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <CheckCircle className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                      <p className="font-bold">{station.completed}</p>
                      <p className="text-slate-500">Done</p>
                    </div>
                  </div>

                  {/* Critical tasks warning */}
                  {station.tasks.some(t => t.priority === 'critical' && taskStatuses[t.id] !== 'completed') && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Critical prep required</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tasks by Station */}
          <div className="space-y-6">
            {tasksByStation.filter(s => s.tasks.length > 0).map(station => (
              <div key={station.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${station.color} flex items-center justify-center text-2xl`}>
                    {station.emoji}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{station.name}</h3>
                    <p className="text-sm text-slate-500">
                      {station.completed} of {station.total} tasks completed
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {station.tasks.map((task, idx) => {
                      const status = taskStatuses[task.id] || 'not_started';
                      const isPriority = task.priority === 'critical';

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className={`
                            ${status === 'completed' ? 'bg-emerald-50 border-emerald-300' : ''}
                            ${status === 'in_progress' ? 'bg-blue-50 border-blue-300' : ''}
                            ${isPriority && status !== 'completed' ? 'border-red-300 border-2' : ''}
                          `}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {isPriority && (
                                      <Badge className="bg-red-600 text-white">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Critical
                                      </Badge>
                                    )}
                                    {status === 'completed' && (
                                      <Badge className="bg-emerald-600 text-white">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Completed
                                      </Badge>
                                    )}
                                    {status === 'in_progress' && (
                                      <Badge className="bg-blue-600 text-white">
                                        <PlayCircle className="w-3 h-3 mr-1" />
                                        In Progress
                                      </Badge>
                                    )}
                                    <Badge variant="outline">
                                      <Clock className="w-3 h-3 mr-1" />
                                      ~{task.estimated_time}min
                                    </Badge>
                                  </div>

                                  <h4 className="font-bold text-lg text-slate-800 mb-2">
                                    {task.menu_item_name}
                                  </h4>

                                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                    <div>
                                      <span className="text-slate-500">Portions:</span>
                                      <span className="font-bold ml-2 text-emerald-700">{task.portions_needed}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Ingredients:</span>
                                      <span className="font-bold ml-2">{task.ingredients.length}</span>
                                    </div>
                                  </div>

                                  {/* Prep steps preview */}
                                  {task.prep_components.length > 0 && (
                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                      <p className="text-xs font-semibold text-slate-600 mb-2">
                                        Prep Steps ({task.prep_components.length})
                                      </p>
                                      <ul className="text-xs text-slate-700 space-y-1">
                                        {task.prep_components.slice(0, 3).map((step, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">{i + 1}.</span>
                                            <span className="line-clamp-1">{step}</span>
                                          </li>
                                        ))}
                                        {task.prep_components.length > 3 && (
                                          <li className="text-slate-400">+{task.prep_components.length - 3} more steps</li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                  {status === 'not_started' && (
                                    <Button
                                      size="lg"
                                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                                      className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                                    >
                                      <PlayCircle className="w-5 h-5 mr-2" />
                                      Start
                                    </Button>
                                  )}
                                  {status === 'in_progress' && (
                                    <Button
                                      size="lg"
                                      onClick={() => handleStatusChange(task.id, 'completed')}
                                      className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
                                    >
                                      <CheckCircle className="w-5 h-5 mr-2" />
                                      Complete
                                    </Button>
                                  )}
                                  {status === 'completed' && (
                                    <Button
                                      size="lg"
                                      variant="outline"
                                      onClick={() => handleStatusChange(task.id, 'not_started')}
                                      className="min-w-[120px]"
                                    >
                                      Reset
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}