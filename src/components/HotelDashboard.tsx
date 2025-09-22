import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  Settings, 
  Calendar, 
  Users, 
  BarChart3, 
  Download,
  Hotel,
  CheckSquare,
  RefreshCw,
  FileSpreadsheet,
  Calculator,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HotelData, Partner, SimulationResult, AvailabilityResult } from "@/types/hotel";
import { ExcelParser } from "@/utils/excelParser";
import { PriceAnalytics } from "./PriceAnalytics";

export const HotelDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("control");
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [partners, setPartners] = useState<Partner[]>([
    { name: "Booking.com", commission: 15, codes: ["OTA-RO-FLEX", "OTA-RO-NANR", "OTA-BB-FLEX", "OTA-BB-NANR"] },
    { name: "Agoda", commission: 18, codes: ["OTA-RO-FLEX-20"] },
    { name: "Expedia", commission: 20, codes: ["PKG-EXP-RO-FLEX", "PKG-EXP-RO-NANR", "PKG-EXP-BB-FLEX", "PKG-EXP-BB-NANR"] }
  ]);
  const [configFile, setConfigFile] = useState<any>(null);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [simulationForm, setSimulationForm] = useState({
    partner: "",
    roomType: "",
    ratePlan: "",
    startDate: "",
    endDate: ""
  });
  const [promotionalDiscount, setPromotionalDiscount] = useState(0);
  const [applyCommission, setApplyCommission] = useState(true);
  const [availabilityForm, setAvailabilityForm] = useState({
    startDate: "",
    endDate: "",
    roomTypes: [] as string[]
  });
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResult[]>([]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast({
        variant: "destructive",
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier Excel (.xlsx)",
      });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('Raw Excel data:', data.slice(0, 5));
      
      const parsedData = ExcelParser.parseHotelData(data as any[][]);
      setHotelData(parsedData);
      setSelectedRoomTypes(parsedData.roomTypes.map(rt => rt.code));

      toast({
        title: "Fichier chargé avec succès",
        description: `Planning ${parsedData.hotelName} analysé - ${parsedData.roomTypes.length} types de chambres, ${parsedData.ratePlans.length} plans tarifaires`,
      });
    } catch (error) {
      console.error('Erreur lors du parsing:', error);
      toast({
        variant: "destructive",
        title: "Erreur de parsing",
        description: "Impossible d'analyser le fichier Excel. Vérifiez le format.",
      });
    }
  }, [toast]);

  const handleConfigUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      toast({
        variant: "destructive",
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier JSON",
      });
      return;
    }

    try {
      const text = await file.text();
      const config = JSON.parse(text);
      setConfigFile(config);
      
      console.log('Loaded config:', config);
      
      // Convertir la configuration en partenaires
      const newPartners: Partner[] = Object.entries(config.partners || {}).map(([name, data]: [string, any]) => ({
        name,
        commission: data.commission,
        codes: data.codes
      }));
      
      setPartners(newPartners);
      console.log('Updated partners:', newPartners);

      toast({
        title: "Configuration chargée",
        description: `${newPartners.length} partenaires OTA configurés`,
      });
    } catch (error) {
      console.error('Erreur lors du parsing JSON:', error);
      toast({
        variant: "destructive",
        title: "Erreur de parsing",
        description: "Impossible d'analyser le fichier JSON. Vérifiez le format.",
      });
    }
  }, [toast]);

  const simulateReservation = useCallback(() => {
    if (!hotelData || !simulationForm.partner || !simulationForm.roomType || !simulationForm.ratePlan) {
      toast({
        variant: "destructive",
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs requis",
      });
      return;
    }

    console.log('Simulation - Form data:', simulationForm);
    console.log('Simulation - Hotel data pricing:', hotelData.pricing.slice(0, 5));
    console.log('Simulation - Partners:', partners);

    const partner = partners.find(p => p.name === simulationForm.partner);
    
    console.log('Selected partner:', partner);
    console.log('Looking for roomType:', simulationForm.roomType);
    console.log('Looking for ratePlan:', simulationForm.ratePlan);
    
    // Verify partner has access to this rate plan
    if (partner && !partner.codes.includes(simulationForm.ratePlan)) {
      toast({
        variant: "destructive",
        title: "Plan tarifaire non autorisé",
        description: `Le partenaire ${partner.name} n'a pas accès au plan ${simulationForm.ratePlan}`,
      });
      return;
    }

    const pricing = hotelData.pricing.filter(p => {
      const roomTypeMatch = p.roomType === simulationForm.roomType;
      const ratePlanMatch = p.ratePlan === simulationForm.ratePlan;
      const dateMatch = p.date >= simulationForm.startDate && p.date <= simulationForm.endDate;
      
      return roomTypeMatch && ratePlanMatch && dateMatch;
    });

    console.log('Filtered pricing results:', pricing);

    // Calculer le prix moyen pour la période sélectionnée
    const totalPrice = pricing.reduce((sum, p) => sum + p.price, 0);
    const averagePrice = pricing.length > 0 ? totalPrice / pricing.length : 0;
    const totalNights = pricing.length;

    if (pricing.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun tarif trouvé",
        description: "Aucun tarif disponible pour cette combinaison",
      });
      return;
    }

    // Créer un seul résultat avec le prix moyen
    const priceAfterCommission = applyCommission 
      ? averagePrice * (1 - (partner?.commission || 15) / 100)
      : averagePrice;
    const finalPrice = priceAfterCommission * (1 - (promotionalDiscount / 100));
    
    const result: SimulationResult = {
      roomType: simulationForm.roomType,
      ratePlan: simulationForm.ratePlan,
      partner: simulationForm.partner,
      startDate: simulationForm.startDate,
      endDate: simulationForm.endDate,
      price: averagePrice,
      commission: applyCommission ? (partner?.commission || 15) : 0,
      netPrice: finalPrice,
      available: true,
      nights: totalNights
    };

    setSimulationResults([result]);
    toast({
      title: "Simulation terminée",
      description: `1 résultat trouvé pour ${totalNights} nuits`,
    });
  }, [hotelData, simulationForm, partners, toast]);

  const checkAvailability = useCallback(() => {
    if (!hotelData || !availabilityForm.startDate || !availabilityForm.endDate) {
      toast({
        variant: "destructive",
        title: "Formulaire incomplet",
        description: "Veuillez sélectionner les dates",
      });
      return;
    }

    console.log('Availability check - Hotel data availability:', hotelData.availability.slice(0, 10));
    console.log('Availability check - Date range:', availabilityForm.startDate, 'to', availabilityForm.endDate);
    console.log('Availability check - Selected room types:', availabilityForm.roomTypes);

    const targetRoomTypes = availabilityForm.roomTypes.length > 0 
      ? availabilityForm.roomTypes 
      : hotelData.roomTypes.map(rt => rt.name);

    const results: AvailabilityResult[] = [];
    const startDate = new Date(availabilityForm.startDate);
    const endDate = new Date(availabilityForm.endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayAvailability: AvailabilityResult = {
        date: dateStr,
        roomTypes: {}
      };

      targetRoomTypes.forEach(roomTypeName => {
        const availability = hotelData.availability.find(a => 
          a.roomType === roomTypeName && a.date === dateStr
        );
        
        console.log('Availability lookup for', roomTypeName, 'on', dateStr, ':', availability);
        
        dayAvailability.roomTypes[roomTypeName] = {
          available: availability?.available || 0,
          status: availability?.status || 'closed'
        };
      });

      results.push(dayAvailability);
    }

    setAvailabilityResults(results);
    toast({
      title: "Vérification terminée",
      description: `Disponibilités vérifiées sur ${results.length} jours`,
    });
  }, [hotelData, availabilityForm, toast]);

  const exportResults = useCallback(() => {
    if (simulationResults.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun résultat",
        description: "Effectuez d'abord une simulation",
      });
      return;
    }

    const csv = [
      ['Type Chambre', 'Plan Tarifaire', 'Partenaire', 'Date Début', 'Date Fin', 'Prix', 'Commission', 'Prix Net'].join(','),
      ...simulationResults.map(r => [
        r.roomType,
        r.ratePlan,
        r.partner,
        r.startDate,
        r.endDate,
        r.price.toFixed(2),
        `${r.commission}%`,
        r.netPrice.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_results.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Les résultats ont été exportés en CSV",
    });
  }, [simulationResults, toast]);

  const toggleRoomType = useCallback((roomType: string) => {
    setSelectedRoomTypes(prev => 
      prev.includes(roomType) 
        ? prev.filter(rt => rt !== roomType)
        : [...prev, roomType]
    );
  }, []);

  const selectAllRoomTypes = useCallback(() => {
    if (!hotelData) return;
    setSelectedRoomTypes(hotelData.roomTypes.map(rt => rt.code));
  }, [hotelData]);

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-gradient-primary text-white shadow-elegant">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hotel className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Hotel Revenue Manager</h1>
                <p className="text-primary-foreground/80">
                  {hotelData 
                    ? `${hotelData.hotelName} - ${hotelData.roomTypes.length} types de chambres`
                    : "Chargez votre planning Excel pour commencer"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card shadow-card">
            <TabsTrigger value="control" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Contrôle
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Simulateur
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Disponibilités
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="price-analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Disparités Prix
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Contrôle - Upload des fichiers */}
          <TabsContent value="control" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    Planning Excel
                  </CardTitle>
                  <CardDescription>
                    Chargez votre fichier Excel contenant les plannings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="excel-file">Fichier Planning (.xlsx)</Label>
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileUpload}
                      className="file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md"
                    />
                  </div>
                  
                  {hotelData && (
                    <div className="mt-4 p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Données chargées:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Types de chambres: {hotelData.roomTypes.length}</div>
                        <div>Plans tarifaires: {hotelData.ratePlans.length}</div>
                        <div>Dates: {hotelData.dates.length}</div>
                        <div>Prix: {hotelData.pricing.length}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Configuration OTA
                  </CardTitle>
                  <CardDescription>
                    Chargez votre configuration des partenaires et plans tarifaires
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="config-file">Fichier Configuration (.json)</Label>
                    <Input
                      id="config-file"
                      type="file"
                      accept=".json"
                      onChange={handleConfigUpload}
                      className="file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md"
                    />
                  </div>
                  
                  {configFile && (
                    <div className="mt-4 p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Configuration chargée:</h4>
                      <div className="text-sm">
                        <div>Partenaires: {partners.length}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Simulateur de Réservation */}
          <TabsContent value="simulator" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Simulateur de Réservation
                </CardTitle>
                <CardDescription>
                  Testez vos réservations avec différents paramètres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Partenaire</Label>
                    <Select 
                      value={simulationForm.partner} 
                      onValueChange={(value) => setSimulationForm(prev => ({...prev, partner: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un partenaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.name} value={partner.name}>
                            {partner.name} ({partner.commission}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de chambre</Label>
                    <Select 
                      value={simulationForm.roomType} 
                      onValueChange={(value) => setSimulationForm(prev => ({ ...prev, roomType: value }))}
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

                  <div className="space-y-2">
                    <Label>Plan tarifaire</Label>
                    <Select 
                      value={simulationForm.ratePlan} 
                      onValueChange={(value) => setSimulationForm(prev => ({ ...prev, ratePlan: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un plan tarifaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotelData?.ratePlans
                          .filter(plan => {
                            if (!simulationForm.partner || !simulationForm.roomType) return false;
                            const partner = partners.find(p => p.name === simulationForm.partner);
                            if (!partner) return false;
                            
                            // Exact match with partner codes
                            const hasCode = partner.codes.includes(plan.code);
                            
                            // Check if pricing data exists for this combination
                            const hasData = hotelData.pricing.some(p => 
                              p.roomType === simulationForm.roomType && 
                              p.ratePlan === plan.code
                            );
                            
                            console.log(`Plan ${plan.code}: hasCode=${hasCode}, hasData=${hasData}`);
                            return hasCode && hasData;
                          })
                          .map((plan) => (
                            <SelectItem key={plan.code} value={plan.code}>
                              {plan.name} ({plan.code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sim-start-date">Date de début</Label>
                    <Input
                      id="sim-start-date"
                      type="date"
                      value={simulationForm.startDate}
                      onChange={(e) => setSimulationForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sim-end-date">Date de fin</Label>
                    <Input
                      id="sim-end-date"
                      type="date"
                      value={simulationForm.endDate}
                      onChange={(e) => setSimulationForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button onClick={simulateReservation} className="w-full flex items-center justify-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Simuler la Réservation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Résultats de simulation */}
            {simulationResults.length > 0 && (
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Simulation : {simulationResults[0]?.roomType}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Source: {hotelData?.hotelName} - {new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Button onClick={exportResults} className="bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Date</TableHead>
                          <TableHead>Prix Brut (€)</TableHead>
                          <TableHead>Prix Net (€)</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Disponibilité</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulationResults.map((result, index) => {
                          // Create date range from start to end date
                          const dates = [];
                          const start = new Date(result.startDate);
                          const end = new Date(result.endDate);
                          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            dates.push(new Date(d).toLocaleDateString('fr-FR', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            }));
                          }
                          
                          return dates.map((date, dateIndex) => (
                            <TableRow key={`${index}-${dateIndex}`}>
                              <TableCell className="font-medium">{date}</TableCell>
                              <TableCell>{result.price.toFixed(2)} €</TableCell>
                              <TableCell className="text-blue-600 font-medium">{result.netPrice.toFixed(2)} €</TableCell>
                              <TableCell>{result.available ? "3" : "0"}</TableCell>
                              <TableCell>
                                {result.available ? (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Non disponible
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ));
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary Section */}
                  <div className="mt-6 space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="applyCommission"
                        checked={applyCommission}
                        onCheckedChange={(checked) => setApplyCommission(!!checked)}
                      />
                      <Label htmlFor="applyCommission" className="text-sm">
                        Appliquer commission ({simulationResults[0]?.partner} ({simulationResults[0]?.commission}%))
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Remise promotionnelle (%):</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={promotionalDiscount}
                        onChange={(e) => setPromotionalDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4 bg-muted/30 p-4 rounded">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Sous-Total Brut:</div>
                        <div className="text-lg font-bold">
                          {simulationResults.reduce((sum, result) => sum + result.price, 0).toFixed(2)} €
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-red-600">Total Commission:</div>
                        <div className="text-lg font-bold text-red-600">
                          -{simulationResults.reduce((sum, result) => {
                            const priceAfterCommission = result.price * (result.commission / 100);
                            return sum + priceAfterCommission;
                          }, 0).toFixed(2)} €
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-600 font-medium">Total Net Final:</div>
                        <div className="text-xl font-bold text-blue-600">
                          {simulationResults.reduce((sum, result) => sum + result.netPrice, 0).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vérification des Disponibilités */}
          <TabsContent value="availability" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Vérification des Disponibilités
                </CardTitle>
                <CardDescription>
                  Consultez les disponibilités en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="avail-start-date">Date de début</Label>
                    <Input
                      id="avail-start-date"
                      type="date"
                      value={availabilityForm.startDate}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avail-end-date">Date de fin</Label>
                    <Input
                      id="avail-end-date"
                      type="date"
                      value={availabilityForm.endDate}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Types de chambres</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allRoomTypes = hotelData?.roomTypes.map(room => room.name) || [];
                        setAvailabilityForm(prev => ({
                          ...prev,
                          roomTypes: prev.roomTypes.length === allRoomTypes.length ? [] : allRoomTypes
                        }));
                      }}
                      className="text-blue-600"
                    >
                      {availabilityForm.roomTypes.length === hotelData?.roomTypes.length ? "Tout désélectionner" : "Tout sélectionner"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hotelData?.roomTypes.map((room) => (
                      <div key={room.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={room.code}
                          checked={availabilityForm.roomTypes.includes(room.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAvailabilityForm(prev => ({
                                ...prev,
                                roomTypes: [...prev.roomTypes, room.name]
                              }));
                            } else {
                              setAvailabilityForm(prev => ({
                                ...prev,
                                roomTypes: prev.roomTypes.filter(rt => rt !== room.name)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={room.code} className="text-sm">
                          {room.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={checkAvailability} className="w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Vérifier les Disponibilités
                </Button>
              </CardContent>
            </Card>

            {/* Résultats de disponibilité */}
            {availabilityResults.length > 0 && (
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Tableau des Disponibilités</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Source: FOLKESTONE OPERA - {new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-gray-300 p-3 text-left font-medium">Type de Chambre</th>
                          {availabilityResults.slice(0, 7).map((result) => (
                            <th key={result.date} className="border border-gray-300 p-3 text-center font-medium">
                              {new Date(result.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hotelData?.roomTypes.map((room) => (
                          <tr key={room.code} className="hover:bg-muted/50">
                            <td className="border border-gray-300 p-3 font-medium">
                              {room.name}
                            </td>
                            {availabilityResults.slice(0, 7).map((result) => {
                              const data = result.roomTypes[room.name];
                              const available = data?.available || 0;
                              return (
                                <td key={result.date} className="border border-gray-300 p-3 text-center">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded text-white text-sm font-bold ${
                                    available >= 3 ? 'bg-green-500' :
                                    available >= 1 ? 'bg-orange-400' :
                                    'bg-red-500'
                                  }`}>
                                    {available}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Analytics & Reporting
                </CardTitle>
                <CardDescription>
                  Tableau de bord analytique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fonctionnalité analytics en cours de développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analyse des Disparités de Prix */}
          <TabsContent value="price-analytics" className="space-y-4">
            <PriceAnalytics hotelData={hotelData} />
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres des Partenaires
                </CardTitle>
                <CardDescription>
                  Configuration des commissions et codes des partenaires OTA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partners.map((partner, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{partner.name}</h4>
                        <Badge variant="secondary">{partner.commission}% commission</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {partner.codes.map((code, codeIndex) => (
                          <Badge key={codeIndex} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};