export class WhereDto {
  whereCondition: string;

  whereParams: {
    [key: string]: string | number;
  };
}
