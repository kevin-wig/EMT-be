import { BasicPaginationDto } from './success-response.dto';

export class ListDto<T> extends BasicPaginationDto {
  listData: T[];
}
