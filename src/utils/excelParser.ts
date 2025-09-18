import { HotelData, RoomType, RatePlan, AvailabilityData, PricingData } from '@/types/hotel';

export class ExcelParser {
  static parseHotelData(data: any[][]): HotelData {
    if (!data || data.length < 2) {
      throw new Error('Données Excel invalides');
    }

    // Première ligne contient le nom de l'hôtel et les dates
    const headerRow = data[0];
    const hotelName = this.extractHotelName(headerRow[0] || '');
    const dates = this.extractDates(headerRow.slice(3));

    // Extraction des types de chambres et plans tarifaires
    const roomTypes = new Map<string, RoomType>();
    const ratePlans = new Map<string, RatePlan>();
    const availability: AvailabilityData[] = [];
    const pricing: PricingData[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 4) continue;

      const roomTypeName = row[0]?.toString().trim();
      const ratePlanInfo = row[1]?.toString().trim();
      const dataType = row[2]?.toString().trim();

      if (!roomTypeName) continue;

      // Ajouter le type de chambre
      if (!roomTypes.has(roomTypeName)) {
        roomTypes.set(roomTypeName, {
          code: this.generateCode(roomTypeName),
          name: roomTypeName,
          description: roomTypeName
        });
      }

      // Parser les plans tarifaires
      if (ratePlanInfo && ratePlanInfo !== 'Left for sale') {
        const ratePlanCode = ratePlanInfo.split(' - ')[0] || ratePlanInfo;
        const ratePlanName = ratePlanInfo.split(' - ')[1] || ratePlanInfo;
        
        if (!ratePlans.has(ratePlanCode)) {
          ratePlans.set(ratePlanCode, {
            code: ratePlanCode,
            name: ratePlanName,
            description: ratePlanName,
            commission: this.extractCommission(ratePlanCode)
          });
        }
      }

      // Parser les données de disponibilité et prix
      const values = row.slice(3);
      dates.forEach((date, index) => {
        if (index < values.length && values[index] !== undefined) {
          const value = values[index];
          
          console.log(`Processing row ${i}, date ${date}, dataType: ${dataType}, value: ${value}`);
          
          if (dataType === 'Left for sale') {
            // Données de disponibilité
            const available = this.parseAvailability(value);
            console.log(`Availability for ${roomTypeName} on ${date}: ${available}`);
            availability.push({
              roomType: roomTypeName,
              date: date,
              available: available,
              status: available === 0 ? 'sold-out' : available > 0 ? 'available' : 'closed'
            });
          } else if (dataType === 'Price (EUR)' && ratePlanInfo) {
            // Données de prix
            const price = parseFloat(value?.toString().replace(',', '.') || '0');
            if (price > 0) {
              console.log(`Price for ${roomTypeName}, ${ratePlanInfo} on ${date}: ${price}`);
              pricing.push({
                roomType: roomTypeName,
                ratePlan: ratePlanInfo.split(' - ')[0],
                date: date,
                price: price,
                currency: 'EUR'
              });
            }
          }
        }
      });
    }

    return {
      hotelName,
      roomTypes: Array.from(roomTypes.values()),
      ratePlans: Array.from(ratePlans.values()),
      dates,
      availability,
      pricing
    };
  }

  private static extractHotelName(headerCell: string): string {
    // Extrait le nom de l'hôtel de la première cellule
    const match = headerCell.match(/([A-Z\s]+)/);
    return match ? match[1].trim() : 'Hôtel';
  }

  private static extractDates(dateRow: any[]): string[] {
    const dates: string[] = [];
    dateRow.forEach(cell => {
      if (cell) {
        const dateStr = cell.toString();
        console.log('Processing date cell:', dateStr);
        
        // Conversion des dates M/D/YY vers YYYY-MM-DD
        if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
          const [month, day, year] = dateStr.split('/');
          let fullYear = parseInt(year);
          if (fullYear < 100) {
            fullYear = fullYear < 50 ? 2000 + fullYear : 1900 + fullYear;
          }
          const formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          dates.push(formattedDate);
          console.log('Converted date:', formattedDate);
        } else {
          console.log('Date format not recognized:', dateStr);
        }
      }
    });
    console.log('Final extracted dates:', dates);
    return dates;
  }

  private static parseAvailability(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (value === 'X' || value === 'x') return -1; // Fermé
    
    // Conversion de string en nombre
    const strValue = value.toString().trim();
    if (strValue === '') return 0;
    
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : Math.floor(num); // Arrondir vers le bas pour avoir un entier
  }

  private static generateCode(name: string): string {
    return name.toUpperCase()
      .replace(/[ÀÁÂÃÄÅ]/g, 'A')
      .replace(/[ÈÉÊË]/g, 'E')
      .replace(/[ÌÍÎÏ]/g, 'I')
      .replace(/[ÒÓÔÕÖ]/g, 'O')
      .replace(/[ÙÚÛÜ]/g, 'U')
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 20);
  }

  private static extractCommission(ratePlanCode: string): number {
    // Extraction des commissions basées sur les codes des plans tarifaires
    const commissionMap: { [key: string]: number } = {
      'OTA': 15,
      'MOBILE': 12,
      'VIP': 10,
      'HB': 18,
      'TO': 20,
      'HOTUSA': 16,
      'FB-CORPO': 8,
      'CWT': 12,
      'PKG-EXP': 14,
      'PROMO': 10,
      'TRAVCO': 22
    };

    for (const [prefix, commission] of Object.entries(commissionMap)) {
      if (ratePlanCode.startsWith(prefix)) {
        return commission;
      }
    }
    return 15; // Commission par défaut
  }
}