export interface ISearchQuery {
  name: string;
  company: string;
  search: string;
  sortBy: string;
  order: 'DESC' | 'ASC';
  page: string;
  limit: string;
}

export interface UserPayload {
  email: string;
  id: number;
  role: string;
}
