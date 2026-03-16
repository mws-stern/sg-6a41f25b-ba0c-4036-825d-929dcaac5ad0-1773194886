export interface Employee {
  id: string;
  name: string;
  phone: string;
  hourly_rate: number;
  created_at: string;
  is_active?: boolean;
}

export interface ManualAdjustment {
  id: string;
  employee_id: string;
  adjustment_type: "manual_hours" | "pickup_trip" | "bonus" | "deduction";
  amount: number;
  hours?: number;
  reason: string;
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  created_at?: string;
  paid: boolean;
  employees?: {
    name: string;
    phone: string;
  };
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  hours_worked: number | null;
  earnings: number | null;
  paid?: boolean;
  created_at: string;
}

export interface PayrollPeriod {
  id: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
  created_at: string;
}

export interface PayrollEntry {
  id: string;
  employee_id: string;
  payroll_period_id: string;
  total_hours: number;
  gross_pay: number;
  custom_payment_amount?: number | null;
  check_number: string | null;
  paid_at: string | null;
  status: "pending" | "paid";
  created_at: string;
}

export interface ReportData {
  employee: Employee;
  entries: TimeEntry[];
  total_hours: number;
  total_earnings: number;
}

// New payroll system types
export interface EmployeePayrollBalance {
  id: string;
  employee_id: string;
  balance: number;
  last_updated: string;
}

export interface PayrollTransaction {
  id: string;
  employee_id: string;
  transaction_type: 'payment' | 'adjustment';
  date_range_start: string;
  date_range_end: string;
  hours_worked: number;
  amount_earned: number;
  amount_paid: number;
  balance_before: number;
  balance_after: number;
  notes?: string;
  transaction_date: string;
  created_at: string;
}

export interface PayrollSummary {
  employee: Employee;
  timeEntries: TimeEntry[];
  adjustments: ManualAdjustment[];
  totalHours: number;
  calculatedAmount: number;
  currentBalance: number;
  paidAmount: number;
  newBalance: number;
}