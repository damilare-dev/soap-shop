export type Product = {
  id: string;
  name: string;
  schedule: string;
  expectedQty: number;
  costPrice: number;
  sellPrice: number;
  stock: number;
};

export type SalesRep = {
  id: string;
  name: string;
  pin: string;
  warehouse: 'OWD' | 'JLY';
  lockedDate?: string | null; // YYYY-MM-DD; rep is blocked from new sales on this date
};

export type Delivery = {
  id: string;
  productId: string;
  productName?: string;
  qty: number;
  costPerBox: number;
  date: string;
  supplier: string;
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  repId: string;
  repName: string;
  qty: number;
  pricePerBox: number;
  standardPrice: number;
  expectedCash: number;
  cashCollected: number;
  discrepancy: number;
  note: string;
  date: string;
  time: string;
  voided: boolean;
  edited: boolean;
  voidedBy?: string;
  voidedAt?: string;
  negotiated: boolean;
  negotiatedPrice?: number;
  negotiationReason?: string;
};

export type AuditEntry = {
  id: string;
  ts: string;
  action: string;
  detail: string;
  actor: string;
};

export type StateData = {
  ownerPin: string | null;
  reps: SalesRep[];
  products: Product[];
  deliveries: Delivery[];
  sales: Sale[];
  auditLog: AuditEntry[];
  maxDiscountPct: number; // NEW: owner-configurable negotiation cap
};

export type AlertProps = {
  message: string;
  type?: string;
  onDismiss?: () => void;
};

export type SetupWizardProps = {
  onComplete: (pin: string, reps: SalesRep[]) => void;
};

export type LandingProps = {
  onOwner: () => void;
  onRep: () => void;
};

export type PINScreenProps = {
  title: string;
  subtitle: string;
  pin: string;
  onSuccess: () => void;
  onBack: () => void;
};

export type RepLoginScreenProps = {
  reps: SalesRep[];
  onSuccess: (rep: SalesRep) => void;
  onBack: () => void;
};

export type RepAppProps = {
  data: StateData;
  save: (next: StateData) => Promise<void>;
  rep: SalesRep;
  onLogout: () => void;
  addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

export type QuickSaleProps = {
  data: StateData;
  save: (next: StateData) => Promise<void>;
  rep: SalesRep;
  onLogout: () => void;
  onSwitchToDetailed: () => void;
  addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

export type OwnerQuickSaleProps = {
  data: StateData;
  save: (next: StateData) => Promise<void>;
  addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

export type OwnerAppProps = {
  data: StateData;
  save: (next: StateData) => Promise<void>;
  onLogout: () => void;
  addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

export type OwnerDeliveryProps = {
  data: StateData;
  save: (next: StateData) => Promise<void>;
  addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

export type OwnerSalesProps = {
  data: StateData;
  save: (next: StateData) => Promise<void>;
  addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

export type OwnerReportProps = {
  data: StateData;
};

export type OwnerSettingsProps = {
  data: StateData;
  save: (next: StateData) => Promise<void>;
  addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};
