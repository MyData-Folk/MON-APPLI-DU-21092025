import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HotelData } from "@/types/hotel";
import { ExcelParser } from "@/utils/excelParser";

interface FileUploadProps {
  onDataLoaded: (data: HotelData) => void;
}

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast({
        variant: "destructive",
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier Excel (.xlsx)",
      });
      return;
    }

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const parsedData = ExcelParser.parseHotelData(data as any[][]);
      onDataLoaded(parsedData);

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
    } finally {
      setLoading(false);
    }
  }, [onDataLoaded, toast]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Importer le Planning Excel
        </CardTitle>
        <CardDescription>
          Chargez votre fichier Excel avec les données de planning hôtelier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {loading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Analyse du fichier en cours...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Glissez-déposez votre fichier Excel ici
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button type="button" className="w-full max-w-xs">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Sélectionner un fichier
                  </Button>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleInputChange}
                  className="sr-only"
                />
              </>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Format attendu</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Première ligne : nom de l'hôtel et dates</li>
                  <li>• Colonnes : types de chambres, plans tarifaires, prix</li>
                  <li>• Lignes "Left for sale" pour les disponibilités</li>
                  <li>• Lignes "Price (EUR)" pour les tarifs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};