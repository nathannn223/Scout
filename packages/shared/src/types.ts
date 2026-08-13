export interface Identification {
  category: string | null;
  brand: string | null;
  description: string | null;
}

export interface MatchedProductDTO {
  id: string;
  merchantName: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
  inStock: boolean;
  source: "GOOGLE_SHOPPING" | "AWIN";
}

export interface ScanResponse {
  scan: {
    id: string;
    imageUrl: string;
    sourceUrl: string | null;
    createdAt: string;
  } & Identification;
  matches: MatchedProductDTO[];
  locked: boolean;
}
