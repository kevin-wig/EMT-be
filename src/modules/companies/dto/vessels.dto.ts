class VesselsTable {
  id: number;
  name: string;
  year: number;
  companyId: number;
  fleetId: number | null;
  fleet: string | null;
  imo: string;
  emissions: string;
}

export class VesselsCiiTable extends VesselsTable {
  distanceTraveled: number | null;
  company: string;
  cii: number;
  requiredCII: number;
  ciiRate: number;
  ciiDifference: number;
  category: 'A' | 'B' | 'C' | 'D' | 'E';
  cii2019: number;
  bunkerCost: number;
}

export class VesselsEtsTable extends VesselsTable {
  ets: null;
  euaCost: null;
  fpPercent: null;
  bcPercent: null;
  totalBunkerCost: 50000;
  freightProfit: 10000;
  imo: string;
}

export class VesselsGhgTable extends VesselsTable {
  attained: number;
  excess: number;
  required: number;
}
