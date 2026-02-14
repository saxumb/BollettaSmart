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
  slot: string;
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
  timeSlots?: TimeSlotDetail[];
  summary: string;
  unitPrice?: number;
  fixedFeeMonthly?: number;
  totalConsumption?: number;
  consumptionUnit?: string;
  billingMonths?: number;
}

export const AnalysisStatus = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
} as const;

export type AnalysisStatusType = typeof AnalysisStatus[keyof typeof AnalysisStatus];