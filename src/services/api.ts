import { supabase } from '../lib/supabase';
import { Family, Person, Visit, User, UserRole, UserStatus, MeetingTopic } from '../types';

export const api = {

  // ============================================
  // USUÁRIOS
  // ============================================

  async getUsers(): Promise<User[]> {
    console.log('📡 Buscando todos os usuários...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw error;
    }

    const users: User[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password || '',
      role: row.role as UserRole,
      status: row.status as UserStatus,
      subscriptionExpiresAt: row.subscription_expires_at || '',
      createdAt: row.created_at,
      microarea: row.microarea || '',
      equipe: row.equipe || '',
      cns: row.cns || '',
      phone: row.phone || '',
      acceptedTermsAt: row.accepted_terms_at || '',
    }));

    console.log('✅ Usuários carregados:', users.length);
    return users;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    console.log('📡 Buscando usuário por email:', email);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ Usuário não encontrado:', email);
      return null;
    }

    const user: User = {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password || '',
      role: data.role as UserRole,
      status: data.status as UserStatus,
      subscriptionExpiresAt: data.subscription_expires_at || '',
      createdAt: data.created_at,
      microarea: data.microarea || '',
      equipe: data.equipe || '',
      cns: data.cns || '',
      phone: data.phone || '',
      acceptedTermsAt: data.accepted_terms_at || '',
    };

    console.log('✅ Usuário encontrado:', user.name);
    return user;
  },

  async getUserById(id: string): Promise<User | null> {
    console.log('📡 Buscando usuário por ID:', id);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error);
      throw error;
    }

    if (!data) return null;

    const user: User = {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password || '',
      role: data.role as UserRole,
      status: data.status as UserStatus,
      subscriptionExpiresAt: data.subscription_expires_at || '',
      createdAt: data.created_at,
      microarea: data.microarea || '',
      equipe: data.equipe || '',
      cns: data.cns || '',
      phone: data.phone || '',
      acceptedTermsAt: data.accepted_terms_at || '',
    };

    return user;
  },

  async saveUser(user: User): Promise<any> {
    console.log('💾 Salvando usuário:', user.email);
    const dbData: any = {
      name: user.name,
      email: user.email.toLowerCase().trim(),
      password: user.password || '123456',
      role: user.role || 'AGENT',
      status: user.status || 'PENDING',
      subscription_expires_at: user.subscriptionExpiresAt || null,
      microarea: user.microarea || null,
      equipe: user.equipe || null,
      cns: user.cns || null,
      phone: user.phone || null,
      accepted_terms_at: user.acceptedTermsAt || null,
      updated_at: new Date().toISOString(),
    };

    if (user.id) {
      dbData.id = user.id;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(dbData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      throw error;
    }

    console.log('✅ Usuário salvo com sucesso:', data);
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    console.log('🗑️ Excluindo usuário:', id);
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      throw error;
    }
    console.log('✅ Usuário excluído com sucesso');
  },

  async updateUserStatus(id: string, status: UserStatus): Promise<void> {
    console.log('🔄 Atualizando status do usuário:', id, '→', status);
    const { error } = await supabase
      .from('users')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
    console.log('✅ Status atualizado com sucesso');
  },

  async renewSubscription(id: string, days: number): Promise<void> {
    console.log('🔄 Renovando assinatura do usuário:', id, 'por', days, 'dias');
    const newExpiration = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('users')
      .update({
        subscription_expires_at: newExpiration,
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao renovar assinatura:', error);
      throw error;
    }
    console.log('✅ Assinatura renovada até:', newExpiration);
  },

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    console.log('🔐 Atualizando senha do usuário:', userId);
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      throw error;
    }
    console.log('✅ Senha atualizada com sucesso');
  },

  // ============================================
  // RECUPERAÇÃO DE SENHA
  // ============================================

    async requestPasswordReset(email: string): Promise<{ success: boolean; code?: string; error?: string }> {
    console.log('🔐 Solicitando recuperação de senha para:', email);
    const user = await api.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Email não encontrado no sistema.' };
    }

    // Invalidar códigos anteriores
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase().trim())
      .eq('used', false);

    // Gerar novo código
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('password_reset_codes')
      .insert({
        user_id: user.id,
        email: email.toLowerCase().trim(),
        code: code,
        used: false,
        expires_at: expiresAt,
      });

    if (error) {
      console.error('❌ Erro ao criar código de recuperação:', error);
      return { success: false, error: 'Erro ao gerar código. Tente novamente.' };
    }

    // Enviar email via serverless function
    try {
      const baseUrl = window.location.origin;
      const emailResponse = await fetch(`${baseUrl}/api/send-reset-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: code,
          userName: user.name,
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error('❌ Erro ao enviar email:', emailResult);
        // Fallback: retorna o código para exibir na tela
        return { success: true, code: code };
      }

      console.log('✅ Email enviado com sucesso!');
      // Não retorna o código — foi enviado por email
      return { success: true };

    } catch (emailError) {
      console.error('❌ Erro de rede ao enviar email:', emailError);
      // Fallback: retorna o código para exibir na tela
      return { success: true, code: code };
    }
  },
    async verifyResetCode(email: string, code: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    console.log('🔐 Verificando código de recuperação:', email, code);
    const { data, error } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao verificar código:', error);
      return { success: false, error: 'Erro ao verificar código. Tente novamente.' };
    }

    if (!data) {
      return { success: false, error: 'Código inválido, expirado ou já utilizado.' };
    }

    console.log('✅ Código válido para user_id:', data.user_id);
    return { success: true, userId: data.user_id };
  },

  async completePasswordReset(email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔐 Completando redefinição de senha para:', email);
    const verification = await api.verifyResetCode(email, code);
    if (!verification.success || !verification.userId) {
      return { success: false, error: verification.error || 'Código inválido.' };
    }

    try {
      await api.updateUserPassword(verification.userId, newPassword);
    } catch (err) {
      return { success: false, error: 'Erro ao atualizar a senha. Tente novamente.' };
    }

    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase().trim())
      .eq('code', code);

    console.log('✅ Senha redefinida com sucesso!');
    return { success: true };
  },

  // ============================================
  // FAMÍLIAS
  // ============================================

  async getFamilies(agentId: string): Promise<Family[]> {
    console.log('📡 Buscando famílias para agente:', agentId);
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar famílias:', error);
      throw error;
    }

    const families: Family[] = (data || []).map((row: any) => ({
      id: row.id,
      familyNumber: row.family_number,
      address: {
        street: row.street || '',
        number: row.number || '',
        complement: row.complement || '',
        neighborhood: row.neighborhood || '',
        city: row.city || 'São Paulo',
        state: row.state || 'SP',
        zipCode: row.zip_code || '',
        latitude: row.latitude,
        longitude: row.longitude,
      },
      agentId: row.agent_id,
      registeredAt: row.created_at,
      updatedAt: row.updated_at,
      hasBasicSanitation: row.has_basic_sanitation ?? true,
      hasRunningWater: row.has_running_water ?? true,
      hasElectricity: row.has_electricity ?? true,
      dwellingType: row.dwelling_type || 'HOUSE',
      householdIncome: row.household_income,
      notes: row.notes || '',
    }));

    console.log('✅ Famílias mapeadas:', families.length);
    return families;
  },

  async saveFamily(family: Family): Promise<any> {
    console.log('💾 Salvando família:', family);
    const dbData: any = {
      agent_id: family.agentId,
      family_number: family.familyNumber,
      street: family.address.street,
      number: family.address.number,
      complement: family.address.complement || '',
      neighborhood: family.address.neighborhood,
      city: family.address.city || 'São Paulo',
      state: family.address.state || 'SP',
      zip_code: family.address.zipCode || '',
      latitude: family.address.latitude || null,
      longitude: family.address.longitude || null,
      has_basic_sanitation: family.hasBasicSanitation ?? true,
      has_running_water: family.hasRunningWater ?? true,
      has_electricity: family.hasElectricity ?? true,
      dwelling_type: family.dwellingType || 'HOUSE',
      household_income: family.householdIncome || null,
      notes: family.notes || '',
      updated_at: new Date().toISOString(),
    };

    if (family.id) {
      dbData.id = family.id;
    }

    const { data, error } = await supabase
      .from('families')
      .upsert(dbData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar família:', error);
      throw error;
    }

    console.log('✅ Família salva com sucesso:', data);
    return data;
  },

  async deleteFamily(id: string): Promise<void> {
    console.log('🗑️ Excluindo família:', id);
    const { error } = await supabase.from('families').delete().eq('id', id);
    if (error) {
      console.error('❌ Erro ao excluir família:', error);
      throw error;
    }
    console.log('✅ Família excluída com sucesso');
  },

  // ============================================
  // PESSOAS (MEMBROS DA FAMÍLIA)
  // ============================================

  async getPeople(familyId: string): Promise<Person[]> {
    console.log('📡 Buscando membros da família:', familyId);
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('family_id', familyId)
      .order('is_head_of_family', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar pessoas:', error);
      throw error;
    }

    const people: Person[] = (data || []).map((row: any) => ({
      id: row.id,
      familyId: row.family_id,
      name: row.name,
      cpf: row.cpf || '',
      cns: row.cns || '',
      birthDate: row.birth_date,
      gender: row.gender || 'M',
      phone: row.phone || '',
      occupation: row.occupation || '',
      isHeadOfFamily: row.is_head_of_family ?? false,
      hasHypertension: row.has_hypertension ?? false,
      hasDiabetes: row.has_diabetes ?? false,
      isPregnant: row.is_pregnant ?? false,
      pregnancyDueDate: row.pregnancy_due_date || '',
      lastMenstrualPeriod: row.last_menstrual_period || '',
      isDisabled: row.is_disabled ?? false,
      chronicDiseases: row.chronic_diseases || [],
      medications: row.medications || [],
      isBedridden: row.is_bedridden ?? false,
      hasMobilityDifficulty: row.has_mobility_difficulty ?? false,
      usesInsulin: row.uses_insulin ?? false,
      isSmoker: row.is_smoker ?? false,
      isWorking: row.is_working ?? false,
      receivesBolsaFamilia: row.receives_bolsa_familia ?? false,
      nisNumber: row.nis_number || '',
      isHighRiskPregnancy: row.is_high_risk_pregnancy ?? false,
      rareDiseases: row.rare_diseases || '',
      relationshipToHead: row.relationship_to_head || '',
      isAlcoholic: row.is_alcoholic ?? false,
      isDrugUser: row.is_drug_user ?? false,
      healthObservations: row.health_observations || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isPuerperium: row.is_puerperium ?? false,
      otherConditions: row.other_conditions || '',
    }));

    console.log('✅ Pessoas mapeadas:', people.length);
    return people;
  },

  async savePerson(person: Person): Promise<any> {
    console.log('💾 Salvando pessoa:', person);
    const dbData: any = {
      family_id: person.familyId,
      name: person.name,
      cpf: person.cpf || null,
      cns: person.cns || null,
      birth_date: person.birthDate,
      gender: person.gender || 'M',
      phone: person.phone || null,
      occupation: person.occupation || null,
      is_head_of_family: person.isHeadOfFamily ?? false,
      has_hypertension: person.hasHypertension ?? false,
      has_diabetes: person.hasDiabetes ?? false,
      is_pregnant: person.isPregnant ?? false,
      is_puerperium: person.isPuerperium ?? false,
      pregnancy_due_date: person.isPregnant ? (person.pregnancyDueDate || null) : null,
      last_menstrual_period: person.isPregnant ? (person.lastMenstrualPeriod || null) : null,
      is_disabled: person.isDisabled ?? false,
      chronic_diseases: person.chronicDiseases || [],
      medications: person.medications || [],
      is_bedridden: person.isBedridden ?? false,
      has_mobility_difficulty: person.hasMobilityDifficulty ?? false,
      uses_insulin: person.usesInsulin ?? false,
      is_smoker: person.isSmoker ?? false,
      is_working: person.isWorking ?? false,
      receives_bolsa_familia: person.receivesBolsaFamilia ?? false,
      nis_number: person.nisNumber || null,
      is_high_risk_pregnancy: person.isHighRiskPregnancy ?? false,
      rare_diseases: person.rareDiseases || null,
      relationship_to_head: person.relationshipToHead || null,
      is_alcoholic: person.isAlcoholic ?? false,
      is_drug_user: person.isDrugUser ?? false,
      health_observations: person.healthObservations || null,
      other_conditions: person.otherConditions || '',
      updated_at: new Date().toISOString(),
    };

    if (person.id) {
      dbData.id = person.id;
    }

    const { data, error } = await supabase
      .from('people')
      .upsert(dbData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar pessoa:', error);
      throw error;
    }

    console.log('✅ Pessoa salva com sucesso:', data);
    return data;
  },

  async deletePerson(id: string): Promise<void> {
    console.log('🗑️ Excluindo pessoa:', id);
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) {
      console.error('❌ Erro ao excluir pessoa:', error);
      throw error;
    }
    console.log('✅ Pessoa excluída com sucesso');
  },

  async updateHeadOfFamily(familyId: string, newHeadId: string): Promise<void> {
    console.log('👑 Atualizando responsável da família:', familyId, '→', newHeadId);
    const { error: resetError } = await supabase
      .from('people')
      .update({ is_head_of_family: false, updated_at: new Date().toISOString() })
      .eq('family_id', familyId);

    if (resetError) {
      console.error('❌ Erro ao resetar responsável:', resetError);
      throw resetError;
    }

    const { error: setError } = await supabase
      .from('people')
      .update({ is_head_of_family: true, updated_at: new Date().toISOString() })
      .eq('id', newHeadId);

    if (setError) {
      console.error('❌ Erro ao definir novo responsável:', setError);
      throw setError;
    }
    console.log('✅ Responsável atualizado com sucesso');
  },

  async getMemberCount(familyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('people')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId);

    if (error) {
      console.error('❌ Erro ao contar membros:', error);
      return 0;
    }
    return count || 0;
  },

  // ============================================
  // VISITAS
  // ============================================

  async getVisits(agentId: string): Promise<Visit[]> {
    console.log('📡 Buscando visitas para agente:', agentId);
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('agent_id', agentId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar visitas:', error);
      throw error;
    }

    const visits: Visit[] = (data || []).map((row: any) => ({
      id: row.id,
      familyId: row.family_id,
      agentId: row.agent_id,
      scheduledDate: row.scheduled_date,
      completedDate: row.completed_date || '',
      status: row.status || 'PENDING',
      priority: row.priority || 'MEDIUM',
      latitude: row.latitude,
      longitude: row.longitude,
      observations: row.observations || '',
      orientationsGiven: row.orientations_given || [],
      healthIssuesIdentified: row.health_issues_identified || [],
      referralsNeeded: row.referrals_needed || [],
      peopleAttended: row.people_attended || [],
      bloodPressure: row.blood_pressure || [],
      bloodGlucose: row.blood_glucose || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      needsSync: false,
    }));

    console.log('✅ Visitas mapeadas:', visits.length);
    return visits;
  },

  async saveVisit(visit: Visit): Promise<any> {
    console.log('💾 Salvando visita:', visit);
    const dbData: any = {
      family_id: visit.familyId,
      agent_id: visit.agentId,
      scheduled_date: visit.scheduledDate,
      completed_date: visit.completedDate || null,
      status: visit.status || 'PENDING',
      priority: visit.priority || 'MEDIUM',
      latitude: visit.latitude || null,
      longitude: visit.longitude || null,
      observations: visit.observations || '',
      orientations_given: visit.orientationsGiven || [],
      health_issues_identified: visit.healthIssuesIdentified || [],
      referrals_needed: visit.referralsNeeded || [],
      people_attended: visit.peopleAttended || [],
      blood_pressure: visit.bloodPressure || [],
      blood_glucose: visit.bloodGlucose || [],
      updated_at: new Date().toISOString(),
    };

    if (visit.id) {
      dbData.id = visit.id;
    }

    const { data, error } = await supabase
      .from('visits')
      .upsert(dbData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar visita:', error);
      throw error;
    }

    console.log('✅ Visita salva com sucesso:', data);
    return data;
  },

  async deleteVisit(id: string): Promise<void> {
    console.log('🗑️ Excluindo visita:', id);
    const { error } = await supabase.from('visits').delete().eq('id', id);
    if (error) {
      console.error('❌ Erro ao excluir visita:', error);
      throw error;
    }
    console.log('✅ Visita excluída com sucesso');
  },

  // ============================================
  // ESTATÍSTICAS (para o painel Admin)
  // ============================================

  async getTotalFamilies(): Promise<number> {
    const { count, error } = await supabase
      .from('families')
      .select('*', { count: 'exact', head: true });
    if (error) { console.error('❌ Erro ao contar famílias:', error); return 0; }
    return count || 0;
  },

  async getTotalPeople(): Promise<number> {
    const { count, error } = await supabase
      .from('people')
      .select('*', { count: 'exact', head: true });
    if (error) { console.error('❌ Erro ao contar pessoas:', error); return 0; }
    return count || 0;
  },

  async getTotalVisits(): Promise<number> {
    const { count, error } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });
    if (error) { console.error('❌ Erro ao contar visitas:', error); return 0; }
    return count || 0;
  },
  // ============================================
  // NOTIFICAÇÕES
  // ============================================

  async getNotifications(agentId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      return [];
    }
  },

  async getUnreadCount(agentId?: string): Promise<number> {
    try {
      let query = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Erro ao contar notificações:', error);
      return 0;
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      console.log('✅ Notificação marcada como lida');
      return true;
    } catch (error) {
      console.error('❌ Erro ao marcar notificação:', error);
      return false;
    }
  },

  async markAllAsRead(agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('agent_id', agentId);
      if (error) throw error;
      console.log('✅ Todas notificações marcadas como lidas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao marcar todas:', error);
      return false;
    }
  },

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
      console.log('✅ Notificação excluída');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir notificação:', error);
      return false;
    }
  },

  async clearReadNotifications(agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .eq('agent_id', agentId);
      if (error) throw error;
      console.log('✅ Notificações lidas removidas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
      return false;
    }
  },

  async createNotification(notification: {
    type: string;
    priority: string;
    title: string;
    message: string;
    agentId: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    actionUrl?: string;
    expiresAt?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          agent_id: notification.agentId,
          related_entity_id: notification.relatedEntityId || null,
          related_entity_type: notification.relatedEntityType || null,
          action_url: notification.actionUrl || null,
          expires_at: notification.expiresAt || null,
        });
      if (error) throw error;
      console.log('✅ Notificação criada:', notification.title);
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      return false;
    }
  },

  // ============================================
  // ASSUNTOS PARA REUNIÃO
  // ============================================

  async getMeetingTopics(agentId: string): Promise<MeetingTopic[]> {
    console.log('📡 Buscando assuntos para reunião do agente:', agentId);
    const { data, error } = await supabase
      .from('meeting_topics')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar assuntos para reunião:', error);
      throw error;
    }

    const topics: MeetingTopic[] = (data || []).map((row: any) => ({
      id: row.id,
      agentId: row.agent_id,
      title: row.title,
      observations: row.observations || '',
      status: row.status || 'PENDING',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    console.log('✅ Assuntos para reunião carregados:', topics.length);
    return topics;
  },

  async saveMeetingTopic(topic: MeetingTopic): Promise<any> {
    console.log('💾 Salvando assunto para reunião:', topic.title);
    const dbData: any = {
      agent_id: topic.agentId,
      title: topic.title,
      observations: topic.observations || '',
      status: topic.status || 'PENDING',
      updated_at: new Date().toISOString(),
    };

    if (topic.id) {
      dbData.id = topic.id;
    }

    const { data, error } = await supabase
      .from('meeting_topics')
      .upsert(dbData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar assunto para reunião:', error);
      throw error;
    }

    console.log('✅ Assunto para reunião salvo com sucesso:', data);
    return data;
  },

  async updateMeetingTopicStatus(id: string, status: string): Promise<void> {
    console.log('🔄 Atualizando status do assunto:', id, '→', status);
    const { error } = await supabase
      .from('meeting_topics')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao atualizar status do assunto:', error);
      throw error;
    }
    console.log('✅ Status do assunto atualizado com sucesso');
  },

  async deleteMeetingTopic(id: string): Promise<void> {
    console.log('🗑️ Excluindo assunto para reunião:', id);
    const { error } = await supabase
      .from('meeting_topics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao excluir assunto para reunião:', error);
      throw error;
    }
    console.log('✅ Assunto para reunião excluído com sucesso');
  },

};
