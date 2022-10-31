export const DEFAULT_WORKSHEET_NAME = 'Worksheet';

export const FLEET_HEADER = [
  { label: 'Filter', key: 'key' },
  { label: 'Value', key: 'value' },
];

export const BASIC_VESSEL_HEADER = [
  { label: 'Name', key: 'name' },
  { label: 'IMO', key: 'imo' },
  { label: 'Fleet', key: 'fleet' },
];

export const CII_REPORT_HEADER = [
  { label: 'Name', key: 'name' },
  { label: 'Key', key: 'key' },
  { label: 'CII', key: 'cii' },
];

export const ETS_REPORT_HEADER = [
  { label: 'Name', key: 'name' },
  { label: 'Year', key: 'year' },
  { label: 'ETS', key: 'ets' },
  { label: 'EUA Cost', key: 'euaCost' },
  { label: 'Emissions', key: 'emissions' },
];

export const ETS_REPORT_KPI = [
  { label: 'Total Emissions', key: 'totalEmissions' },
  { label: 'Total ETS', key: 'totalEts' },
  { label: 'Total EU Emissions', key: 'totalEuEmissions' },
  { label: 'Total EUA Cost', key: 'totalEuaCost' },
];

export const GHG_REPORT_HEADER = [
  { label: 'Name', key: 'name' },
  { label: 'Year', key: 'year' },
  { label: 'GHGs target ', key: 'required' },
  { label: 'GHGs target actual', key: 'attained' },
];

export const GHG_REPORT_KPI = [
  { label: 'Net compliance units', key: 'totalNetComplianceUnits' },
  {
    label: 'Vessels with excess compliance units',
    key: 'excessComplianceUnits',
  },
  { label: 'Vessels with penalties', key: 'penaltyVesselCount' },
  { label: 'Total Penalties', key: 'totalPenalties' },
];

export const VESSEL_TRIPS_CII_HEADER = [
  { label: 'Vessel Name', key: 'vesselName' },
  { label: 'Voyage', key: 'voyageId' },
  { label: 'Predicted or Actual', key: 'status' },
  { label: 'CO2 Emissions', key: 'co2Emissions' },
  { label: 'CII', key: 'cii' },
  { label: 'CII Required', key: 'ciiRequired' },
  { label: 'CII / Required', key: 'ciiRate' },
  { label: 'Category', key: 'category' },
  { label: 'From', key: 'fromDate' },
  { label: 'To', key: 'toDate' },
];

export const VESSEL_TRIPS_ETS_HEADER = [
  { label: 'Vessel Name', key: 'vesselName' },
  { label: 'Voyage', key: 'voyageId' },
  { label: 'Predicted or Actual', key: 'status' },
  { label: 'CO2 Emissions inbound', key: 'co2InboundEu' },
  { label: 'CO2 Emissions outbound', key: 'co2OutboundEu' },
  { label: 'CO2 Emissions within EU', key: 'co2withinEu' },
  { label: 'CO2 Emissions at Port', key: 'co2EuPort' },
  { label: 'CO2 Emissions', key: 'totalCo2Emission' },
  { label: 'EUA Cost', key: 'euaCost' },
  { label: 'EUA Cost as a % of freight profit', key: 'fpPercent' },
  { label: 'EUA Cost as a % of bunkering cost', key: 'bcPercent' },
  { label: 'From', key: 'fromDate' },
  { label: 'To', key: 'toDate' },
];

export const CII_HEADER = [
  { label: 'Emissions', key: 'emissions' },
  { label: 'CII', key: 'cii' },
  { label: 'Required', key: 'requiredCII' },
  { label: 'CII/Required', key: 'ciiRate' },
  { label: 'Category', key: 'category' },
];

export const ETS_HEADER = [
  { label: 'EUA Cost', key: 'euaCost' },
  { label: 'EUA Cost as % of Bunker Cost', key: 'bcPercent' },
  { label: "EUA Cost as % of Company's Fares", key: 'fpPercent' },
];

export const ETS_HEADER_PER_VOYAGE = [
  { label: 'CO2 Emission', key: 'totalCo2Emission' },
  { label: 'CO2 ETS', key: 'totalCo2Ets' },
  { label: 'EUA Cost', key: 'euaCost' },
  { label: 'EUA Cost as % of Bunker Cost', key: 'bcPercent' },
  { label: "EUA Cost as % of Company's Fares", key: 'fpPercent' },
];

