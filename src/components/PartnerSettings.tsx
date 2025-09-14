import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Partner } from "@/types/hotel";

interface PartnerSettingsProps {
  partners: Partner[];
  onPartnersChange: (partners: Partner[]) => void;
}

export const PartnerSettings = ({ partners, onPartnersChange }: PartnerSettingsProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    commission: 15,
    codes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nom requis",
        description: "Veuillez saisir le nom du partenaire",
      });
      return;
    }

    const newPartner: Partner = {
      name: formData.name.trim(),
      commission: formData.commission,
      codes: formData.codes.split(',').map(code => code.trim()).filter(code => code)
    };

    if (editingPartner) {
      // Modification
      const updatedPartners = partners.map(p => 
        p.name === editingPartner.name ? newPartner : p
      );
      onPartnersChange(updatedPartners);
      toast({
        title: "Partenaire modifié",
        description: `${newPartner.name} a été mis à jour`,
      });
    } else {
      // Ajout
      if (partners.some(p => p.name === newPartner.name)) {
        toast({
          variant: "destructive",
          title: "Partenaire existant",
          description: "Un partenaire avec ce nom existe déjà",
        });
        return;
      }
      
      onPartnersChange([...partners, newPartner]);
      toast({
        title: "Partenaire ajouté",
        description: `${newPartner.name} a été ajouté avec succès`,
      });
    }

    resetForm();
    setOpen(false);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      commission: partner.commission,
      codes: partner.codes.join(', ')
    });
    setOpen(true);
  };

  const handleDelete = (partnerName: string) => {
    const updatedPartners = partners.filter(p => p.name !== partnerName);
    onPartnersChange(updatedPartners);
    toast({
      title: "Partenaire supprimé",
      description: `${partnerName} a été supprimé`,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      commission: 15,
      codes: ""
    });
    setEditingPartner(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configuration des Partenaires OTA
            </CardTitle>
            <CardDescription>
              Gérez vos partenaires et leurs commissions
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un partenaire
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? 'Modifier le partenaire' : 'Ajouter un partenaire'}
                </DialogTitle>
                <DialogDescription>
                  Configurez les informations du partenaire OTA
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="partner-name">Nom du partenaire</Label>
                  <Input
                    id="partner-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Ex: Booking.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="partner-commission">Commission (%)</Label>
                  <Input
                    id="partner-commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission}
                    onChange={(e) => setFormData(prev => ({...prev, commission: parseFloat(e.target.value) || 0}))}
                    placeholder="15"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="partner-codes">Codes tarifaires (séparés par des virgules)</Label>
                  <Textarea
                    id="partner-codes"
                    value={formData.codes}
                    onChange={(e) => setFormData(prev => ({...prev, codes: e.target.value}))}
                    placeholder="OTA-RO-FLEX, OTA-RO-NANR, OTA-BB-FLEX"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Listez les codes des plans tarifaires associés à ce partenaire
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingPartner ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {partners.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun partenaire configuré. Ajoutez votre premier partenaire pour commencer.
            </p>
          ) : (
            partners.map((partner) => (
              <div key={partner.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{partner.name}</h4>
                      <Badge variant="secondary">
                        {partner.commission}% commission
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {partner.codes.length > 0 ? (
                        partner.codes.map((code, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Aucun code tarifaire
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(partner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(partner.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};