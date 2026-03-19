import { api } from './api';
import { VisitStatus } from '../types';

// ============================================
// SERVIÇO DE NOTIFICAÇÕES AUTOMÁTICAS
// Verifica dados no Supabase e gera alertas
// ============================================

const NOTIFICATION_TYPES = {
  OVERDUE_VISIT: 'OVERDUE_VISIT',
  UPCOMING_VISIT: 'UPCOMING_VISIT',
  FAMILY_NO_VISIT: 'FAMILY_NO_VISIT',
  PREGNANT_NO_CARE: 'PREGNANT_NO_CARE',
  HYPERTENSIVE_NO_CARE: 'HYPERTENSIVE_NO_CARE',
  DIABETIC_NO_CARE: 'DIABETIC_NO_CARE',
  SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
  PENDING_AGENT: 'PENDING_AGENT',
};

const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

// Helpers
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(date1: Date, date2: Date): number {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Cache para evitar notificações duplicadas na mesma sessão
const sentNotifications = new Set<string>();

function notificationKey(type: string, entityId: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${type}_${entityId}_${today}`;
}

async function createIfNotExists(params: {
  type: string;
  priority: string;
  title: string;
  message: string;
  agentId: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
}): Promise<void> {
  const key = notificationKey(params.type, params.relatedEntityId || params.agentId);

  if (sentNotifications.has(key)) return;

  // Verifica se já existe notificação igual hoje
  const existing = await api.getNotifications(params.agentId);
  const today = new Date().toISOString().split('T')[0];
  const alreadyExists = existing.some(
    (n) =>
      n.type === params.type &&
      n.related_entity_id === (params.relatedEntityId || null) &&
      n.created_at?.startsWith(today)
  );

  if (alreadyExists) {
    sentNotifications.add(key);
    return;
  }

  await api.createNotification(params);
  sentNotifications.add(key);
}

// ============================================
// VERIFICAÇÕES DE SAÚDE (só para Agentes)
// ============================================

// 1. Visitas atrasadas (data agendada já passou e status PENDING)
async function checkOverdueVisits(agentId: string): Promise<void> {
  try {
    const visits = await api.getVisits(agentId);
    const families = await api.getFamilies(agentId);
    const today = startOfDay(new Date());

    const overdue = visits.filter((v) => {
      if (v.status !== VisitStatus.PENDING) return false;
      const scheduled = startOfDay(new Date(v.scheduledDate));
      return scheduled < today;
    });

    for (const visit of overdue) {
      const days = daysBetween(new Date(visit.scheduledDate), new Date());
      const family = families.find((f) => f.id === visit.familyId);
      const familyName = family ? `Família ${family.familyNumber}` : 'Família';

      await createIfNotExists({
        type: NOTIFICATION_TYPES.OVERDUE_VISIT,
        priority: days > 7 ? PRIORITIES.URGENT : days > 3 ? PRIORITIES.HIGH : PRIORITIES.MEDIUM,
        title: '⚠️ Visita Atrasada',
        message: `${familyName} - Visita agendada há ${days} dia(s) atrás e ainda não foi realizada.`,
        agentId,
        relatedEntityId: visit.id,
        relatedEntityType: 'visit',
        actionUrl: '/visits',
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar visitas atrasadas:', error);
  }
}

// 2. Visitas para hoje ou amanhã
async function checkUpcomingVisits(agentId: string): Promise<void> {
  try {
    const visits = await api.getVisits(agentId);
    const families = await api.getFamilies(agentId);
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcoming = visits.filter((v) => {
      if (v.status !== VisitStatus.PENDING) return false;
      const scheduled = startOfDay(new Date(v.scheduledDate));
      return scheduled.getTime() === today.getTime() || scheduled.getTime() === tomorrow.getTime();
    });

    for (const visit of upcoming) {
      const scheduled = startOfDay(new Date(visit.scheduledDate));
      const isToday = scheduled.getTime() === today.getTime();
      const family = families.find((f) => f.id === visit.familyId);
      const familyName = family ? `Família ${family.familyNumber}` : 'Família';

      await createIfNotExists({
        type: NOTIFICATION_TYPES.UPCOMING_VISIT,
        priority: isToday ? PRIORITIES.HIGH : PRIORITIES.MEDIUM,
        title: isToday ? '📋 Visita Hoje' : '📅 Visita Amanhã',
        message: `${familyName} - Visita ${isToday ? 'agendada para hoje' : 'agendada para amanhã'}. Prioridade: ${visit.priority}.`,
        agentId,
        relatedEntityId: visit.id,
        relatedEntityType: 'visit',
        actionUrl: '/visits',
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar visitas próximas:', error);
  }
}

// 3. Famílias sem visita há mais de 30 dias
// CORREÇÃO: Só alerta se a família foi cadastrada há mais de 30 dias
async function checkFamiliesWithoutVisit(agentId: string): Promise<void> {
  try {
    const families = await api.getFamilies(agentId);
    const visits = await api.getVisits(agentId);

    for (const family of families) {
      // Ignorar famílias cadastradas há menos de 30 dias
      const daysSinceCreation = daysBetween(new Date(family.registeredAt), new Date());
      if (daysSinceCreation < 30) continue;

      const familyVisits = visits.filter(
        (v) => v.familyId === family.id && v.status === VisitStatus.COMPLETED
      );

      let daysSinceLastVisit = 999;
      if (familyVisits.length > 0) {
        const lastVisit = familyVisits.sort(
          (a, b) => new Date(b.completedDate || b.scheduledDate).getTime() -
                     new Date(a.completedDate || a.scheduledDate).getTime()
        )[0];
        daysSinceLastVisit = daysBetween(
          new Date(lastVisit.completedDate || lastVisit.scheduledDate),
          new Date()
        );
      }

      if (daysSinceLastVisit >= 30) {
        await createIfNotExists({
          type: NOTIFICATION_TYPES.FAMILY_NO_VISIT,
          priority: daysSinceLastVisit > 60 ? PRIORITIES.URGENT : PRIORITIES.HIGH,
          title: '🏠 Família sem Acompanhamento',
          message: `Família ${family.familyNumber} está há ${daysSinceLastVisit === 999 ? 'muito tempo' : daysSinceLastVisit + ' dias'} sem receber visita.`,
          agentId,
          relatedEntityId: family.id,
          relatedEntityType: 'family',
          actionUrl: `/families/${family.id}`,
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar famílias sem visita:', error);
  }
}

// 4. Gestantes sem acompanhamento (15+ dias)
// CORREÇÃO: Só alerta se a pessoa foi cadastrada há mais de 15 dias
async function checkPregnantWithoutCare(agentId: string): Promise<void> {
  try {
    const families = await api.getFamilies(agentId);
    const visits = await api.getVisits(agentId);

    for (const family of families) {
      const people = await api.getPeople(family.id);
      const pregnant = people.filter((p) => p.isPregnant);

      for (const person of pregnant) {
        // Ignorar pessoas cadastradas há menos de 15 dias
        const daysSinceCreation = daysBetween(new Date(person.createdAt), new Date());
        if (daysSinceCreation < 15) continue;

        const familyVisits = visits.filter(
          (v) => v.familyId === person.familyId && v.status === VisitStatus.COMPLETED
        );

        let daysSince = 999;
        if (familyVisits.length > 0) {
          const last = familyVisits.sort(
            (a, b) => new Date(b.completedDate || b.scheduledDate).getTime() -
                       new Date(a.completedDate || a.scheduledDate).getTime()
          )[0];
          daysSince = daysBetween(new Date(last.completedDate || last.scheduledDate), new Date());
        }

        if (daysSince >= 15) {
          await createIfNotExists({
            type: NOTIFICATION_TYPES.PREGNANT_NO_CARE,
            priority: PRIORITIES.URGENT,
            title: '🤰 Gestante sem Acompanhamento',
            message: `${person.name} (Família ${family.familyNumber}) está há ${daysSince === 999 ? 'muito tempo' : daysSince + ' dias'} sem visita. Gestantes precisam de acompanhamento quinzenal.`,
            agentId,
            relatedEntityId: family.id,
            relatedEntityType: 'family',
            actionUrl: `/families/${family.id}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar gestantes:', error);
  }
}

