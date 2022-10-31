export interface IFleetsFilterQuery {
  name: string;
  search: string;
  company: string;
  sortBy: string;
  order: 'DESC' | 'ASC';
  page: string;
  perPage: string;
}
