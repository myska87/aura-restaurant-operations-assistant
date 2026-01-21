import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, AlertTriangle, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function ChemicalListView({ chemicals = [] }) {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');

  const colourZoneLabels = {
    red: '🔴 RED: Toilets',
    blue: '🔵 BLUE: General',
    green: '🟢 GREEN: Food Contact',
    yellow: '🟡 YELLOW: Dishwashing'
  };

  const getSafetyLevel = (chemical) => {
    if (!chemical.expiry_date) return { label: 'Unknown', color: 'bg-slate-100 text-slate-800' };
    const daysToExpiry = differenceInDays(parseISO(chemical.expiry_date), new Date());
    if (daysToExpiry < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    if (daysToExpiry < 30) return { label: 'Near Expiry', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Safe', color: 'bg-emerald-100 text-emerald-800' };
  };

  const getStockStatus = (chemical) => {
    if (chemical.current_quantity === 0) return { label: 'Out', color: 'bg-red-100 text-red-800' };
    if (chemical.current_quantity <= (chemical.minimum_stock || 1)) return { label: 'Low', color: 'bg-amber-100 text-amber-800' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-800' };
  };

  const filteredChemicals = chemicals.filter(c => {
    const matchesSearch = c.product_name.toLowerCase().includes(search.toLowerCase());
    const matchesArea = areaFilter === 'all' || c.area_used === areaFilter;
    return matchesSearch && matchesArea;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search chemicals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48"
        />
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            <SelectItem value="kitchen">Kitchen</SelectItem>
            <SelectItem value="bathroom">Bathroom</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="food_prep">Food Prep</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chemical List */}
      <div className="space-y-3">
        {filteredChemicals.map((chemical) => {
          const safetyStatus = getSafetyLevel(chemical);
          const stockStatus = getStockStatus(chemical);

          return (
            <Card key={chemical.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Name & Zone */}
                  <div className="md:col-span-3">
                    <p className="font-semibold text-slate-900">{chemical.product_name}</p>
                    <p className="text-xs text-slate-500">{colourZoneLabels[chemical.colour_zone]}</p>
                  </div>

                  {/* Supplier & Area */}
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-600">{chemical.supplier || 'N/A'}</p>
                    <p className="text-xs text-slate-500 capitalize">{chemical.area_used || 'N/A'}</p>
                  </div>

                  {/* Stock */}
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium">{chemical.current_quantity} {chemical.unit}</p>
                    <Badge className={`text-xs mt-1 ${stockStatus.color}`}>{stockStatus.label}</Badge>
                  </div>

                  {/* Expiry */}
                  <div className="md:col-span-2">
                    {chemical.expiry_date ? (
                      <>
                        <p className="text-sm">{format(parseISO(chemical.expiry_date), 'MMM d, yyyy')}</p>
                        <Badge className={`text-xs mt-1 ${safetyStatus.color}`}>{safetyStatus.label}</Badge>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">No expiry set</p>
                    )}
                  </div>

                  {/* Safety Level */}
                  <div className="md:col-span-1">
                    {chemical.hazard_symbols && chemical.hazard_symbols.length > 0 ? (
                      <Badge variant="outline" className="text-xs">⚠️ {chemical.hazard_symbols.length}</Badge>
                    ) : (
                      <p className="text-xs text-slate-500">—</p>
                    )}
                  </div>

                  {/* Last Checked */}
                  <div className="md:col-span-1">
                    {chemical.last_checked ? (
                      <p className="text-xs text-slate-600">{format(new Date(chemical.last_checked), 'MMM d')}</p>
                    ) : (
                      <p className="text-xs text-red-600">Never</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex gap-1">
                    {chemical.sds_file_url && (
                      <Button size="sm" variant="outline" asChild className="flex-1">
                        <a href={chemical.sds_file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" asChild className="flex-1">
                      <Link to={createPageUrl('ChemicalDetail') + `?id=${chemical.id}`}>
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredChemicals.length === 0 && (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-slate-500">No chemicals found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}