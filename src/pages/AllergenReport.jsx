import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Shield,
  Download,
  FileText,
  Printer,
  Search,
  Filter,
  Lock,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// UK FSA Standard 14 Allergens
const UK_ALLERGENS = [
  { id: 'celery', name: 'Celery', icon: '🌿', description: 'Includes celery stalks, leaves, seeds and celeriac' },
  { id: 'gluten', name: 'Cereals (Gluten)', icon: '🌾', description: 'Wheat, rye, barley, oats, spelt, kamut' },
  { id: 'crustaceans', name: 'Crustaceans', icon: '🦐', description: 'Prawns, crabs, lobster, crayfish' },
  { id: 'eggs', name: 'Eggs', icon: '🥚', description: 'All egg products' },
  { id: 'fish', name: 'Fish', icon: '🐟', description: 'All fish and fish products' },
  { id: 'lupin', name: 'Lupin', icon: '🫘', description: 'Lupin seeds and flour' },
  { id: 'milk', name: 'Milk', icon: '🥛', description: 'All dairy products including lactose' },
  { id: 'molluscs', name: 'Molluscs', icon: '🐚', description: 'Mussels, oysters, snails, squid' },
  { id: 'mustard', name: 'Mustard', icon: '🌭', description: 'Mustard seeds, powder and products' },
  { id: 'nuts', name: 'Tree Nuts', icon: '🌰', description: 'Almonds, hazelnuts, walnuts, cashews, pecans, pistachios, macadamia' },
  { id: 'peanuts', name: 'Peanuts', icon: '🥜', description: 'Peanuts and peanut products' },
  { id: 'sesame', name: 'Sesame', icon: '🍪', description: 'Sesame seeds and products' },
  { id: 'soya', name: 'Soya', icon: '🫛', description: 'Soybeans and soy products' },
  { id: 'sulphites', name: 'Sulphites', icon: '🍷', description: 'Sulphur dioxide concentrations above 10mg/kg' }
];

