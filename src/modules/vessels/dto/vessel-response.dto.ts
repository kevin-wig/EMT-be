import {
  ListSuccessResponseDto,
  SuccessResponseDto,
} from '../../../shared/dtos/success-response.dto';
import { Vessel } from '../entities/vessel.entity';
import { Port } from '../entities/port.entity';
import { Fuel } from '../entities/fuel.entity';
import { GraphLevel } from '../../../shared/constants/global.constants';

export class VesselResponseDto extends SuccessResponseDto<Vessel> {}

export class VesselsResponseDto extends SuccessResponseDto<Vessel[]> {}

export class VesselsListResponseDto extends ListSuccessResponseDto<Vessel[]> {}

export class PortsResponseDto extends SuccessResponseDto<Port[]> {}

export class FuelsResponseDto extends SuccessResponseDto<Fuel[]> {}

export class VesselTypeResponseDto extends SuccessResponseDto<any> {}

export interface CIIReportResponse {
  totalEmissions: number;
  year: number;
  chartData: {
    id: number;
    name: string;
    data: { key: string; cii: number }[];
    year?: number;
  }[];
  chartLevel: GraphLevel;
}

export interface ETSReportResponse {
  totalEmissions: number;
  totalEts: number;
  totalEuaCost: number;
  totalEuEmissions: number;
  year: number;
  chartData: {
    id: number;
    name: string;
    year: number;
    euaCost: number;
    ets: number;
    emissions: number;
  }[];
  chartLevel: GraphLevel;
}

export interface GHGReportResponse {
  excessComplianceUnits: number;
  excessVesselCount: number;
  penaltyVesselCount: number;
  totalNetComplianceUnits: number;
  year: number;
  totalPenalties: number;
  chartData: {
    id: number;
    name: string;
    year: number;
    attained: number;
    hasPenalty: number;
    excess: number;
    missing: number;
    netComplianceUnits: number;
    required: number;
  }[];
  chartLevel: GraphLevel;
}
