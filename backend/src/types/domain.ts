// Multi-tenant core interfaces & domain types
export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'STAFF'
  | 'DEALER'
  | 'DISPATCHER'
  | 'WAREHOUSE_STAFF'
  | 'DRIVER'
  | 'CUSTOMER';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
}

export interface BrickProduct {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  oldPrice?: number;
  trolleyCapacity: number;
  trolleyRate: number;
  description: string;
  features: string[];
  imageUrl?: string;
  isActive: boolean;
}

export interface EstimationParams {
  type: 'wall' | 'house' | 'boundary';
  lengthFt?: number;
  heightFt?: number;
  thicknessInches?: number;
  sqft?: number;
  floors?: number;
  unitPrice?: number;
}

export interface EstimationResult {
  bricksNeeded: number;
  trolleysCount: number;
  cementBags: number;
  sandCuFt: number;
  totalEstimatedCost: number;
  breakageMarginPct: number;
}