export default function AllergenReport() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAllergen, setFilterAllergen] = useState('all');
  const [showDietary, setShowDietary] = useState(true);
  const [version, setVersion] = useState('1.0');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list('name')
  });

  const canEdit = ['manager', 'owner', 'admin'].includes(user?.role);

  // Map menu item allergens to UK FSA format
  const mapAllergenToUK = (allergen) => {
    const mapping = {
      'dairy': 'milk',
      'gluten': 'gluten',
      'eggs': 'eggs',
      'egg': 'eggs',
      'nuts': 'nuts',
      'peanuts': 'peanuts',
      'soy': 'soya',
      'soya': 'soya',
      'fish': 'fish',
      'shellfish': 'crustaceans',
      'crustaceans': 'crustaceans',
      'sesame': 'sesame',
      'mustard': 'mustard',
      'celery': 'celery',
      'lupin': 'lupin',
      'molluscs': 'molluscs',
      'sulphites': 'sulphites',
      'sulphur dioxide': 'sulphites'
    };
    return mapping[allergen?.toLowerCase()] || allergen?.toLowerCase();
  };

  // Check if menu item contains allergen
  const hasAllergen = (item, allergenId) => {
    if (!item.allergens || item.allergens.length === 0) return false;
    return item.allergens.some(a => mapAllergenToUK(a) === allergenId);
  };

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterAllergen !== 'all') {
      if (filterAllergen === 'gluten_free') {
        return !hasAllergen(item, 'gluten');
      }
      if (filterAllergen === 'dairy_free') {
        return !hasAllergen(item, 'milk');
      }
      return hasAllergen(item, filterAllergen);
    }
    return true;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Menu Item', ...UK_ALLERGENS.map(a => a.name), 'Vegetarian', 'Vegan'];
    const rows = filteredItems.map(item => [
      item.name,
      ...UK_ALLERGENS.map(allergen => hasAllergen(item, allergen.id) ? '✓' : ''),
      item.is_vegetarian ? '✓' : '',
      item.is_vegan ? '✓' : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allergen-matrix-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Export to Excel
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    
    const headers = ['Menu Item', ...UK_ALLERGENS.map(a => a.name), 'Vegetarian', 'Vegan'];
    const rows = filteredItems.map(item => [
      item.name,
      ...UK_ALLERGENS.map(allergen => hasAllergen(item, allergen.id) ? '✓' : ''),
      item.is_vegetarian ? '✓' : '',
      item.is_vegan ? '✓' : ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Allergen Matrix');
    XLSX.writeFile(wb, `allergen-matrix-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = async () => {
    const element = document.getElementById('allergen-report-matrix');
    if (!element) return;
    
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`allergen-report-v${version}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Calculate statistics
  const stats = {
    totalItems: menuItems.length,
    vegetarian: menuItems.filter(i => i.is_vegetarian).length,
    vegan: menuItems.filter(i => i.is_vegan).length,
    glutenFree: menuItems.filter(i => !hasAllergen(i, 'gluten')).length,
    dairyFree: menuItems.filter(i => !hasAllergen(i, 'milk')).length
  };

  if (isLoading) return <LoadingSpinner message="Loading allergen matrix..." />;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #allergen-report-matrix, #allergen-report-matrix * {
            visibility: visible;
          }
          #allergen-report-matrix {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <PageHeader
        title="UK Allergen Matrix Report"
        description={`Complete allergen compliance report • ${filteredItems.length} menu items`}
      />

      {/* Controls */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.print()} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={exportToPDF} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              {canEdit && (
                <Button
                  onClick={() => setEditMode(!editMode)}
                  variant={editMode ? "default" : "outline"}
                  className={editMode ? "bg-emerald-600" : ""}
                >
                  {editMode ? <Lock className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                  {editMode ? 'Lock View' : 'Edit Mode'}
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterAllergen} onValueChange={setFilterAllergen}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by allergen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="gluten_free">Gluten Free</SelectItem>
                  <SelectItem value="dairy_free">Dairy Free</SelectItem>
                  {UK_ALLERGENS.map(allergen => (
                    <SelectItem key={allergen.id} value={allergen.id}>
                      {allergen.icon} Contains {allergen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="dietary"
                  checked={showDietary}
                  onCheckedChange={setShowDietary}
                />
                <Label htmlFor="dietary">Show Dietary Tags</Label>
              </div>

              <Input
                placeholder="Version (e.g., 1.2)"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 no-print">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.totalItems}</p>
            <p className="text-xs text-slate-500">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{stats.vegetarian}</p>
            <p className="text-xs text-slate-500">Vegetarian</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-700">{stats.vegan}</p>
            <p className="text-xs text-slate-500">Vegan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-600">{stats.glutenFree}</p>
            <p className="text-xs text-slate-500">Gluten Free</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{stats.dairyFree}</p>
            <p className="text-xs text-slate-500">Dairy Free</p>
          </CardContent>
        </Card>
      </div>

      {/* Allergen Matrix Report */}
      <div id="allergen-report-matrix" className="bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-emerald-900 mb-2">
                CHAI PATTA – Allergen Matrix Report
              </h1>
              <p className="text-emerald-700 font-medium">
                UK Food Standards Agency 14 Allergens Declaration
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-600 text-white mb-2">Version {version}</Badge>
              <p className="text-sm text-slate-600">Last updated: {format(new Date(), 'dd MMMM yyyy')}</p>
              <p className="text-xs text-slate-500 mt-1">{filteredItems.length} menu items</p>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Sticky Header */}
              <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-bold border-r border-emerald-500 w-64">
                    Menu Item
                  </th>
                  {UK_ALLERGENS.map(allergen => (
                    <TooltipProvider key={allergen.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <th className="px-2 py-3 text-center font-bold border-r border-emerald-500 min-w-[80px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-2xl">{allergen.icon}</span>
                              <span className="text-xs">{allergen.name}</span>
                            </div>
                          </th>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{allergen.name}</p>
                          <p className="text-xs">{allergen.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {showDietary && (
                    <>
                      <th className="px-2 py-3 text-center font-bold border-r border-emerald-500 min-w-[60px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl">🌱</span>
                          <span className="text-xs">Veg</span>
                        </div>
                      </th>
                      <th className="px-2 py-3 text-center font-bold min-w-[60px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl">🌿</span>
                          <span className="text-xs">Vegan</span>
                        </div>
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {filteredItems.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800 border-r border-slate-200">
                      {item.name}
                      {!item.is_active && (
                        <Badge variant="outline" className="ml-2 text-xs">Inactive</Badge>
                      )}
                    </td>
                    {UK_ALLERGENS.map(allergen => {
                      const contains = hasAllergen(item, allergen.id);
                      return (
                        <td
                          key={allergen.id}
                          className={`px-2 py-3 text-center border-r border-slate-200 ${
                            contains ? 'bg-red-50' : ''
                          }`}
                        >
                          {contains ? (
                            <span className="text-red-600 font-bold text-xl">✓</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    {showDietary && (
                      <>
                        <td className="px-2 py-3 text-center border-r border-slate-200">
                          {item.is_vegetarian ? (
                            <span className="text-green-600 font-bold text-xl">✓</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {item.is_vegan ? (
                            <span className="text-green-700 font-bold text-xl">✓</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold text-xl">✓</span>
              <span className="text-slate-700">Contains allergen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 text-xl">—</span>
              <span className="text-slate-700">Allergen not present</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-slate-700">Possible cross-contamination</span>
            </div>
          </div>
        </div>

        {/* Compliance Footer */}
        <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-amber-700 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">
                Important Allergen Information
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed mb-3">
                This allergen matrix is compiled in accordance with UK Food Standards Agency guidelines. 
                Allergen information may vary due to supplier changes, recipe modifications, or cross-contamination 
                during food preparation.
              </p>
              <p className="text-sm font-bold text-amber-900">
                ⚠️ If you have a food allergy or intolerance, please inform our staff before ordering. 
                We cannot guarantee that any dish is completely allergen-free due to shared cooking equipment and preparation areas.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-300 text-xs text-amber-700 space-y-1">
            <p><strong>Restaurant:</strong> CHAI PATTA Street Kitchen</p>
            <p><strong>Address:</strong> [Restaurant Address]</p>
            <p><strong>Contact:</strong> [Phone Number] | [Email]</p>
            <p><strong>Report Generated:</strong> {format(new Date(), 'PPP')} at {format(new Date(), 'p')}</p>
            <p><strong>Version:</strong> {version} | <strong>Authority:</strong> UK Food Standards Agency</p>
          </div>
        </div>
      </div>

      {/* Edit Mode Info */}
      {editMode && (
        <Card className="border-emerald-300 bg-emerald-50 no-print">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Edit Mode Active</p>
                <p className="text-sm text-emerald-700">
                  To edit allergen information, go to Menu Manager and update individual menu items.
                  Changes will be reflected here automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}