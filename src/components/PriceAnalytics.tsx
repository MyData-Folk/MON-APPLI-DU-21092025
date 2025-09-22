import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Plus, X, Target, DollarSign, Calendar, Users } from "lucide-react";
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
  
  // New state for view mode
  const [viewMode, setViewMode] = useState<"comparison" | "table">("comparison");

  // États pour les nouvelles analyses
  const [analyticsTab, setAnalyticsTab] = useState<"disparities" | "trends" | "competition" | "forecast">("disparities");
  const [trendData, setTrendData] = useState<any[]>([]);
  const [competitionData, setCompetitionData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);

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

    // Trier par écart de prix décroissant
    results.sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));

    setDisparities(results);
  };

  const analyzeTrends = () => {
    if (!hotelData || !analyticsForm.startDate || !analyticsForm.endDate) return;

    const filteredPricing = hotelData.pricing.filter(p => {
      const dateInRange = p.date >= analyticsForm.startDate && p.date <= analyticsForm.endDate;
      return dateInRange;
    });

    // Analyser les tendances par mois
    const monthlyData = filteredPricing.reduce((acc, p) => {
      const month = p.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, count: 0, prices: [] };
      }
      acc[month].total += p.price;
      acc[month].count += 1;
      acc[month].prices.push(p.price);
      return acc;
    }, {} as any);

    const trends = Object.keys(monthlyData).map(month => ({
      month,
      avgPrice: monthlyData[month].total / monthlyData[month].count,
      minPrice: Math.min(...monthlyData[month].prices),
      maxPrice: Math.max(...monthlyData[month].prices),
      bookings: monthlyData[month].count
    })).sort((a, b) => a.month.localeCompare(b.month));

    setTrendData(trends);
  };

  const analyzeCompetition = () => {
    if (!hotelData || !analyticsForm.startDate || !analyticsForm.endDate) return;

    const filteredPricing = hotelData.pricing.filter(p => {
      const dateInRange = p.date >= analyticsForm.startDate && p.date <= analyticsForm.endDate;
      return dateInRange;
    });

    // Simuler données concurrentielles (dans un vrai cas, ces données viendraient d'APIs externes)
    const competitorData = filteredPricing.slice(0, 10).map(p => ({
      date: p.date,
      ourPrice: p.price,
      competitor1: p.price * (0.95 + Math.random() * 0.1), // ±5% variation
      competitor2: p.price * (0.90 + Math.random() * 0.2), // ±10% variation
      marketAvg: p.price * (0.92 + Math.random() * 0.16)   // ±8% variation
    }));

    setCompetitionData(competitorData);
  };

  const generateForecast = () => {
    if (!hotelData || !analyticsForm.startDate || !analyticsForm.endDate) return;

    const filteredPricing = hotelData.pricing.filter(p => {
      const dateInRange = p.date >= analyticsForm.startDate && p.date <= analyticsForm.endDate;
      return dateInRange;
    });

    // Générer des prévisions basées sur les tendances historiques
    const lastMonth = filteredPricing.slice(-30);
    const avgPrice = lastMonth.reduce((sum, p) => sum + p.price, 0) / lastMonth.length;
    
    const forecast = [];
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      
      // Simulation d'une tendance avec saisonnalité
      const seasonality = 1 + 0.1 * Math.sin((i / 30) * 2 * Math.PI);
      const trend = 1 + (Math.random() - 0.5) * 0.1;
      const predictedPrice = avgPrice * seasonality * trend;
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predictedPrice,
        confidence: Math.max(0.7, 1 - (i / 30) * 0.3), // Confiance diminue avec le temps
        minPrice: predictedPrice * 0.9,
        maxPrice: predictedPrice * 1.1
      });
    }

    setForecastData(forecast);
  };

  const addRatePlan = () => {
    if (!strategyForm.roomType) return;

    // Obtenir tous les plans tarifaires disponibles pour ce type de chambre
    const availableRatePlans = hotelData?.pricing
      .filter(p => p.roomType === strategyForm.roomType)
      .map(p => p.ratePlan);

    const uniqueRatePlans = [...new Set(availableRatePlans)];

    if (uniqueRatePlans.length === 0) return;

    const newPlan: SelectedRatePlan = {
      id: Date.now().toString(),
      ratePlan: uniqueRatePlans[0],
      roomType: strategyForm.roomType
    };

    setSelectedRatePlans(prev => [...prev, newPlan]);
  };

  const removeRatePlan = (id: string) => {
    setSelectedRatePlans(prev => prev.filter(p => p.id !== id));
  };

  const updateRatePlan = (id: string, newRatePlan: string) => {
    setSelectedRatePlans(prev => 
      prev.map(p => p.id === id ? { ...p, ratePlan: newRatePlan } : p)
    );
  };

  const analyzeStrategy = () => {
    if (!hotelData || !strategyForm.startDate || !strategyForm.endDate || selectedRatePlans.length === 0) return;

    const results: PricingStrategy[] = [];

    selectedRatePlans.forEach(plan => {
      const pricing = hotelData.pricing.filter(p => 
        p.roomType === plan.roomType && 
        p.ratePlan === plan.ratePlan &&
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

    results.sort((a, b) => a.date.localeCompare(b.date));
    setStrategyData(results);
  };

  const getStrategyChartData = () => {
    const groupedByDate = strategyData.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date };
      }
      const key = `${item.roomType}-${item.ratePlan}`;
      acc[item.date][key] = item.price;
      return acc;
    }, {} as any);

    return Object.values(groupedByDate);
  };

  const getUniqueRatePlanCombos = () => {
    return [...new Set(strategyData.map(item => `${item.roomType}-${item.ratePlan}`))];
  };

  const getRandomColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
    return colors[index % colors.length];
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={analyticsTab} onValueChange={(value) => setAnalyticsTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="disparities" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disparités
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendances
          </TabsTrigger>
          <TabsTrigger value="competition" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Concurrence
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Prévisions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disparities">
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
                  <Label htmlFor="analytics-room-type">Type de chambre</Label>
                  <Select 
                    value={analyticsForm.roomType} 
                    onValueChange={(value) => setAnalyticsForm(prev => ({ ...prev, roomType: value }))}
                  >
                    <SelectTrigger id="analytics-room-type">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {hotelData?.roomTypes.map(rt => (
                        <SelectItem key={rt.code} value={rt.name}>{rt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="analytics-rate-plan">Plan tarifaire</Label>
                  <Select 
                    value={analyticsForm.ratePlan} 
                    onValueChange={(value) => setAnalyticsForm(prev => ({ ...prev, ratePlan: value }))}
                  >
                    <SelectTrigger id="analytics-rate-plan">
                      <SelectValue placeholder="Tous les plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les plans</SelectItem>
                      {hotelData?.ratePlans.map(rp => (
                        <SelectItem key={rp.code} value={rp.code}>{rp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={analyzeDisparities} className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analyser les Disparités
              </Button>

              {disparities.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Prix moyen</p>
                            <p className="text-2xl font-bold">{disparities[0]?.avgPrice.toFixed(2)} €</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Plus grand écart</p>
                            <p className="text-2xl font-bold">{Math.abs(disparities[0]?.deviationPercent || 0).toFixed(1)}%</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total analysé</p>
                            <p className="text-2xl font-bold">{disparities.length}</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Moyenne</TableHead>
                          <TableHead>Écart</TableHead>
                          <TableHead>Tendance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disparities.map((d, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(d.date).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>{d.roomType}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {hotelData?.ratePlans.find(rp => rp.code === d.ratePlan)?.name || d.ratePlan}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{d.price.toFixed(2)} €</TableCell>
                            <TableCell>{d.avgPrice.toFixed(2)} €</TableCell>
                            <TableCell>
                              <Badge variant={Math.abs(d.deviationPercent) > 10 ? "destructive" : "secondary"}>
                                {d.deviationPercent > 0 ? '+' : ''}{d.deviationPercent.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{getTrendIcon(d.trend)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analyse des Tendances
              </CardTitle>
              <CardDescription>
                Évolution des prix sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={analyzeTrends} className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analyser les Tendances
              </Button>

              {trendData.length > 0 && (
                <div className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(2)} €`, 'Prix']} />
                        <Legend />
                        <Area type="monotone" dataKey="avgPrice" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Prix moyen" />
                        <Area type="monotone" dataKey="maxPrice" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Prix max" />
                        <Area type="monotone" dataKey="minPrice" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} name="Prix min" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mois</TableHead>
                        <TableHead>Prix Moyen</TableHead>
                        <TableHead>Prix Min</TableHead>
                        <TableHead>Prix Max</TableHead>
                        <TableHead>Réservations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trendData.map((trend) => (
                        <TableRow key={trend.month}>
                          <TableCell>{trend.month}</TableCell>
                          <TableCell>{trend.avgPrice.toFixed(2)} €</TableCell>
                          <TableCell>{trend.minPrice.toFixed(2)} €</TableCell>
                          <TableCell>{trend.maxPrice.toFixed(2)} €</TableCell>
                          <TableCell>{trend.bookings}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competition">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analyse Concurrentielle
              </CardTitle>
              <CardDescription>
                Comparaison avec les prix du marché
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={analyzeCompetition} className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Analyser la Concurrence
              </Button>

              {competitionData.length > 0 && (
                <div className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={competitionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')} />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                          formatter={(value: number) => [`${value.toFixed(2)} €`, 'Prix']}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ourPrice" stroke="#8884d8" strokeWidth={3} name="Notre Prix" />
                        <Line type="monotone" dataKey="competitor1" stroke="#82ca9d" strokeDasharray="5 5" name="Concurrent A" />
                        <Line type="monotone" dataKey="competitor2" stroke="#ffc658" strokeDasharray="5 5" name="Concurrent B" />
                        <Line type="monotone" dataKey="marketAvg" stroke="#ff7300" strokeWidth={2} name="Moyenne Marché" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Notre Prix</TableHead>
                        <TableHead>Concurrent A</TableHead>
                        <TableHead>Concurrent B</TableHead>
                        <TableHead>Moyenne Marché</TableHead>
                        <TableHead>Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitionData.map((comp, index) => {
                        const position = [comp.ourPrice, comp.competitor1, comp.competitor2, comp.marketAvg]
                          .sort((a, b) => a - b)
                          .indexOf(comp.ourPrice) + 1;
                        return (
                          <TableRow key={index}>
                            <TableCell>{new Date(comp.date).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell className="font-medium">{comp.ourPrice.toFixed(2)} €</TableCell>
                            <TableCell>{comp.competitor1.toFixed(2)} €</TableCell>
                            <TableCell>{comp.competitor2.toFixed(2)} €</TableCell>
                            <TableCell>{comp.marketAvg.toFixed(2)} €</TableCell>
                            <TableCell>
                              <Badge variant={position <= 2 ? "default" : "secondary"}>
                                {position}e/4
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prévisions Tarifaires
              </CardTitle>
              <CardDescription>
                Prédictions basées sur les tendances historiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateForecast} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Générer Prévisions
              </Button>

              {forecastData.length > 0 && (
                <div className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')} />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                          formatter={(value: number) => [`${value.toFixed(2)} €`, 'Prix']}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="maxPrice" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.2} name="Prix Max Prévu" />
                        <Area type="monotone" dataKey="predictedPrice" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Prix Prévu" />
                        <Area type="monotone" dataKey="minPrice" stroke="#ffc658" fill="#ffc658" fillOpacity={0.2} name="Prix Min Prévu" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Prix Prévu</TableHead>
                        <TableHead>Fourchette</TableHead>
                        <TableHead>Confiance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecastData.slice(0, 10).map((forecast, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(forecast.date).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell className="font-medium">{forecast.predictedPrice.toFixed(2)} €</TableCell>
                          <TableCell>
                            {forecast.minPrice.toFixed(2)} € - {forecast.maxPrice.toFixed(2)} €
                          </TableCell>
                          <TableCell>
                            <Badge variant={forecast.confidence > 0.8 ? "default" : "secondary"}>
                              {(forecast.confidence * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Stratégie Tarifaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stratégie Tarifaire
          </CardTitle>
          <CardDescription>
            Comparez les tarifs entre différents plans sur une période donnée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={viewMode === "comparison" ? "default" : "outline"}
              onClick={() => setViewMode("comparison")}
              size="sm"
            >
              Comparaison
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
              size="sm"
            >
              Tableau par dates
            </Button>
          </div>

          {viewMode === "comparison" ? (
            <>
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
                  <Label htmlFor="strategy-room-type">Type de chambre</Label>
                  <Select 
                    value={strategyForm.roomType} 
                    onValueChange={(value) => setStrategyForm(prev => ({ ...prev, roomType: value }))}
                  >
                    <SelectTrigger id="strategy-room-type">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelData?.roomTypes.map(rt => (
                        <SelectItem key={rt.code} value={rt.name}>{rt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Plans tarifaires à comparer</Label>
                  <Button 
                    onClick={addRatePlan} 
                    variant="outline" 
                    size="sm"
                    disabled={!strategyForm.roomType}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un plan
                  </Button>
                </div>

                {selectedRatePlans.map(plan => (
                  <div key={plan.id} className="flex items-center gap-2 p-2 border rounded">
                    <Select 
                      value={plan.ratePlan} 
                      onValueChange={(value) => updateRatePlan(plan.id, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hotelData?.pricing
                          .filter(p => p.roomType === plan.roomType)
                          .map(p => p.ratePlan)
                          .filter((value, index, self) => self.indexOf(value) === index)
                          .map(ratePlan => (
                            <SelectItem key={ratePlan} value={ratePlan}>
                              {hotelData?.ratePlans.find(rp => rp.code === ratePlan)?.name || ratePlan}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => removeRatePlan(plan.id)} 
                      variant="outline" 
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                onClick={analyzeStrategy} 
                className="flex items-center gap-2"
                disabled={selectedRatePlans.length === 0}
              >
                <BarChart3 className="h-4 w-4" />
                Analyser la Stratégie
              </Button>

              {strategyData.length > 0 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Graphique Comparatif</CardTitle>
                      <CardDescription>
                        Évolution des prix des plans sélectionnés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getStrategyChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')} />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                              formatter={(value: number) => [`${value.toFixed(2)} €`, 'Prix']}
                            />
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
                              <TableHead>Prix</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {strategyData.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{new Date(item.date).toLocaleDateString('fr-FR')}</TableCell>
                                <TableCell>{item.roomType}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {hotelData?.ratePlans.find(rp => rp.code === item.ratePlan)?.name || item.ratePlan}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{item.price.toFixed(2)} €</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          ) : (
            // Table view mode
            strategyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tableau par Dates</CardTitle>
                  <CardDescription>
                    {strategyData.length} résultats trouvés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px] bg-gray-50">Plan tarifaire / Date</TableHead>
                          {Array.from(new Set(strategyData.map(item => item.date)))
                            .sort()
                            .map(date => (
                              <TableHead key={date} className="text-center min-w-[120px] bg-gray-50">
                                {new Date(date).toLocaleDateString('fr-FR', { 
                                  day: '2-digit', 
                                  month: 'short' 
                                })}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-b-2">
                          <TableCell className="font-bold text-gray-700 bg-gray-100">Date</TableCell>
                          {Array.from(new Set(strategyData.map(item => item.date)))
                            .sort()
                            .map(date => (
                              <TableCell key={date} className="text-center font-medium bg-gray-100">
                                {new Date(date).toLocaleDateString('fr-FR')}
                              </TableCell>
                            ))}
                        </TableRow>
                        {Array.from(new Set(strategyData.map(item => item.ratePlan))).map(ratePlan => (
                          <TableRow key={ratePlan}>
                            <TableCell className="font-medium bg-gray-50">
                              {hotelData?.ratePlans.find(p => p.code === ratePlan)?.name || ratePlan}
                            </TableCell>
                            {Array.from(new Set(strategyData.map(item => item.date)))
                              .sort()
                              .map(date => {
                                const priceData = strategyData.find(
                                  item => item.ratePlan === ratePlan && item.date === date
                                );
                                return (
                                  <TableCell key={date} className="text-center">
                                    {priceData ? `${priceData.price.toFixed(2)} €` : '-'}
                                  </TableCell>
                                );
                              })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getStrategyChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')} />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                          formatter={(value: number) => [`${value.toFixed(2)} €`, 'Prix']}
                        />
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
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};