// 5. Hipertensos sem acompanhamento (30+ dias)
// CORREÇÃO: Só alerta se a pessoa foi cadastrada há mais de 30 dias
async function checkHypertensiveWithoutCare(agentId: string): Promise<void> {
  try {
    const families = await api.getFamilies(agentId);
    const visits = await api.getVisits(agentId);

    for (const family of families) {
      const people = await api.getPeople(family.id);
      const hypertensive = people.filter((p) => p.hasHypertension);

      for (const person of hypertensive) {
        // Ignorar pessoas cadastradas há menos de 30 dias
        const daysSinceCreation = daysBetween(new Date(person.createdAt), new Date());
        if (daysSinceCreation < 30) continue;

        const familyVisits = visits.filter(
          (v) => v.familyId === person.familyId && v.status === VisitStatus.COMPLETED
        );

        let daysSince = 999;
        if (familyVisits.length > 0) {
          const last = familyVisits.sort(
            (a, b) => new Date(b.completedDate || b.scheduledDate).getTime() -
                       new Date(a.completedDate || a.scheduledDate).getTime()
          )[0];
          daysSince = daysBetween(new Date(last.completedDate || last.scheduledDate), new Date());
        }

        if (daysSince >= 30) {
          await createIfNotExists({
            type: NOTIFICATION_TYPES.HYPERTENSIVE_NO_CARE,
            priority: PRIORITIES.HIGH,
            title: '❤️ Hipertenso sem Acompanhamento',
            message: `${person.name} (Família ${family.familyNumber}) é hipertenso(a) e está há ${daysSince === 999 ? 'muito tempo' : daysSince + ' dias'} sem visita.`,
            agentId,
            relatedEntityId: family.id,
            relatedEntityType: 'family',
            actionUrl: `/families/${family.id}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar hipertensos:', error);
  }
}

// 6. Diabéticos sem acompanhamento (30+ dias)
// CORREÇÃO: Só alerta se a pessoa foi cadastrada há mais de 30 dias
async function checkDiabeticWithoutCare(agentId: string): Promise<void> {
  try {
    const families = await api.getFamilies(agentId);
    const visits = await api.getVisits(agentId);

    for (const family of families) {
      const people = await api.getPeople(family.id);
      const diabetic = people.filter((p) => p.hasDiabetes);

      for (const person of diabetic) {
        // Ignorar pessoas cadastradas há menos de 30 dias
        const daysSinceCreation = daysBetween(new Date(person.createdAt), new Date());
        if (daysSinceCreation < 30) continue;

        const familyVisits = visits.filter(
          (v) => v.familyId === person.familyId && v.status === VisitStatus.COMPLETED
        );

        let daysSince = 999;
        if (familyVisits.length > 0) {
          const last = familyVisits.sort(
            (a, b) => new Date(b.completedDate || b.scheduledDate).getTime() -
                       new Date(a.completedDate || a.scheduledDate).getTime()
          )[0];
          daysSince = daysBetween(new Date(last.completedDate || last.scheduledDate), new Date());
        }

        if (daysSince >= 30) {
          await createIfNotExists({
            type: NOTIFICATION_TYPES.DIABETIC_NO_CARE,
            priority: PRIORITIES.HIGH,
            title: '🩸 Diabético sem Acompanhamento',
            message: `${person.name} (Família ${family.familyNumber}) é diabético(a) e está há ${daysSince === 999 ? 'muito tempo' : daysSince + ' dias'} sem visita.`,
            agentId,
            relatedEntityId: family.id,
            relatedEntityType: 'family',
            actionUrl: `/families/${family.id}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar diabéticos:', error);
  }
}

// ============================================
// VERIFICAÇÕES ADMINISTRATIVAS (só para Admin)
// ============================================

// 7. Assinatura expirando (Admin verifica agentes)
async function checkSubscriptionExpiring(agentId: string): Promise<void> {
  try {
    const users = await api.getUsers();

    for (const user of users) {
      if (!user.subscriptionExpiresAt) continue;

      const daysLeft = daysBetween(new Date(), new Date(user.subscriptionExpiresAt));

      if (daysLeft <= 7 && daysLeft >= 0) {
        await createIfNotExists({
          type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING,
          priority: daysLeft <= 2 ? PRIORITIES.URGENT : PRIORITIES.HIGH,
          title: '⏰ Assinatura Expirando',
          message: `A assinatura de ${user.name} expira em ${daysLeft} dia(s). ${daysLeft <= 2 ? 'URGENTE!' : 'Renove em breve.'}`,
          agentId,
          relatedEntityId: user.id,
          relatedEntityType: 'user',
          actionUrl: '/admin',
        });
      }

      if (daysLeft < 0) {
        await createIfNotExists({
          type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING,
          priority: PRIORITIES.URGENT,
          title: '🚫 Assinatura Expirada',
          message: `A assinatura de ${user.name} expirou há ${Math.abs(daysLeft)} dia(s). O acesso será bloqueado.`,
          agentId,
          relatedEntityId: user.id,
          relatedEntityType: 'user',
          actionUrl: '/admin',
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar assinaturas:', error);
  }
}

// 8. Agentes pendentes de aprovação (só para Admin)
async function checkPendingAgents(agentId: string): Promise<void> {
  try {
    const users = await api.getUsers();
    const pending = users.filter((u) => u.status === 'PENDING');

    if (pending.length > 0) {
      await createIfNotExists({
        type: NOTIFICATION_TYPES.PENDING_AGENT,
        priority: PRIORITIES.MEDIUM,
        title: '👤 Agentes Aguardando Aprovação',
        message: `${pending.length} agente(s) aguardando aprovação: ${pending.map((u) => u.name).join(', ')}.`,
        agentId,
        relatedEntityId: 'pending_agents',
        relatedEntityType: 'user',
        actionUrl: '/admin',
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar agentes pendentes:', error);
  }
}

// ============================================
// EXECUTOR PRINCIPAL
// ============================================

export const notificationService = {
  async runAllChecks(agentId: string, isAdmin: boolean = false): Promise<number> {
    console.log(`🔔 Iniciando verificação de notificações (${isAdmin ? 'ADMIN' : 'AGENTE'})...`);
    const startTime = Date.now();

    try {
      if (isAdmin) {
        // Admin recebe APENAS notificações administrativas
        await checkSubscriptionExpiring(agentId);
        await checkPendingAgents(agentId);
      } else {
        // Agente recebe APENAS notificações de saúde/visitas
        await checkOverdueVisits(agentId);
        await checkUpcomingVisits(agentId);
        await checkFamiliesWithoutVisit(agentId);
        await checkPregnantWithoutCare(agentId);
        await checkHypertensiveWithoutCare(agentId);
        await checkDiabeticWithoutCare(agentId);
      }

      const count = await api.getUnreadCount(agentId);
      const elapsed = Date.now() - startTime;
      console.log(`✅ Verificação concluída em ${elapsed}ms. ${count} notificação(ões) não lida(s).`);
      return count;
    } catch (error) {
      console.error('❌ Erro na verificação de notificações:', error);
      return 0;
    }
  },

  clearCache(): void {
    sentNotifications.clear();
    console.log('🔄 Cache de notificações limpo');
  },
};
