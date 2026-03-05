// ============================================
// ENUMS - Status e Roles do Sistema  
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT'
}

export enum UserStatus {
  PENDING = 'PENDING',    // Aguardando aprovação
  ACTIVE = 'ACTIVE',      // Ativo e funcionando
  BLOCKED = 'BLOCKED'     // Bloqueado pelo admin
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
// USER - Interface Principal de Usuário
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  
  // ESSENCIAL: Controle de assinatura
  subscriptionExpiresAt?: string; // Data ISO string
  createdAt?: string;             // Data ISO string
  
  // Dados específicos do ACS
  microarea?: string;             // Área de atuação
  equipe?: string;               // Nome da equipe ESF
  cns?: string;                  // Cartão Nacional de Saúde
  phone?: string;
}

// ============================================
// FAMILY - Cadastro de Famílias
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
  familyNumber: string;           // Número da família na microárea
  address: Address;
  agentId: string;                // ID do ACS responsável
  registeredAt: string;           // Data de cadastro
  updatedAt: string;
  
  // Condições de moradia (para relatórios)
  hasBasicSanitation: boolean;
  hasRunningWater: boolean; 
  hasElectricity: boolean;
  dwellingType?: 'HOUSE' | 'APARTMENT' | 'SHACK' | 'OTHER';
  householdIncome?: number;
  notes?: string;
}

// ============================================
// PERSON - Membros da Família
// ============================================

export interface Person {
  id: string;
  familyId: string;
  name: string;
  cpf?: string;
  cns?: string;                   // Cartão Nacional de Saúde
  birthDate: string;              // Data nascimento
  gender: 'M' | 'F' | 'OTHER';
  isHeadOfFamily: boolean;
  phone?: string;
  
  // Condições de saúde prioritárias
  hasHypertension: boolean;
  hasDiabetes: boolean;
  isPregnant: boolean;
  pregnancyDueDate?: string;      // Data provável do parto
  lastMenstrualPeriod?: string;   // DUM para cálculo IG
  
  // Informações complementares
  occupation?: string;
  isDisabled: boolean;
  chronicDiseases?: string[];
  medications?: string[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// VISIT - Visitas Domiciliares
// ============================================

export interface Visit {
  id: string;
  familyId: string;
  agentId: string;
  scheduledDate: string;          // Data agendada
  completedDate?: string;         // Data realizada
  status: VisitStatus;
  priority: PriorityLevel;
  
  // Localização (GPS automático)
  latitude?: number;
  longitude?: number;
  
  // Conteúdo da visita
  observations?: string;
  orientationsGiven?: string[];
  healthIssuesIdentified?: string[];
  referralsNeeded?: string[];
  
  // Pessoas atendidas
  peopleAttended?: string[];      // IDs das pessoas
  
  // Sinais vitais básicos
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
  needsSync: boolean;             // Para controle offline
}

// ============================================
// ALERT - Sistema de Alertas
// ============================================

export interface Alert {
  id: string;
  type: 'OVERDUE_VISIT' | 'UPCOMING_VISIT' | 'VACCINE_DUE' | 'HIGH_RISK' | 'SUBSCRIPTION_EXPIRING';
  priority: PriorityLevel;
  title: string;
  message: string;
  relatedEntityId?: string;       // ID da família/pessoa relacionada
  agentId: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

// ============================================
// REPORT - Relatórios Mensais
// ============================================

export interface MonthlyReport {
  agentId: string;
  month: string;                  // "2026-01" formato YYYY-MM
  
  // Métricas básicas
  totalVisits: number;
  completedVisits: number;
  totalFamilies: number;
  totalPeople: number;
  
  // Grupos prioritários
  pregnantWomen: number;
  hypertensivePatients: number;
  diabeticPatients: number;
  childrenUnder2: number;
  elderlyOver60: number;
  
  // Indicadores de qualidade
  prenatalCoverage: number;       // Percentual
  hypertensionControlled: number; // Percentual
  vaccinationUpToDate: number;    // Percentual
  
  generatedAt: string;
}

// ============================================
// NOTIFICATION - Configurações
// ============================================

export interface NotificationSettings {
  userId: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  notifyOverdueVisits: boolean;
  notifyUpcomingVisits: boolean;
  notifyHighRiskCases: boolean;
  quietHoursStart?: string;       // "22:00"
  quietHoursEnd?: string;         // "07:00"
}

// ============================================
// SYNC - Controle de Sincronização
// ============================================

export interface SyncStatus {
  lastSyncAt?: string;
  pendingFamilies: number;
  pendingVisits: number;
  pendingPeople: number;
  isSyncing: boolean;
  syncErrors: string[];
}
