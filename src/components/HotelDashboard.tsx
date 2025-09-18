import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Calculator
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HotelData, Partner, SimulationResult, AvailabilityResult } from "@/types/hotel";
import { ExcelParser } from "@/utils/excelParser";

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
      
      // Convertir la configuration en partenaires
      const newPartners: Partner[] = Object.entries(config.partners).map(([name, data]: [string, any]) => ({
        name,
        commission: data.commission,
        codes: data.codes
      }));
      
      setPartners(newPartners);

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

    // Simulation de réservation basée sur les vraies données
    const partner = partners.find(p => p.name === simulationForm.partner);
    const pricing = hotelData.pricing.filter(p => 
      p.roomType === simulationForm.roomType && 
      p.ratePlan === simulationForm.ratePlan &&
      p.date >= simulationForm.startDate &&
      p.date <= simulationForm.endDate
    );

    const results: SimulationResult[] = pricing.map(p => ({
      roomType: p.roomType,
      ratePlan: p.ratePlan,
      partner: simulationForm.partner,
      startDate: simulationForm.startDate,
      endDate: simulationForm.endDate,
      price: p.price,
      commission: partner?.commission || 15,
      netPrice: p.price * (1 - (partner?.commission || 15) / 100),
      available: true // Simplification - vérifier les disponibilités réelles
    }));

    setSimulationResults(results);
    toast({
      title: "Simulation terminée",
      description: `${results.length} résultats trouvés`,
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

    // Génération des dates entre start et end
    const startDate = new Date(availabilityForm.startDate);
    const endDate = new Date(availabilityForm.endDate);
    const results: AvailabilityResult[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const roomTypes: { [key: string]: any } = {};

      selectedRoomTypes.forEach(roomType => {
        const availability = hotelData.availability.find(a => 
          a.roomType === roomType && a.date === dateStr
        );
        roomTypes[roomType] = {
          available: availability?.available || 0,
          status: availability?.status || 'closed'
        };
      });

      results.push({ date: dateStr, roomTypes });
    }

    setAvailabilityResults(results);
    toast({
      title: "Vérification terminée",
      description: `Disponibilités analysées pour ${results.length} jours`,
    });
  }, [hotelData, availabilityForm, selectedRoomTypes, toast]);

  const resetData = useCallback(() => {
    setHotelData(null);
    setSimulationResults([]);
    setAvailabilityResults([]);
    setSimulationForm({
      partner: "",
      roomType: "",
      ratePlan: "",
      startDate: "",
      endDate: ""
    });
    setAvailabilityForm({
      startDate: "",
      endDate: "",
      roomTypes: []
    });
    toast({
      title: "Données réinitialisées",
      description: "Toutes les données ont été effacées",
    });
  }, [toast]);

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
          <div className="flex items-center gap-3">
            <Hotel className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">
                {hotelData ? hotelData.hotelName : "Tableau de Bord Hôtelier"}
              </h1>
              <p className="text-white/80 mt-1">
                {hotelData 
                  ? `${hotelData.roomTypes.length} types de chambres • ${hotelData.ratePlans.length} plans tarifaires`
                  : "Chargez votre planning Excel pour commencer"
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card shadow-card">
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
              Disponibilité
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Panneau de Contrôle */}
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Chargement des Données
                  </CardTitle>
                  <CardDescription>
                    Importez votre fichier Excel de planning hôtelier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="excel-file">Fichier Excel Planning</Label>
                      <Input
                        id="excel-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="config-file">Configuration OTA (JSON)</Label>
                      <Input
                        id="config-file"
                        type="file"
                        accept=".json"
                        onChange={handleConfigUpload}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={resetData}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </Button>
                      {configFile && (
                        <Badge variant="secondary" className="text-xs">
                          Config OTA chargée
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded">
                      <p className="text-lg font-bold text-primary">{partners.length}</p>
                      <p className="text-xs text-muted-foreground">Partenaires</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-lg font-bold text-success">{hotelData?.roomTypes.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Types chambres</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-lg font-bold text-accent">{hotelData?.ratePlans.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Plans tarifaires</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-lg font-bold text-warning">{hotelData?.dates.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Jours couverts</p>
                    </div>
                  </div>
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
                        <SelectValue placeholder="Choisir un partenaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map(partner => (
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
                      onValueChange={(value) => setSimulationForm(prev => ({...prev, roomType: value}))}
                      disabled={!hotelData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une chambre" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotelData?.roomTypes.map(roomType => (
                          <SelectItem key={roomType.code} value={roomType.code}>
                            {roomType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan tarifaire</Label>
                    <Select
                      value={simulationForm.ratePlan}
                      onValueChange={(value) => setSimulationForm(prev => ({...prev, ratePlan: value}))}
                      disabled={!hotelData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotelData?.ratePlans.map(ratePlan => (
                          <SelectItem key={ratePlan.code} value={ratePlan.code}>
                            {ratePlan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date d'arrivée</Label>
                    <Input 
                      type="date" 
                      value={simulationForm.startDate}
                      onChange={(e) => setSimulationForm(prev => ({...prev, startDate: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de départ</Label>
                    <Input 
                      type="date" 
                      value={simulationForm.endDate}
                      onChange={(e) => setSimulationForm(prev => ({...prev, endDate: e.target.value}))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={simulateReservation}
                  className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-300"
                  size="lg"
                  disabled={!hotelData || !simulationForm.partner || !simulationForm.roomType || !simulationForm.ratePlan}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Simuler la Réservation
                </Button>

                {/* Résultats de simulation */}
                {simulationResults.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Résultats de la Simulation</CardTitle>
                      <CardDescription>
                        Prix et commissions pour la période sélectionnée
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {simulationResults.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs">Prix brut</Label>
                                <p className="font-semibold">{result.price.toFixed(2)} €</p>
                              </div>
                              <div>
                                <Label className="text-xs">Commission</Label>
                                <p className="font-semibold">{result.commission}%</p>
                              </div>
                              <div>
                                <Label className="text-xs">Prix net</Label>
                                <p className="font-semibold text-success">{result.netPrice.toFixed(2)} €</p>
                              </div>
                              <div>
                                <Label className="text-xs">Statut</Label>
                                <Badge variant={result.available ? "default" : "destructive"}>
                                  {result.available ? "Disponible" : "Non disponible"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vérificateur de Disponibilité */}
          <TabsContent value="availability" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Vérificateur de Disponibilité
                </CardTitle>
                <CardDescription>
                  Analysez les disponibilités par période
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input 
                      type="date" 
                      value={availabilityForm.startDate}
                      onChange={(e) => setAvailabilityForm(prev => ({...prev, startDate: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input 
                      type="date" 
                      value={availabilityForm.endDate}
                      onChange={(e) => setAvailabilityForm(prev => ({...prev, endDate: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Types de chambres</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={selectAllRoomTypes}
                        disabled={!hotelData}
                      >
                        Tout sélectionner
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedRoomTypes([])}
                        disabled={!hotelData}
                      >
                        Tout désélectionner
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                    {hotelData?.roomTypes.length ? (
                      hotelData.roomTypes.map(roomType => (
                        <div key={roomType.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={roomType.code}
                            checked={selectedRoomTypes.includes(roomType.code)}
                            onCheckedChange={() => toggleRoomType(roomType.code)}
                          />
                          <Label 
                            htmlFor={roomType.code}
                            className="text-sm cursor-pointer"
                          >
                            {roomType.name}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground col-span-full text-center">
                        Chargez un fichier Excel pour voir les types de chambres
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={checkAvailability}
                    className="flex-1 bg-gradient-primary hover:shadow-hover transition-all duration-300"
                    size="lg"
                    disabled={!hotelData || !availabilityForm.startDate || !availabilityForm.endDate || selectedRoomTypes.length === 0}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Vérifier les Disponibilités
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                </div>

                {/* Résultats de disponibilité */}
                {availabilityResults.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Disponibilités</CardTitle>
                      <CardDescription>
                        Analyse des disponibilités pour la période sélectionnée
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Date</th>
                              {selectedRoomTypes.map(roomType => {
                                const roomTypeData = hotelData?.roomTypes.find(rt => rt.code === roomType);
                                return (
                                  <th key={roomType} className="text-center p-2">
                                    {roomTypeData?.name}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {availabilityResults.map((result, index) => (
                              <tr key={index} className="border-b hover:bg-muted/50">
                                <td className="p-2 font-medium">
                                  {new Date(result.date).toLocaleDateString('fr-FR')}
                                </td>
                                {selectedRoomTypes.map(roomType => {
                                  const roomData = result.roomTypes[roomType];
                                  const available = roomData?.available || 0;
                                  const status = roomData?.status || 'closed';
                                  
                                  return (
                                    <td key={roomType} className="text-center p-2">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`font-semibold ${
                                          status === 'available' ? 'text-success' :
                                          status === 'sold-out' ? 'text-destructive' : 
                                          'text-muted-foreground'
                                        }`}>
                                          {available === -1 ? 'X' : available}
                                        </span>
                                        <Badge 
                                          variant={
                                            status === 'available' ? 'default' :
                                            status === 'sold-out' ? 'destructive' : 
                                            'secondary'
                                          }
                                          className="text-xs"
                                        >
                                          {status === 'available' ? 'Libre' :
                                           status === 'sold-out' ? 'Complet' : 
                                           'Fermé'}
                                        </Badge>
                                      </div>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Données chargées</p>
                    <p className="text-2xl font-bold">{hotelData ? 'Oui' : 'Non'}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prix analysés</p>
                    <p className="text-2xl font-bold">{hotelData?.pricing.length || 0}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dates couvertes</p>
                    <p className="text-2xl font-bold">{hotelData?.dates.length || 0}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Hotel className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Simulations</p>
                    <p className="text-2xl font-bold">{simulationResults.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Partenaires OTA Configurés</CardTitle>
                <CardDescription>
                  Configuration des commissions par partenaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partners.map((partner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-primary' : 
                          index === 1 ? 'bg-accent' : 
                          'bg-success'
                        }`}></div>
                        <div>
                          <span className="font-medium">{partner.name}</span>
                          <p className="text-sm text-muted-foreground">
                            {partner.codes.length} codes tarifaires
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{partner.commission}%</p>
                        <p className="text-sm text-muted-foreground">Commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {hotelData && (
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Aperçu des Données</CardTitle>
                  <CardDescription>
                    Résumé des informations chargées depuis le fichier Excel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Types de Chambres</h4>
                      <div className="space-y-2">
                        {hotelData.roomTypes.slice(0, 5).map(roomType => (
                          <div key={roomType.code} className="flex justify-between text-sm">
                            <span>{roomType.name}</span>
                            <Badge variant="outline">{roomType.code}</Badge>
                          </div>
                        ))}
                        {hotelData.roomTypes.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... et {hotelData.roomTypes.length - 5} autres
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Plans Tarifaires</h4>
                      <div className="space-y-2">
                        {hotelData.ratePlans.slice(0, 5).map(ratePlan => (
                          <div key={ratePlan.code} className="flex justify-between text-sm">
                            <span className="truncate">{ratePlan.name}</span>
                            <Badge variant="outline">{ratePlan.commission || 15}%</Badge>
                          </div>
                        ))}
                        {hotelData.ratePlans.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... et {hotelData.ratePlans.length - 5} autres
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};