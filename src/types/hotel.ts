export interface HotelData {
  hotelName: string;
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  dates: string[];
  availability: AvailabilityData[];
  pricing: PricingData[];
}

export interface RoomType {
  code: string;
  name: string;
  description?: string;
}

export interface RatePlan {
  code: string;
  name: string;
  description?: string;
  commission?: number;
}

export interface AvailabilityData {
  roomType: string;
  date: string;
  available: number;
  status: 'available' | 'closed' | 'sold-out';
}

export interface PricingData {
  roomType: string;
  ratePlan: string;
  date: string;
  price: number;
  currency: string;
}

export interface Partner {
  name: string;
  commission: number;
  codes: string[];
}

export interface SimulationResult {
  roomType: string;
  ratePlan: string;
  partner: string;
  startDate: string;
  endDate: string;
  price: number;
  commission: number;
  netPrice: number;
  available: boolean;
}

export interface AvailabilityResult {
  date: string;
  roomTypes: {
    [roomType: string]: {
      available: number;
      status: 'available' | 'closed' | 'sold-out';
    };
  };
}