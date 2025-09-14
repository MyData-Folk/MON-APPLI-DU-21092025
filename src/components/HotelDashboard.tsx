import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Settings, 
  Calendar, 
  Users, 
  BarChart3, 
  Download,
  Hotel,
  CheckSquare,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const HotelDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("control");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Fichier uploadé",
        description: `Planning ${file.name} chargé avec succès`,
      });
    }
  };

  const simulateReservation = () => {
    toast({
      title: "Simulation en cours",
      description: "Vérification des disponibilités...",
    });
  };

  const checkAvailability = () => {
    toast({
      title: "Vérification des disponibilités",
      description: "Analyse des créneaux disponibles...",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-gradient-primary text-white shadow-elegant">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <Hotel className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Tableau de Bord Hôtelier</h1>
              <p className="text-white/80 mt-1">Simulez une réservation ou vérifiez vos disponibilités</p>
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
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Panneau de Contrôle
                </CardTitle>
                <CardDescription>
                  Importez votre planning Excel et configurez vos paramètres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Charger un planning Excel</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Réinitialiser
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">OTA Actifs</Badge>
                      <p className="text-2xl font-bold text-primary">3</p>
                      <p className="text-sm text-muted-foreground">Partenaires connectés</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">Réservations</Badge>
                      <p className="text-2xl font-bold text-success">14,609</p>
                      <p className="text-sm text-muted-foreground">Total réservations</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">Types chambres</Badge>
                      <p className="text-2xl font-bold text-accent">12</p>
                      <p className="text-sm text-muted-foreground">Configurations actives</p>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
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
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les partenaires" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les partenaires</SelectItem>
                        <SelectItem value="agoda">Agoda (6144)</SelectItem>
                        <SelectItem value="booking">Booking.com (6562)</SelectItem>
                        <SelectItem value="expedia">Expedia (1903)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type de chambre</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une chambre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Chambre Standard</SelectItem>
                        <SelectItem value="deluxe">Chambre Deluxe</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan tarifaire</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Plan Basic</SelectItem>
                        <SelectItem value="premium">Plan Premium</SelectItem>
                        <SelectItem value="flex">Plan Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date d'arrivée</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de départ</Label>
                    <Input type="date" />
                  </div>
                </div>

                <Button 
                  onClick={simulateReservation}
                  className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-300"
                  size="lg"
                >
                  Simuler la Réservation
                </Button>
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
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Types de chambres</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      Standard
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      Deluxe
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      Suite
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      Suite Présidentielle
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={checkAvailability}
                    className="flex-1 bg-gradient-primary hover:shadow-hover transition-all duration-300"
                    size="lg"
                  >
                    Vérifier les Disponibilités
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux d'occupation</p>
                    <p className="text-2xl font-bold">87%</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenus mensuel</p>
                    <p className="text-2xl font-bold">€125k</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Séjour moyen</p>
                    <p className="text-2xl font-bold">3.2 jours</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Hotel className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chambres libres</p>
                    <p className="text-2xl font-bold">23</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Répartition par Partenaires OTA</CardTitle>
                <CardDescription>
                  Performance des différentes plateformes de réservation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span>Booking.com</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">6,562 réservations</p>
                      <p className="text-sm text-muted-foreground">45%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span>Agoda</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">6,144 réservations</p>
                      <p className="text-sm text-muted-foreground">42%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-success rounded-full"></div>
                      <span>Expedia</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">1,903 réservations</p>
                      <p className="text-sm text-muted-foreground">13%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};