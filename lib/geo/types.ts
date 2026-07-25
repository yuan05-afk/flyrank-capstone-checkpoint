export type GeoResult = {
  enriched: true;
  provider: string;
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
};

export type GeoMiss = { enriched: false; reason?: string };

export type GeoLookup = GeoResult | GeoMiss;

export interface GeoProvider {
  name: string;
  lookup(ip: string): Promise<GeoResult>;
}
