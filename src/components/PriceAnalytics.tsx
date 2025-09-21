import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Plus, X } from "lucide-react";
import { HotelData, PricingData } from "@/types/hotel";

interface PriceAnalyticsProps {
  hotelData: HotelData | null;
}

interface PriceDisparity {
  date: string;
  roomType: string;
  ratePlan: string;
  price: number;
  avgPrice: number;
  deviation: number;
  deviationPercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface PricingStrategy {
  date: string;
  price: number;
  roomType: string;
  ratePlan: string;
}

interface SelectedRatePlan {
  id: string;
  ratePlan: string;
  roomType: string;
}

export const PriceAnalytics = ({ hotelData }: PriceAnalyticsProps) => {
  // États pour l'analyse des disparités
  const [analyticsForm, setAnalyticsForm] = useState({
    startDate: "",
    endDate: "",
    roomType: "",
    ratePlan: ""
  });
  const [disparities, setDisparities] = useState<PriceDisparity[]>([]);

  // États pour la stratégie tarifaire
  const [strategyForm, setStrategyForm] = useState({
    startDate: "",
    endDate: "",
    roomType: ""
  });
  const [selectedRatePlans, setSelectedRatePlans] = useState<SelectedRatePlan[]>([]);
  const [strategyData, setStrategyData] = useState<PricingStrategy[]>([]);

  const analyzeDisparities = () => {
    if (!hotelData || !analyticsForm.startDate || !analyticsForm.endDate) return;

    console.log('Analyzing price disparities...');
    console.log('Form:', analyticsForm);
    console.log('Available pricing data:', hotelData.pricing.slice(0, 5));
    console.log('Available room types:', hotelData.roomTypes.map(r => r.name));
    console.log('Available rate plans:', hotelData.ratePlans.map(r => r.code));

    // Filtrer les données selon les critères
    const filteredPricing = hotelData.pricing.filter(p => {
      const dateInRange = p.date >= analyticsForm.startDate && p.date <= analyticsForm.endDate;
      const roomTypeMatch = !analyticsForm.roomType || analyticsForm.roomType === "all" || p.roomType === analyticsForm.roomType;
      const ratePlanMatch = !analyticsForm.ratePlan || analyticsForm.ratePlan === "all" || p.ratePlan === analyticsForm.ratePlan;
      
      return dateInRange && roomTypeMatch && ratePlanMatch;
    });

    console.log('Filtered pricing data:', filteredPricing);

    if (filteredPricing.length === 0) {
      setDisparities([]);
      return;
    }

    // Calculer la moyenne des prix
    const avgPrice = filteredPricing.reduce((sum, p) => sum + p.price, 0) / filteredPricing.length;
    
    // Calculer les disparités
    const results: PriceDisparity[] = filteredPricing.map(p => {
      const deviation = p.price - avgPrice;
      const deviationPercent = (deviation / avgPrice) * 100;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(deviationPercent) > 5) {
        trend = deviationPercent > 0 ? 'up' : 'down';
      }

      return {
        date: p.date,
        roomType: p.roomType,
        ratePlan: p.ratePlan,
        price: p.price,
        avgPrice,
        deviation,
        deviationPercent,
        trend
      };
    });

    // Trier par déviation absolue décroissante
    results.sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));
    
    console.log('Analysis results:', results);
    setDisparities(results);
  };

  const getChartData = () => {
    const grouped = disparities.reduce((acc, item) => {
      const key = item.date;
      if (!acc[key]) {
        acc[key] = {
          date: key,
          prices: [],
          avgPrice: item.avgPrice
        };
      }
      acc[key].prices.push(item.price);
      return acc;
    }, {} as any);

    return Object.values(grouped).map((group: any) => ({
      date: group.date,
      minPrice: Math.min(...group.prices),
      maxPrice: Math.max(...group.prices),
      avgPrice: group.avgPrice,
      variance: Math.max(...group.prices) - Math.min(...group.prices)
    }));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeviationColor = (deviationPercent: number) => {
    if (Math.abs(deviationPercent) > 20) return "destructive";
    if (Math.abs(deviationPercent) > 10) return "secondary";
    return "outline";
  };

  // Fonctions pour la stratégie tarifaire
  const addRatePlan = (ratePlan: string) => {
    if (!strategyForm.roomType || !ratePlan || 
        selectedRatePlans.some(plan => plan.ratePlan === ratePlan && plan.roomType === strategyForm.roomType)) {
      return;
    }
    
    const newPlan: SelectedRatePlan = {
      id: `${strategyForm.roomType}-${ratePlan}-${Date.now()}`,
      ratePlan,
      roomType: strategyForm.roomType
    };
    
    setSelectedRatePlans(prev => [...prev, newPlan]);
  };

  const removeRatePlan = (id: string) => {
    setSelectedRatePlans(prev => prev.filter(plan => plan.id !== id));
  };

  const analyzePricingStrategy = () => {
    if (!hotelData || !strategyForm.startDate || !strategyForm.endDate || selectedRatePlans.length === 0) {
      return;
    }

    const results: PricingStrategy[] = [];
    
    selectedRatePlans.forEach(selectedPlan => {
      const pricing = hotelData.pricing.filter(p => 
        p.roomType === selectedPlan.roomType &&
        p.ratePlan === selectedPlan.ratePlan &&
        p.date >= strategyForm.startDate && 
        p.date <= strategyForm.endDate
      );
      
      pricing.forEach(p => {
        results.push({
          date: p.date,
          price: p.price,
          roomType: p.roomType,
          ratePlan: p.ratePlan
        });
      });
    });

    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setStrategyData(results);
  };

  const getStrategyChartData = () => {
    const grouped = strategyData.reduce((acc, item) => {
      const key = item.date;
      if (!acc[key]) {
        acc[key] = { date: key };
      }
      acc[key][`${item.roomType}-${item.ratePlan}`] = item.price;
      return acc;
    }, {} as any);

    return Object.values(grouped);
  };

  const getUniqueRatePlanCombos = () => {
    return [...new Set(strategyData.map(item => `${item.roomType}-${item.ratePlan}`))];
  };

  const getRandomColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Section Stratégie Tarifaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stratégie Tarifaire
          </CardTitle>
          <CardDescription>
            Comparez les tarifs de différents plans sur une période donnée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="strategy-start-date">Date de début</Label>
              <Input
                id="strategy-start-date"
                type="date"
                value={strategyForm.startDate}
                onChange={(e) => setStrategyForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="strategy-end-date">Date de fin</Label>
              <Input
                id="strategy-end-date"
                type="date"
                value={strategyForm.endDate}
                onChange={(e) => setStrategyForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label>Type de chambre</Label>
              <Select 
                value={strategyForm.roomType} 
                onValueChange={(value) => setStrategyForm(prev => ({ ...prev, roomType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {hotelData?.roomTypes.map((room) => (
                    <SelectItem key={room.code} value={room.name}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Plans tarifaires sélectionnés</Label>
            
            {selectedRatePlans.length > 0 && (
              <div className="space-y-2">
                {selectedRatePlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <span className="text-sm">
                      {plan.roomType} - {hotelData?.ratePlans.find(p => p.code === plan.ratePlan)?.name || plan.ratePlan}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRatePlan(plan.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Select 
                onValueChange={addRatePlan}
                disabled={!strategyForm.roomType}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Ajouter un plan tarifaire" />
                </SelectTrigger>
                <SelectContent>
                  {hotelData?.ratePlans
                    .filter(plan => {
                      // Vérifier que des données existent pour cette combinaison
                      return hotelData.pricing.some(p => 
                        p.roomType === strategyForm.roomType && 
                        p.ratePlan === plan.code
                      ) && !selectedRatePlans.some(selected => 
                        selected.ratePlan === plan.code && 
                        selected.roomType === strategyForm.roomType
                      );
                    })
                    .map((plan) => (
                      <SelectItem key={plan.code} value={plan.code}>
                        {plan.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={analyzePricingStrategy} 
            className="w-full"
            disabled={selectedRatePlans.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Analyser la Stratégie Tarifaire
          </Button>
        </CardContent>
      </Card>

      {/* Résultats de la stratégie tarifaire */}
      {strategyData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Graphique de Comparaison Tarifaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getStrategyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {getUniqueRatePlanCombos().map((combo, index) => (
                      <Line 
                        key={combo}
                        type="monotone" 
                        dataKey={combo} 
                        stroke={getRandomColor(index)} 
                        name={combo.replace('-', ' - ')}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tableau des Tarifs</CardTitle>
              <CardDescription>
                {strategyData.length} résultats trouvés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type de chambre</TableHead>
                      <TableHead>Plan tarifaire</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategyData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.roomType}</TableCell>
                        <TableCell>
                          {hotelData?.ratePlans.find(p => p.code === item.ratePlan)?.name || item.ratePlan}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.price.toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Section Analyse des Disparités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Analyse des Disparités Tarifaires
          </CardTitle>
          <CardDescription>
            Identifiez les écarts de prix significatifs sur les dates sélectionnées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="analytics-start-date">Date de début</Label>
              <Input
                id="analytics-start-date"
                type="date"
                value={analyticsForm.startDate}
                onChange={(e) => setAnalyticsForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="analytics-end-date">Date de fin</Label>
              <Input
                id="analytics-end-date"
                type="date"
                value={analyticsForm.endDate}
                onChange={(e) => setAnalyticsForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label>Type de chambre (optionnel)</Label>
              <Select 
                value={analyticsForm.roomType} 
                onValueChange={(value) => setAnalyticsForm(prev => ({ ...prev, roomType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {hotelData?.roomTypes.map((room) => (
                    <SelectItem key={room.code} value={room.name}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Plan tarifaire (optionnel)</Label>
              <Select 
                value={analyticsForm.ratePlan} 
                onValueChange={(value) => setAnalyticsForm(prev => ({ ...prev, ratePlan: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les plans</SelectItem>
                  {hotelData?.ratePlans.map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={analyzeDisparities} className="w-full">
            Analyser les Disparités
          </Button>
        </CardContent>
      </Card>

      {disparities.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Graphique des Variations de Prix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="minPrice" 
                      stroke="#ef4444" 
                      name="Prix Minimum" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="maxPrice" 
                      stroke="#22c55e" 
                      name="Prix Maximum" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgPrice" 
                      stroke="#3b82f6" 
                      name="Prix Moyen" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tableau des Disparités</CardTitle>
              <CardDescription>
                {disparities.length} résultats trouvés - Triés par déviation décroissante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type de chambre</TableHead>
                      <TableHead>Plan tarifaire</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Prix moyen</TableHead>
                      <TableHead className="text-right">Déviation</TableHead>
                      <TableHead>Tendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disparities.map((disparity, index) => (
                      <TableRow key={index}>
                        <TableCell>{disparity.date}</TableCell>
                        <TableCell>{disparity.roomType}</TableCell>
                        <TableCell>{disparity.ratePlan}</TableCell>
                        <TableCell className="text-right font-medium">
                          {disparity.price.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-right">
                          {disparity.avgPrice.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getDeviationColor(disparity.deviationPercent)}>
                            {disparity.deviationPercent > 0 ? '+' : ''}
                            {disparity.deviationPercent.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getTrendIcon(disparity.trend)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};