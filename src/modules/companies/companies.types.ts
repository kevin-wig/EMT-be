export interface ICompaniesFilterQuery {
  search: string;
  sortBy: string;
  order: 'DESC' | 'ASC';
  page: string;
  perPage: string;
}
