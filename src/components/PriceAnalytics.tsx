import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { HotelData } from "@/types/hotel";

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

export const PriceAnalytics = ({ hotelData }: PriceAnalyticsProps) => {
  const [analyticsForm, setAnalyticsForm] = useState({
    startDate: "",
    endDate: "",
    roomType: "",
    ratePlan: ""
  });
  const [disparities, setDisparities] = useState<PriceDisparity[]>([]);

  const analyzeDisparities = () => {
    if (!hotelData || !analyticsForm.startDate || !analyticsForm.endDate) return;

    console.log('Analyzing price disparities...');
    console.log('Form:', analyticsForm);
    console.log('Available pricing data:', hotelData.pricing.slice(0, 10));

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

  return (
    <div className="space-y-6">
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
              <CardTitle>Détail des Disparités</CardTitle>
              <CardDescription>
                {disparities.length} résultats trouvés - Triés par déviation décroissante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {disparities.map((disparity, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getTrendIcon(disparity.trend)}
                      <div>
                        <div className="font-medium">
                          {disparity.roomType} - {disparity.ratePlan}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {disparity.date}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold">
                          {disparity.price.toFixed(2)} €
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Moy: {disparity.avgPrice.toFixed(2)} €
                        </div>
                      </div>
                      
                      <Badge variant={getDeviationColor(disparity.deviationPercent)}>
                        {disparity.deviationPercent > 0 ? '+' : ''}
                        {disparity.deviationPercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};