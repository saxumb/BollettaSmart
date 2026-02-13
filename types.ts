
export interface BillCostBreakdown {
  category: string;
  amount: number;
}

export interface ConsumptionDetail {
  period: string;
  value: number;
  unit: string;
}

export interface TimeSlotDetail {
  slot: string; // e.g., "F1", "F2", "F3"
  value: number;
  unit: string;
}

export interface BillAnalysisResult {
  provider: string;
  totalAmount: number;
  currency: string;
  dueDate: string;
  billingPeriod: string;
  utilityType: 'Luce' | 'Gas' | 'Acqua' | 'Altro';
  costBreakdown: BillCostBreakdown[];
  consumptions: ConsumptionDetail[];
  timeSlots?: TimeSlotDetail[]; // New: Consumption breakdown by time slots
  summary: string;
  // New fields for simulation
  unitPrice?: number; // e.g., price per kWh or Smc
  fixedFeeMonthly?: number; // monthly fixed cost
  totalConsumption?: number; // total units consumed in this bill
  consumptionUnit?: string; // kWh, Smc, etc.
  billingMonths?: number; // number of months covered by the bill
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
