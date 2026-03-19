// ============================================
// ENUMS - Status e Roles do Sistema  
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED'
}

export enum VisitStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PriorityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  subscriptionExpiresAt?: string;
  acceptedTermsAt?: string;
  createdAt?: string;
  microarea?: string;
  equipe?: string;
  cns?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  cityState?: string;
  healthUnit?: string;
}

// ============================================
// FAMILY
// ============================================

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface Family {
  id: string;
  familyNumber: string;
  address: Address;
  agentId: string;
  registeredAt: string;
  updatedAt: string;
  hasBasicSanitation: boolean;
  hasRunningWater: boolean; 
  hasElectricity: boolean;
  dwellingType?: 'HOUSE' | 'APARTMENT' | 'SHACK' | 'OTHER';
  householdIncome?: number;
  notes?: string;
}

// ============================================
// PERSON
// ============================================

export interface Person {
  id: string;
  familyId: string;
  name: string;
  cpf?: string;
  cns?: string;
  birthDate: string;
  gender: 'M' | 'F' | 'OTHER';
  isHeadOfFamily: boolean;
  phone?: string;
  isPuerperium: boolean;
  
  relationshipToHead?: string;

  hasHypertension: boolean;
  hasDiabetes: boolean;
  isPregnant: boolean;
  pregnancyDueDate?: string;
  lastMenstrualPeriod?: string;
  
  occupation?: string;
  isDisabled: boolean;
  chronicDiseases?: string[];
  medications?: string[];
  
  isBedridden: boolean;
  hasMobilityDifficulty: boolean;
  usesInsulin: boolean;
  isSmoker: boolean;
  isAlcoholic: boolean;
  isDrugUser: boolean;
  isWorking: boolean;
  receivesBolsaFamilia: boolean;
  nisNumber?: string;
  isHighRiskPregnancy: boolean;
  rareDiseases?: string;
  otherConditions?: string;

  healthObservations?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// VISIT
// ============================================

export interface Visit {
  id: string;
  familyId: string;
  agentId: string;
  scheduledDate: string;
  completedDate?: string;
  status: VisitStatus;
  priority: PriorityLevel;
  latitude?: number;
  longitude?: number;
  observations?: string;
  orientationsGiven?: string[];
  healthIssuesIdentified?: string[];
  referralsNeeded?: string[];
  peopleAttended?: string[];
  bloodPressure?: Array<{
    systolic: number;
    diastolic: number;
    personId: string;
  }>;
  bloodGlucose?: Array<{
    value: number;
    personId: string;
  }>;
  createdAt: string;
  updatedAt: string;
  needsSync: boolean;
}

// ============================================
// MEETING TOPIC
// ============================================

export interface MeetingTopic {
  id: string;
  agentId: string;
  title: string;
  observations: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ALERT
// ============================================

export interface Alert {
  id: string;
  type: 'OVERDUE_VISIT' | 'UPCOMING_VISIT' | 'VACCINE_DUE' | 'HIGH_RISK' | 'SUBSCRIPTION_EXPIRING';
  priority: PriorityLevel;
  title: string;
  message: string;
  relatedEntityId?: string;
  agentId: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

// ============================================
// REPORT
// ============================================

export interface MonthlyReport {
  agentId: string;
  month: string;
  totalVisits: number;
  completedVisits: number;
  totalFamilies: number;
  totalPeople: number;
  pregnantWomen: number;
  hypertensivePatients: number;
  diabeticPatients: number;
  childrenUnder2: number;
  elderlyOver60: number;
  prenatalCoverage: number;
  hypertensionControlled: number;
  vaccinationUpToDate: number;
  generatedAt: string;
}

// ============================================
// NOTIFICATION
// ============================================

export interface NotificationSettings {
  userId: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  notifyOverdueVisits: boolean;
  notifyUpcomingVisits: boolean;
  notifyHighRiskCases: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ============================================
// SYNC
// ============================================

export interface SyncStatus {
  lastSyncAt?: string;
  pendingFamilies: number;
  pendingVisits: number;
  pendingPeople: number;
  isSyncing: boolean;
  syncErrors: string[];
}
