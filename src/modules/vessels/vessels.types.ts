export interface IVesselSearchQuery {
  name: string;
  company: string;
  fleet: string;
}

export interface IVesselTripQuery {
  fromDate: string;
  toDate: string;
  originPort: number;
  destinationPort: number;
}

export interface IVesselsFilter {
  year: string;
  search: string;
  company: string;
  sortBy: string;
  order: 'DESC' | 'ASC';
  page: string;
  perPage: string;
  fuel: string;
  fleet: string;
  category: string;
}