export const VESSEL_STRUCTURE_SAMPLE = [
  { key: 'name', label: 'Name of Vessel', position: [1, 1] },
  { key: 'imo', label: 'IMO', position: [1, 2] },
  { key: 'email', label: 'Contact email address', position: [1, 3] },
  { key: 'gross_tonnage', label: 'Gross Tonnage', position: [1, 4] },
  { key: 'company', label: 'Company', position: [1, 5] },
  { key: 'power_output', label: 'Power Output', position: [1, 6], type: 'float' },
  { key: 'fleet', label: 'Fleet', position: [1, 7] },
  { key: 'propulsion_power', label: 'Main propulsion power', position: [1, 8] },
  { key: 'vessel_type', label: 'Vessel type', position: [1, 9] },
  { key: 'date_of_built', label: 'Date built', position: [1, 10], type: 'date' },
  { key: 'net_tonnage', label: 'Net Tonnage', position: [1, 11] },
  { key: 'ice_class', label: 'Ice Class', position: [1, 12] },
  { key: 'dwt', label: 'DWT', position: [1, 13], type: 'float' },
  { key: 'eedi', label: 'EEDI', position: [1, 14], type: 'float' },
  { key: 'eexi', label: 'EEXI', position: [1, 15], type: 'float' },
];

export const VESSEL_TRIP_STRUCTURE_SAMPLE = [
  { label: 'Vessel Name', key: 'vesselName', position: [1, 1] },
  { label: 'Port From', key: 'originPort', position: [1, 2] },
  { label: 'Date from (dd/mm/yyyy)', key: 'fromDate', position: [1, 3] },
  { label: 'Port To', key: 'destinationPort', position: [1, 4] },
  { label: 'Date to (dd/mm/yyyy)', key: 'toDate', position: [1, 5] },
  {
    label: 'Distance Travelled (n.m)',
    key: 'distanceTraveled',
    position: [1, 6],
  },
  { label: 'Hours Underway (hh:mm)', key: 'hoursUnderway', position: [1, 7] },
  { label: 'MGO', key: 'mgo', position: [2, 8] },
  { label: 'LFO', key: 'lfo', position: [2, 9] },
  { label: 'HFO', key: 'hfo', position: [2, 10] },
  { label: 'VLSFO', key: 'vlsfo', position: [2, 11] },
  { label: 'LNG', key: 'lng', position: [2, 12] },
];

export const VESSEL_JOURNEY_STRUCTURE_SAMPLE = [
  { label: 'Vessel Name', key: 'vessel', position: [1, 1] },
  { label: 'IMO Number', key: 'imo', position: [1, 2] },
  { label: 'Origin Port', key: 'originPort', position: [1, 3] },
  { label: 'Destination Port', key: 'destinationPort', position: [1, 4] },
  { label: 'Departure Date', key: 'fromDate', position: [1, 5] },
  { label: 'Arrival Date', key: 'toDate', position: [1, 6] },
  { label: 'Nautical Miles', key: 'distanceTraveled', position: [1, 7] },
  { label: 'MGO (tn)', key: 'mgo', position: [1, 8] },
  { label: 'LFO (tn)', key: 'lfo', position: [1, 9] },
  { label: 'HFO (tn)', key: 'hfo', position: [1, 10] },
  { label: 'VLSFO (tn)', key: 'vlsfo', position: [1, 11] },
  { label: 'LNG (tn)', key: 'lng', position: [1, 12] },
  { label: 'LPG (Propane)', key: 'lpg_propane', position: [1, 13] },
  { label: 'LPG (Butane)', key: 'lpg_butane', position: [1, 14] },
  { label: 'Fuel Cost', key: 'fuelCost', position: [1, 15] },
  { label: 'Bunker Cost', key: 'bunkerCost', position: [1, 16] },
  { label: 'Freight Charges', key: 'freightCharges', position: [1, 17] },
];


export const VESSEL_VOYAGE_STRUCTURE_SAMPLE = [
  { label: 'Voyage ID', key: 'voyageId', position: [1, 1], type: 'string' },
  { label: 'Vessel IMO', key: 'imo', position: [1, 2], type: 'string' },
  { label: 'Origin Port', key: 'originPort', position: [1, 3], type: 'string' },
  { label: 'Destination Port', key: 'destinationPort', position: [1, 4], type: 'string' },
  { label: 'Departure Date', key: 'fromDate', position: [1, 5], type: 'date' },
  { label: 'Arrival Date', key: 'toDate', position: [1, 6], type: 'date' },
  { label: 'Nautical Miles', key: 'distanceTraveled', position: [1, 7], type: 'float' },
  { label: 'Freight Profit ($)', key: 'freightProfit', position: [1, 8], type: 'float' },
  { label: 'Bunker Cost', key: 'bunkerCost', position: [1, 9], type: 'string' },
  { label: 'MGO (mt)', key: 'mgo', position: [1, 10], type: 'float' },
  { label: 'LFO (mt)', key: 'lfo', position: [1, 11], type: 'float' },
  { label: 'HFO (mt)', key: 'hfo', position: [1, 12], type: 'float' },
  { label: 'VLSFO (DMX to DMB)', key: 'vlsfoAD', position: [1, 13], type: 'float' },
  { label: 'VLSFO (RMA to RMD)', key: 'vlsfoEK', position: [1, 14], type: 'float' },
  { label: 'VLSFO (RME to RMK)', key: 'vlsfoXB', position: [1, 15], type: 'float' },
  { label: 'LNG (mt)', key: 'lng', position: [1, 16], type: 'float' },
  { label: 'BioFuels (mt)', key: 'bioFuel', position: [1, 17], type: 'float' },
];
