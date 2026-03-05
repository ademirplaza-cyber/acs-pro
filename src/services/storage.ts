import { User, Family, Person, Visit } from '../types';

const STORAGE_KEYS = {
  USERS: 'acs_users',
  FAMILIES: 'acs_families', 
  PEOPLE: 'acs_people',
  VISITS: 'acs_visits',
  CURRENT_USER: 'acs_current_user_id'
};

class StorageService {
  // ============================================
  // USER METHODS (que você já tem)
  // ============================================
  
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // ============================================
  // FAMILY METHODS (novos)
  // ============================================
  
  getFamilies(agentId?: string): Family[] {
    const data = localStorage.getItem(STORAGE_KEYS.FAMILIES);
    const families = data ? JSON.parse(data) : [];
    return agentId ? families.filter((f: Family) => f.agentId === agentId) : families;
  }

  saveFamily(family: Family): void {
    const families = this.getFamilies();
    const index = families.findIndex(f => f.id === family.id);
    
    if (index >= 0) {
      families[index] = family;
    } else {
      families.push(family);
    }
    
    localStorage.setItem(STORAGE_KEYS.FAMILIES, JSON.stringify(families));
  }

  // ============================================
  // VISIT METHODS (novos)
  // ============================================
  
  getVisits(agentId?: string): Visit[] {
    const data = localStorage.getItem(STORAGE_KEYS.VISITS);
    const visits = data ? JSON.parse(data) : [];
    return agentId ? visits.filter((v: Visit) => v.agentId === agentId) : visits;
  }

  saveVisit(visit: Visit): void {
    const visits = this.getVisits();
    const index = visits.findIndex(v => v.id === visit.id);
    
    if (index >= 0) {
      visits[index] = visit;
    } else {
      visits.push(visit);
    }
    
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.CURRENT_USER) {
        localStorage.removeItem(key);
      }
    });
  }

  exportData(): string {
    const data = {
      users: this.getUsers(),
      families: this.getFamilies(),
      visits: this.getVisits(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }
}

export const storageService = new StorageService();
