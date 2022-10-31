export class TableHeaderCellDto {
  key: string | number;

  label: string | number;
}

export interface TableBodyCellDto {
  [key: string]: string | number;
}

export interface FilterDto {
  company?: string;
  search?: string;
  fuel?: string;
  category?: string;
  year?: number;
  fleet?: string;
  vesselAge?: number[];
  eexi?: number;
  eedi?: number;
  dwt?: string;
  grossTonnage?: number;
  netTonnage?: number;
  iceClass?: string;
  propulsionPower?: number;
}
