export interface ServiceCategory {
  id: string;
  name: string;
  position: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  position: number;
  category_id: string | null;
  duration: number | null;
  description: string | null;
  price_from: boolean;
}
