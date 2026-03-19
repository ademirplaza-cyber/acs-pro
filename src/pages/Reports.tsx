import { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Person, Visit, VisitStatus, Family } from '../types';
import {
  Download,
  Users,
  Baby,
  Heart,
  Activity,
  User,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Phone,
  Home,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Cigarette,
  BedDouble,
  Accessibility,
  Syringe,
  Briefcase,
  Wallet,
  ShieldAlert,
  Stethoscope,
  Dna,
  PersonStanding,
  Wine,
  FileDown,
  Filter,
  List,
} from 'lucide-react';

type ViewMode = 'OVERVIEW' | 'SEARCH' | 'FAMILIES';
type FamilyReportFilter = 'ALL' | 'BY_STREET' | 'BY_MICROAREA';

// ============================================
// HELPERS para PDF de relatórios
// ============================================

const calcAgeUtil = (bd: string): number => {
  const t = new Date(), b = new Date(bd);
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

const formatDateUtil = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};

const dwellingLabelUtil = (type?: string): string => {
  if (type === 'HOUSE') return 'Casa';
  if (type === 'APARTMENT') return 'Apartamento';
  if (type === 'SHACK') return 'Barraco/Favela';
  if (type === 'OTHER') return 'Outro';
  return '-';
};

function generateFamiliesReportPDF(
  title: string,
  families: Family[],
  peopleLookup: Map<string, Person[]>,
  agentName: string
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const mL = 14;
  const mR = 14;
  const cW = pageWidth - mL - mR;
  let y = 0;

  const checkBreak = (need: number) => {
    if (y + need > pageHeight - 18) {
      doc.addPage();
      y = 15;
    }
  };

  // ---- CABEÇALHO ----
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACS Top - Relatorio de Familias', mL, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, mL, 20);
  doc.setFontSize(8);
  doc.text(`Agente: ${agentName}  |  Emitido: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, mL, 27);
  doc.text(`Total: ${families.length} familia(s)`, mL, 32);
  y = 42;

  // ---- RESUMO GERAL ----
  const allPeople = families.flatMap(f => peopleLookup.get(f.id) || []);
  const totalPeople = allPeople.length;
  const totalPregnant = allPeople.filter(p => p.isPregnant).length;
  const totalHyper = allPeople.filter(p => p.hasHypertension).length;
  const totalDiab = allPeople.filter(p => p.hasDiabetes).length;
  const totalChildren = allPeople.filter(p => calcAgeUtil(p.birthDate) < 12).length;
  const totalElderly = allPeople.filter(p => calcAgeUtil(p.birthDate) >= 60).length;
  const totalBedridden = allPeople.filter(p => p.isBedridden).length;
  const totalDisabled = allPeople.filter(p => p.isDisabled).length;

  doc.setFillColor(240, 245, 255);
  doc.roundedRect(mL, y, cW, 16, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('RESUMO GERAL', mL + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(
    `Pessoas: ${totalPeople}  |  Gestantes: ${totalPregnant}  |  Hipertensos: ${totalHyper}  |  Diabeticos: ${totalDiab}  |  Criancas: ${totalChildren}  |  Idosos: ${totalElderly}  |  Acamados: ${totalBedridden}  |  PcD: ${totalDisabled}`,
    mL + 4, y + 12
  );
  y += 22;

  // ---- TABELA DE FAMÍLIAS ----
  // Cabeçalho da tabela
  const colWidths = [18, 52, 14, 20, 20, 20, 20, 18];
  const colHeaders = ['Familia', 'Endereco', 'Nº', 'Membros', 'Gestant.', 'Hipert.', 'Diabetic.', 'Idosos'];

  const drawTableHeader = () => {
    checkBreak(12);
    doc.setFillColor(37, 99, 235);
    doc.rect(mL, y, cW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    let xPos = mL + 2;
    for (let i = 0; i < colHeaders.length; i++) {
      doc.text(colHeaders[i], xPos, y + 5.5);
      xPos += colWidths[i];
    }
    y += 10;
    doc.setTextColor(0, 0, 0);
  };

  drawTableHeader();

  families.forEach((fam, idx) => {
    const members = peopleLookup.get(fam.id) || [];
    const rowHeight = 7;

    checkBreak(rowHeight + 2);

    // Zebra stripe
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(mL, y - 1, cW, rowHeight, 'F');
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    let xPos = mL + 2;

    // Família
    doc.setFont('helvetica', 'bold');
    doc.text(fam.familyNumber, xPos, y + 4);
    xPos += colWidths[0];

    // Endereço (truncado)
    doc.setFont('helvetica', 'normal');
    const addr = `${fam.address.street}, ${fam.address.number}${fam.address.neighborhood ? ' - ' + fam.address.neighborhood : ''}`;
    const maxAddrW = colWidths[1] - 2;
    const truncAddr = doc.getTextWidth(addr) > maxAddrW ? addr.substring(0, 30) + '...' : addr;
    doc.text(truncAddr, xPos, y + 4);
    xPos += colWidths[1];

    // Número de membros
    const memberCount = members.length.toString();
    doc.text(memberCount, xPos + 4, y + 4);
    xPos += colWidths[2];

    // Stats por família
    const fPreg = members.filter(p => p.isPregnant).length;
    const fHyper = members.filter(p => p.hasHypertension).length;
    const fDiab = members.filter(p => p.hasDiabetes).length;
    const fElderly = members.filter(p => calcAgeUtil(p.birthDate) >= 60).length;

    const statsValues = [memberCount, fPreg.toString(), fHyper.toString(), fDiab.toString(), fElderly.toString()];

    // Membros
    doc.text(statsValues[0], xPos + 6, y + 4);
    xPos += colWidths[3];
    // Gestantes
    if (fPreg > 0) { doc.setTextColor(219, 39, 119); doc.setFont('helvetica', 'bold'); }
    doc.text(statsValues[1], xPos + 6, y + 4);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal');
    xPos += colWidths[4];
    // Hipertensos
    if (fHyper > 0) { doc.setTextColor(220, 38, 38); doc.setFont('helvetica', 'bold'); }
    doc.text(statsValues[2], xPos + 6, y + 4);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal');
    xPos += colWidths[5];
    // Diabéticos
    if (fDiab > 0) { doc.setTextColor(79, 70, 229); doc.setFont('helvetica', 'bold'); }
    doc.text(statsValues[3], xPos + 6, y + 4);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal');
    xPos += colWidths[6];
    // Idosos
    if (fElderly > 0) { doc.setTextColor(124, 58, 237); doc.setFont('helvetica', 'bold'); }
    doc.text(statsValues[4], xPos + 6, y + 4);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal');

    y += rowHeight;

    // Repete header se virou de página
    if (y > pageHeight - 25 && idx < families.length - 1) {
      doc.addPage();
      y = 15;
      drawTableHeader();
    }
  });

  // ---- DETALHAMENTO POR FAMÍLIA ----
  y += 8;
  checkBreak(14);
  doc.setFillColor(109, 40, 217);
  doc.roundedRect(mL, y, cW, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHAMENTO POR FAMILIA', mL + 4, y + 6.5);
  y += 14;

  families.forEach((fam) => {
    const members = peopleLookup.get(fam.id) || [];

    // Título da família
    checkBreak(20);
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(mL, y, cW, 8, 1.5, 1.5, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`Familia ${fam.familyNumber} - ${fam.address.street}, ${fam.address.number}`, mL + 3, y + 5.5);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`${members.length} membro(s)`, pageWidth - mR - 3, y + 5.5, { align: 'right' });
    y += 11;

    // Endereço completo
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const fullAddr = [fam.address.street, fam.address.number, fam.address.complement, fam.address.neighborhood, fam.address.city, fam.address.state].filter(Boolean).join(', ');
    doc.text(`Endereco: ${fullAddr}`, mL + 3, y);
    y += 4;

    const infraParts: string[] = [];
    infraParts.push(`Saneamento: ${fam.hasBasicSanitation ? 'Sim' : 'Nao'}`);
    infraParts.push(`Agua: ${fam.hasRunningWater ? 'Sim' : 'Nao'}`);
    infraParts.push(`Energia: ${fam.hasElectricity ? 'Sim' : 'Nao'}`);
    infraParts.push(`Tipo: ${dwellingLabelUtil(fam.dwellingType)}`);
    doc.text(infraParts.join('  |  '), mL + 3, y);
    y += 5;

    if (members.length === 0) {
      doc.setTextColor(150, 150, 150);
      doc.text('Nenhum membro cadastrado', mL + 6, y);
      y += 6;
    } else {
      members.forEach((p) => {
        checkBreak(14);
        const age = calcAgeUtil(p.birthDate);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        let nameText = `  ${p.name}`;
        if (p.isHeadOfFamily) nameText += '  [RESPONSAVEL]';
        doc.text(nameText, mL + 3, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`${age} anos  |  ${p.gender === 'F' ? 'Fem' : p.gender === 'M' ? 'Masc' : 'Outro'}`, pageWidth - mR - 3, y, { align: 'right' });
        y += 4;

        // Condições em uma linha
        const tags: string[] = [];
        if (p.hasHypertension) tags.push('HAS');
        if (p.hasDiabetes) tags.push('DM');
        if (p.usesInsulin) tags.push('Insulina');
        if (p.isPregnant && !p.isPuerperium) tags.push('Gestante');
        if (p.isPregnant && p.isPuerperium) tags.push('Puerpera');
        if (p.isHighRiskPregnancy && p.isPregnant) tags.push('Alto Risco');
        if (p.isDisabled) tags.push('PcD');
        if (p.isBedridden) tags.push('Acamado');
        if (p.hasMobilityDifficulty) tags.push('Dif.Locom.');
        if (p.isSmoker) tags.push('Fumante');
        if (p.isAlcoholic) tags.push('Alcoolatra');
        if (p.isDrugUser) tags.push('Drogas');
        if (p.receivesBolsaFamilia) tags.push('BF');
        if (age < 12) tags.push('Crianca');
        if (age >= 60) tags.push('Idoso');

        if (tags.length > 0) {
          doc.setFontSize(6.5);
          doc.setTextColor(109, 40, 217);
          doc.text(`    ${tags.join('  |  ')}`, mL + 3, y);
        } else {
          doc.setFontSize(6.5);
          doc.setTextColor(34, 139, 34);
          doc.text('    Sem condicoes especiais', mL + 3, y);
        }
        y += 5;
      });
    }

    y += 3;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(mL, y, pageWidth - mR, y);
    y += 4;
  });

  // ---- RODAPÉ ----
  const totalPgs = doc.getNumberOfPages();
  for (let i = 1; i <= totalPgs; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `ACS Top - acstop.com.br  |  ${title}  |  Pagina ${i} de ${totalPgs}`,
      pageWidth / 2, pageHeight - 8, { align: 'center' }
    );
  }

  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  doc.save(`Relatorio_${safeTitle}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function generateSearchResultsPDF(
  filtered: Person[],
  families: Family[],
  agentName: string,
  activeFiltersDescription: string
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const mL = 14;
  const mR = 14;
  const cW = pageWidth - mL - mR;
  let y = 0;

  const checkBreak = (need: number) => {
    if (y + need > pageHeight - 18) { doc.addPage(); y = 15; }
  };

  // ---- CABEÇALHO ----
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACS Top - Resultado da Busca', mL, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Filtros: ${activeFiltersDescription || 'Nenhum'}`, mL, 20);
  doc.setFontSize(8);
  doc.text(`Agente: ${agentName}  |  ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, mL, 27);
  doc.text(`Total: ${filtered.length} pessoa(s)`, mL, 32);
  y = 42;

  if (filtered.length === 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum resultado encontrado para os filtros aplicados.', mL, y + 10);
  } else {
    filtered.forEach((p, idx) => {
      const age = calcAgeUtil(p.birthDate);
      const fam = families.find(f => f.id === p.familyId);

      checkBreak(18);

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(mL, y - 1, cW, 16, 1, 1, 'F');
      }

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`${idx + 1}. ${p.name}`, mL + 2, y + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7.5);
      doc.text(`${age} anos  |  ${p.gender === 'F' ? 'Feminino' : p.gender === 'M' ? 'Masculino' : 'Outro'}`, pageWidth - mR - 2, y + 3, { align: 'right' });

      y += 5;

      if (fam) {
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(`Fam. ${fam.familyNumber} - ${fam.address.street}, ${fam.address.number}${fam.address.neighborhood ? ' - ' + fam.address.neighborhood : ''}`, mL + 4, y + 2);
        y += 3.5;
      }

      if (p.phone) {
        doc.text(`Tel: ${p.phone}`, mL + 4, y + 2);
        y += 3.5;
      }

      // Tags
      const tags: string[] = [];
      if (p.hasHypertension) tags.push('HAS');
      if (p.hasDiabetes) tags.push('DM');
      if (p.usesInsulin) tags.push('Insulina');
      if (p.isPregnant) tags.push('Gestante');
      if (p.isHighRiskPregnancy && p.isPregnant) tags.push('Alto Risco');
      if (p.isBedridden) tags.push('Acamado');
      if (p.isDisabled) tags.push('PcD');
      if (p.isSmoker) tags.push('Fumante');
      if (p.isAlcoholic) tags.push('Alcoolatra');
      if (p.isDrugUser) tags.push('Drogas');
      if (p.receivesBolsaFamilia) tags.push('Bolsa Familia');
      if (age < 12) tags.push('Crianca');
      if (age >= 60) tags.push('Idoso');

      if (tags.length > 0) {
        doc.setFontSize(6.5);
        doc.setTextColor(109, 40, 217);
        doc.text(tags.join('  |  '), mL + 4, y + 2);
        y += 4;
      }

      y += 3;
    });
  }

  // ---- RODAPÉ ----
  const totalPgs = doc.getNumberOfPages();
  for (let i = 1; i <= totalPgs; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`ACS Top - acstop.com.br  |  Busca  |  Pagina ${i} de ${totalPgs}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  doc.save(`Busca_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const Reports = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('OVERVIEW');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);

  const [families, setFamilies] = useState<Family[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);

  // Lookup de pessoas por familyId
  const peopleLookup = useMemo(() => {
    const map = new Map<string, Person[]>();
    allPeople.forEach(p => {
      const list = map.get(p.familyId) || [];
      list.push(p);
      map.set(p.familyId, list);
    });
    return map;
  }, [allPeople]);

  // ---- BUSCA state ----
  const [searchName, setSearchName] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'M' | 'F'>('ALL');
  const [ageFrom, setAgeFrom] = useState('');
  const [ageTo, setAgeTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [fHypertensive, setFHypertensive] = useState(false);
  const [fDiabetic, setFDiabetic] = useState(false);
  const [fInsulin, setFInsulin] = useState(false);
  const [fPregnant, setFPregnant] = useState(false);
  const [fHighRisk, setFHighRisk] = useState(false);
  const [fSmoker, setFSmoker] = useState(false);
  const [fBedridden, setFBedridden] = useState(false);
  const [fMobility, setFMobility] = useState(false);
  const [fDisabled, setFDisabled] = useState(false);
  const [fBolsaFamilia, setFBolsaFamilia] = useState(false);
  const [fWorking, setFWorking] = useState(false);
  const [fChronic, setFChronic] = useState(false);
  const [fRareDiseases, setFRareDiseases] = useState(false);
  const [fChildren, setFChildren] = useState(false);
  const [fElderly, setFElderly] = useState(false);
  const [fAlcoholic, setFAlcoholic] = useState(false);
  const [fDrugUser, setFDrugUser] = useState(false);

  // ---- FAMILIAS tab state ----
  const [familyReportFilter, setFamilyReportFilter] = useState<FamilyReportFilter>('ALL');
  const [selectedStreet, setSelectedStreet] = useState<string>('');
  const [selectedMicroarea, setSelectedMicroarea] = useState<string>('');
  const [familySearchTerm, setFamilySearchTerm] = useState('');

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [fam, vis] = await Promise.all([api.getFamilies(user.id), api.getVisits(user.id)]);
      setFamilies(fam);
      setVisits(vis);
      const arrays = await Promise.all(fam.map(f => api.getPeople(f.id)));
      setAllPeople(arrays.flat());
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const calcAge = (bd: string): number => {
    const t = new Date(), b = new Date(bd);
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
  };

  const calcGA = (dum: string) => {
    const d = new Date(dum), t = new Date();
    const diff = Math.abs(t.getTime() - d.getTime());
    const total = Math.floor(diff / 86400000);
    return { weeks: Math.floor(total / 7), days: total % 7 };
  };

  // ---- Listas únicas de ruas e micro-áreas ----
  const uniqueStreets = useMemo(() => {
    const set = new Set<string>();
    families.forEach(f => {
      if (f.address.street && f.address.street.trim()) set.add(f.address.street.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [families]);

  const uniqueMicroareas = useMemo(() => {
    const set = new Set<string>();
    families.forEach(f => {
      if (f.address.neighborhood && f.address.neighborhood.trim()) set.add(f.address.neighborhood.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [families]);

  // ---- Famílias filtradas (aba Famílias) ----
  const filteredFamilies = useMemo(() => {
    let result = families;

    if (familyReportFilter === 'BY_STREET' && selectedStreet) {
      result = result.filter(f => f.address.street.trim() === selectedStreet);
    }

    if (familyReportFilter === 'BY_MICROAREA' && selectedMicroarea) {
      result = result.filter(f => f.address.neighborhood.trim() === selectedMicroarea);
    }

    if (familySearchTerm.trim()) {
      const term = familySearchTerm.toLowerCase();
      result = result.filter(f =>
        f.familyNumber.toLowerCase().includes(term) ||
        f.address.street.toLowerCase().includes(term) ||
        f.address.neighborhood.toLowerCase().includes(term) ||
        f.address.number.includes(term)
      );
    }

    return result;
  }, [families, familyReportFilter, selectedStreet, selectedMicroarea, familySearchTerm]);

  // ---- Filtros busca ----
  const filterCount = [
    fHypertensive, fDiabetic, fInsulin, fPregnant, fHighRisk,
    fSmoker, fBedridden, fMobility, fDisabled, fBolsaFamilia,
    fWorking, fChronic, fRareDiseases, fChildren, fElderly,
    fAlcoholic, fDrugUser,
  ].filter(Boolean).length + (genderFilter !== 'ALL' ? 1 : 0) + (ageFrom ? 1 : 0) + (ageTo ? 1 : 0);

  const clearAll = () => {
    setSearchName(''); setGenderFilter('ALL'); setAgeFrom(''); setAgeTo('');
    setFHypertensive(false); setFDiabetic(false); setFInsulin(false);
    setFPregnant(false); setFHighRisk(false); setFSmoker(false);
    setFBedridden(false); setFMobility(false); setFDisabled(false);
    setFBolsaFamilia(false); setFWorking(false); setFChronic(false);
    setFRareDiseases(false); setFChildren(false); setFElderly(false);
    setFAlcoholic(false); setFDrugUser(false);
  };

  const activeFiltersDescription = useMemo(() => {
    const parts: string[] = [];
    if (searchName.trim()) parts.push(`Nome: "${searchName}"`);
    if (genderFilter !== 'ALL') parts.push(genderFilter === 'M' ? 'Homens' : 'Mulheres');
    if (ageFrom) parts.push(`Idade >= ${ageFrom}`);
    if (ageTo) parts.push(`Idade <= ${ageTo}`);
    if (fHypertensive) parts.push('Hipertensos');
    if (fDiabetic) parts.push('Diabeticos');
    if (fInsulin) parts.push('Insulina');
    if (fPregnant) parts.push('Gestantes');
    if (fHighRisk) parts.push('Alto Risco');
    if (fSmoker) parts.push('Fumantes');
    if (fBedridden) parts.push('Acamados');
    if (fMobility) parts.push('Dif.Locomocao');
    if (fDisabled) parts.push('PcD');
    if (fBolsaFamilia) parts.push('Bolsa Familia');
    if (fWorking) parts.push('Trabalha');
    if (fChronic) parts.push('D.Cronicas');
    if (fRareDiseases) parts.push('D.Raras');
    if (fChildren) parts.push('Criancas');
    if (fElderly) parts.push('Idosos');
    if (fAlcoholic) parts.push('Alcoolatras');
    if (fDrugUser) parts.push('Drogas');
    return parts.join(', ');
  }, [searchName, genderFilter, ageFrom, ageTo, fHypertensive, fDiabetic, fInsulin, fPregnant, fHighRisk, fSmoker, fBedridden, fMobility, fDisabled, fBolsaFamilia, fWorking, fChronic, fRareDiseases, fChildren, fElderly, fAlcoholic, fDrugUser]);

  const filtered = useMemo(() => {
    let r = allPeople;
    if (searchName.trim()) { const s = searchName.toLowerCase(); r = r.filter(p => p.name.toLowerCase().includes(s)); }
    if (genderFilter !== 'ALL') r = r.filter(p => p.gender === genderFilter);
    const fa = ageFrom ? parseInt(ageFrom) : NaN, ta = ageTo ? parseInt(ageTo) : NaN;
    if (!isNaN(fa) || !isNaN(ta)) r = r.filter(p => { const a = calcAge(p.birthDate); return (!isNaN(fa) ? a >= fa : true) && (!isNaN(ta) ? a <= ta : true); });
    if (fChildren) r = r.filter(p => calcAge(p.birthDate) < 12);
    if (fElderly) r = r.filter(p => calcAge(p.birthDate) >= 60);
    if (fHypertensive) r = r.filter(p => p.hasHypertension);
    if (fDiabetic) r = r.filter(p => p.hasDiabetes);
    if (fInsulin) r = r.filter(p => p.usesInsulin);
    if (fPregnant) r = r.filter(p => p.isPregnant);
    if (fHighRisk) r = r.filter(p => p.isPregnant && p.isHighRiskPregnancy);
    if (fSmoker) r = r.filter(p => p.isSmoker);
    if (fBedridden) r = r.filter(p => p.isBedridden);
    if (fMobility) r = r.filter(p => p.hasMobilityDifficulty);
    if (fDisabled) r = r.filter(p => p.isDisabled);
    if (fBolsaFamilia) r = r.filter(p => p.receivesBolsaFamilia);
    if (fWorking) r = r.filter(p => p.isWorking);
    if (fChronic) r = r.filter(p => p.chronicDiseases && p.chronicDiseases.length > 0);
    if (fRareDiseases) r = r.filter(p => p.rareDiseases && p.rareDiseases.trim() !== '');
    if (fAlcoholic) r = r.filter(p => p.isAlcoholic);
    if (fDrugUser) r = r.filter(p => p.isDrugUser);
    return r;
  }, [allPeople, searchName, genderFilter, ageFrom, ageTo, fHypertensive, fDiabetic, fInsulin, fPregnant, fHighRisk, fSmoker, fBedridden, fMobility, fDisabled, fBolsaFamilia, fWorking, fChronic, fRareDiseases, fChildren, fElderly, fAlcoholic, fDrugUser]);

  const stats = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const ms = new Date(yr, mo - 1, 1), me = new Date(yr, mo, 0, 23, 59, 59);
    const mv = visits.filter(v => { const d = new Date(v.status === VisitStatus.COMPLETED && v.completedDate ? v.completedDate : v.scheduledDate); return d >= ms && d <= me; });
    const cv = mv.filter(v => v.status === VisitStatus.COMPLETED);
    const vi = new Set(cv.map(v => v.familyId));
    return {
      people: allPeople.length, families: families.length,
      pregnant: allPeople.filter(p => p.isPregnant).length,
      hyper: allPeople.filter(p => p.hasHypertension).length,
      diabetic: allPeople.filter(p => p.hasDiabetes).length,
      children: allPeople.filter(p => calcAge(p.birthDate) < 12).length,
      under2: allPeople.filter(p => calcAge(p.birthDate) < 2).length,
      elderly: allPeople.filter(p => calcAge(p.birthDate) >= 60).length,
      smokers: allPeople.filter(p => p.isSmoker).length,
      bedridden: allPeople.filter(p => p.isBedridden).length,
      insulin: allPeople.filter(p => p.usesInsulin).length,
      alcoholic: allPeople.filter(p => p.isAlcoholic).length,
      drugUser: allPeople.filter(p => p.isDrugUser).length,
      totalVisits: mv.length, completed: cv.length,
      coverage: families.length > 0 ? (vi.size / families.length * 100) : 0,
      avg: cv.length / 22,
    };
  }, [allPeople, families, visits, selectedMonth]);

  const alerts = useMemo(() => {
    const check = (list: Person[], days: number) => list.filter(p => {
      const last = visits.filter(v => v.familyId === p.familyId && v.status === VisitStatus.COMPLETED)
        .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())[0];
      if (!last) return true;
      return Math.floor((Date.now() - new Date(last.completedDate!).getTime()) / 86400000) > days;
    }).length;
    return {
      preg: check(allPeople.filter(p => p.isPregnant), 30),
      hyper: check(allPeople.filter(p => p.hasHypertension), 60),
      diab: check(allPeople.filter(p => p.hasDiabetes), 60),
    };
  }, [allPeople, visits]);

  // ---- Export JSON (mantém o legado) ----
  const doExport = () => {
    const obj = viewMode === 'SEARCH' ? {
      tipo: 'busca', total: filtered.length, gerado: new Date().toLocaleString('pt-BR'), agente: user?.name,
      resultados: filtered.map(p => { const f = families.find(x => x.id === p.familyId); return { nome: p.name, idade: calcAge(p.birthDate), familia: f?.familyNumber || '', telefone: p.phone || '' }; }),
    } : { tipo: 'relatorio', periodo: selectedMonth, agente: user?.name, gerado: new Date().toLocaleString('pt-BR'), dados: stats };
    const b = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u;
    a.download = viewMode === 'SEARCH' ? `busca-${new Date().toISOString().slice(0, 10)}.json` : `relatorio-${selectedMonth}.json`;
    a.click(); URL.revokeObjectURL(u);
  };

  // ---- Export PDF (busca) ----
  const doExportSearchPDF = () => {
    generateSearchResultsPDF(filtered, families, user?.name || 'Agente', activeFiltersDescription);
  };

  // ---- Export PDF (famílias) ----
  const doExportFamiliesPDF = () => {
    let title = 'Todas as Familias';
    if (familyReportFilter === 'BY_STREET' && selectedStreet) {
      title = `Familias - Rua: ${selectedStreet}`;
    } else if (familyReportFilter === 'BY_MICROAREA' && selectedMicroarea) {
      title = `Familias - Micro-area: ${selectedMicroarea}`;
    }
    if (familySearchTerm.trim()) {
      title += ` (busca: "${familySearchTerm}")`;
    }
    generateFamiliesReportPDF(title, filteredFamilies, peopleLookup, user?.name || 'Agente');
  };

  const Pill = ({ on, label, icon: Icon, onClick }: { on: boolean; label: string; icon: any; onClick: () => void }) => (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${on ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 active:bg-slate-100'}`}>
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Relatórios</h1>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 rounded-lg bg-slate-100 active:bg-slate-200 transition-colors">
            <RefreshCw size={16} className="text-slate-600" />
          </button>
          {viewMode !== 'FAMILIES' && (
            <button onClick={doExport} className="p-2 rounded-lg bg-slate-100 active:bg-slate-200 transition-colors">
              <Download size={16} className="text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Tab switch — 3 abas */}
      <div className="grid grid-cols-3 bg-slate-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => setViewMode('OVERVIEW')}
          className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'OVERVIEW' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setViewMode('SEARCH')}
          className={`py-2.5 rounded-lg text-sm font-semibold transition-all relative ${viewMode === 'SEARCH' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          Buscar
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{filterCount}</span>
          )}
        </button>
        <button
          onClick={() => setViewMode('FAMILIES')}
          className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'FAMILIES' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          Famílias
        </button>
      </div>

      {/* =================== VISÃO GERAL =================== */}
      {viewMode === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Users, label: 'Pessoas', v: stats.people, bg: 'bg-blue-50', fg: 'text-blue-600' },
              { icon: Home, label: 'Famílias', v: stats.families, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
              { icon: Baby, label: 'Gestantes', v: stats.pregnant, bg: 'bg-pink-50', fg: 'text-pink-600' },
              { icon: Heart, label: 'Hipertensos', v: stats.hyper, bg: 'bg-red-50', fg: 'text-red-600' },
              { icon: Activity, label: 'Diabéticos', v: stats.diabetic, bg: 'bg-indigo-50', fg: 'text-indigo-600' },
              { icon: User, label: 'Idosos', v: stats.elderly, bg: 'bg-purple-50', fg: 'text-purple-600' },
            ].map(({ icon: Ic, label, v, bg, fg }) => (
              <div key={label} className={`${bg} rounded-xl p-3`}>
                <Ic size={16} className={`${fg} mb-1.5`} />
                <p className="text-lg font-bold text-slate-800 leading-none">{v}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span className="text-sm font-bold">Produtividade</span>
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
                className="bg-white/10 rounded-lg px-2 py-1 text-[11px] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 mb-1">Visitas</p>
                <p className="text-xl font-bold leading-none">{stats.completed}<span className="text-sm text-slate-400">/{stats.totalVisits}</span></p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 mb-1">Cobertura</p>
                <p className="text-xl font-bold leading-none">{stats.coverage.toFixed(0)}%</p>
                <div className="w-full bg-white/10 rounded-full h-1 mt-1.5">
                  <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${Math.min(stats.coverage, 100)}%` }} />
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 mb-1">Média/dia</p>
                <p className="text-xl font-bold leading-none">{stats.avg.toFixed(1)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 mb-1">Crianças &lt;2a</p>
                <p className="text-xl font-bold leading-none">{stats.under2}</p>
              </div>
            </div>
          </div>

          {(alerts.preg > 0 || alerts.hyper > 0 || alerts.diab > 0) && (
            <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-100/50">
                <AlertTriangle size={14} className="text-red-600" />
                <span className="text-xs font-bold text-red-800">Atenção necessária</span>
              </div>
              <div className="divide-y divide-red-100">
                {alerts.preg > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Baby size={14} className="text-red-500" />
                      <span className="text-xs text-red-800">Gestantes sem visita (+30d)</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{alerts.preg}</span>
                  </div>
                )}
                {alerts.hyper > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Heart size={14} className="text-red-500" />
                      <span className="text-xs text-red-800">Hipertensos sem acompanhar (+60d)</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{alerts.hyper}</span>
                  </div>
                )}
                {alerts.diab > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-red-500" />
                      <span className="text-xs text-red-800">Diabéticos sem acompanhar (+60d)</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{alerts.diab}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { icon: Cigarette, label: 'Fumantes', v: stats.smokers },
              { icon: BedDouble, label: 'Acamados', v: stats.bedridden },
              { icon: Syringe, label: 'Insulina', v: stats.insulin },
              { icon: Baby, label: 'Crianças', v: stats.children },
              { icon: Wine, label: 'Alcoólatras', v: stats.alcoholic },
              { icon: AlertTriangle, label: 'Drogas', v: stats.drugUser },
            ].map(({ icon: Ic, label, v }) => (
              <div key={label} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Ic size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-600">{label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================== BUSCA =================== */}
      {viewMode === 'SEARCH' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text" value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Nome do paciente..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
            {searchName && <button onClick={() => setSearchName('')}><X size={14} className="text-slate-400" /></button>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(['ALL', 'M', 'F'] as const).map(g => (
              <button
                key={g}
                onClick={() => { setGenderFilter(g); if (g !== 'F') { setFPregnant(false); setFHighRisk(false); } }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  genderFilter === g ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {g === 'ALL' ? 'Todos' : g === 'M' ? 'Homens' : 'Mulheres'}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-auto">
              <input type="number" min="0" max="120" value={ageFrom} onChange={(e) => setAgeFrom(e.target.value)} placeholder="De" className="w-11 px-1 py-2 border border-slate-200 rounded-lg text-xs text-center outline-none focus:border-blue-400 bg-white" />
              <span className="text-slate-400 text-[10px]">–</span>
              <input type="number" min="0" max="120" value={ageTo} onChange={(e) => setAgeTo(e.target.value)} placeholder="Até" className="w-11 px-1 py-2 border border-slate-200 rounded-lg text-xs text-center outline-none focus:border-blue-400 bg-white" />
              <span className="text-[10px] text-slate-400">anos</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Condições de saúde</span>
                {filterCount > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{filterCount}</span>}
              </div>
              {showFilters ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {showFilters && (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Pill on={fChildren} label="Crianças" icon={Baby} onClick={() => setFChildren(!fChildren)} />
                  <Pill on={fElderly} label="Idosos" icon={User} onClick={() => setFElderly(!fElderly)} />
                  <Pill on={fHypertensive} label="Hipertensos" icon={Heart} onClick={() => setFHypertensive(!fHypertensive)} />
                  <Pill on={fDiabetic} label="Diabéticos" icon={Activity} onClick={() => { setFDiabetic(!fDiabetic); if (fDiabetic) setFInsulin(false); }} />
                  {fDiabetic && <Pill on={fInsulin} label="Insulina" icon={Syringe} onClick={() => setFInsulin(!fInsulin)} />}
                  {genderFilter === 'F' && (
                    <>
                      <Pill on={fPregnant} label="Gestantes" icon={Baby} onClick={() => { setFPregnant(!fPregnant); if (fPregnant) setFHighRisk(false); }} />
                      {fPregnant && <Pill on={fHighRisk} label="Alto Risco" icon={ShieldAlert} onClick={() => setFHighRisk(!fHighRisk)} />}
                    </>
                  )}
                  <Pill on={fSmoker} label="Fumantes" icon={Cigarette} onClick={() => setFSmoker(!fSmoker)} />
                  <Pill on={fBedridden} label="Acamados" icon={BedDouble} onClick={() => setFBedridden(!fBedridden)} />
                  <Pill on={fMobility} label="Dif. Locomoção" icon={PersonStanding} onClick={() => setFMobility(!fMobility)} />
                  <Pill on={fDisabled} label="PcD" icon={Accessibility} onClick={() => setFDisabled(!fDisabled)} />
                  <Pill on={fBolsaFamilia} label="Bolsa Família" icon={Wallet} onClick={() => setFBolsaFamilia(!fBolsaFamilia)} />
                  <Pill on={fWorking} label="Trabalha" icon={Briefcase} onClick={() => setFWorking(!fWorking)} />
                  <Pill on={fChronic} label="D. Crônicas" icon={Stethoscope} onClick={() => setFChronic(!fChronic)} />
                  <Pill on={fRareDiseases} label="D. Raras" icon={Dna} onClick={() => setFRareDiseases(!fRareDiseases)} />
                  <Pill on={fAlcoholic} label="Alcoólatras" icon={Wine} onClick={() => setFAlcoholic(!fAlcoholic)} />
                  <Pill on={fDrugUser} label="Drogas" icon={AlertTriangle} onClick={() => setFDrugUser(!fDrugUser)} />
                </div>
                {filterCount > 0 && (
                  <button onClick={clearAll} className="text-xs text-blue-600 font-semibold">Limpar filtros</button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-sm text-slate-800">
                <span className="font-bold text-blue-600 text-lg">{filtered.length}</span>
                <span className="text-slate-500 ml-1 text-xs">{filtered.length === 1 ? 'resultado' : 'resultados'}</span>
              </p>
              {filtered.length > 0 && (
                <div className="flex items-center gap-3">
                  <button onClick={doExportSearchPDF} className="flex items-center gap-1 text-xs text-purple-600 font-medium active:text-purple-800">
                    <FileDown size={12} /> PDF
                  </button>
                  <button onClick={doExport} className="flex items-center gap-1 text-xs text-slate-500 font-medium active:text-slate-800">
                    <Download size={12} /> JSON
                  </button>
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">Nenhum resultado</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[65vh] overflow-y-auto">
                {filtered.map(p => {
                  const age = calcAge(p.birthDate);
                  const fam = families.find(f => f.id === p.familyId);
                  return (
                    <div key={p.id} className="px-4 py-3 active:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${p.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                          {p.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-sm text-slate-800 truncate">{p.name}</span>
                            <span className="text-[11px] text-slate-400 flex-shrink-0">{age} anos</span>
                          </div>
                          {fam && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-slate-300 flex-shrink-0" />
                              <span className="text-[11px] text-slate-400 truncate">Fam. {fam.familyNumber} – {fam.address.street}, {fam.address.number}</span>
                            </div>
                          )}
                          {p.phone && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone size={10} className="text-slate-300" />
                              <span className="text-[11px] text-slate-400">{p.phone}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.isPregnant && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-medium">
                                <Baby size={10} />Gestante
                                {p.lastMenstrualPeriod && (() => { const g = calcGA(p.lastMenstrualPeriod); return ` ${g.weeks}s${g.days}d`; })()}
                              </span>
                            )}
                            {p.isPregnant && p.isHighRiskPregnancy && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">
                                <ShieldAlert size={10} />Risco
                              </span>
                            )}
                            {p.hasHypertension && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                <Heart size={10} />HAS
                              </span>
                            )}
                            {p.hasDiabetes && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                                <Activity size={10} />DM
                              </span>
                            )}
                            {p.usesInsulin && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-medium">
                                <Syringe size={10} />Insulina
                              </span>
                            )}
                            {p.isSmoker && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                <Cigarette size={10} />Fumante
                              </span>
                            )}
                            {p.isBedridden && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                <BedDouble size={10} />Acamado
                              </span>
                            )}
                            {p.hasMobilityDifficulty && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                                <PersonStanding size={10} />Locomoção
                              </span>
                            )}
                            {p.isDisabled && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                                <Accessibility size={10} />PcD
                              </span>
                            )}
                            {p.receivesBolsaFamilia && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                                <Wallet size={10} />BF{p.nisNumber ? ` ${p.nisNumber}` : ''}
                              </span>
                            )}
                            {p.isWorking && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                <Briefcase size={10} />Trabalha
                              </span>
                            )}
                            {p.chronicDiseases && p.chronicDiseases.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded font-medium">
                                <Stethoscope size={10} />{p.chronicDiseases.length} crônica{p.chronicDiseases.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {p.rareDiseases && p.rareDiseases.trim() !== '' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-fuchsia-50 text-fuchsia-700 px-1.5 py-0.5 rounded font-medium">
                                <Dna size={10} />Rara
                              </span>
                            )}
                            {p.isAlcoholic && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-medium">
                                <Wine size={10} />Alcoólatra
                              </span>
                            )}
                            {p.isDrugUser && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">
                                <AlertTriangle size={10} />Drogas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== FAMÍLIAS =================== */}
      {viewMode === 'FAMILIES' && (
        <div className="space-y-3">
          {/* Filtros de tipo */}
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { key: 'ALL' as FamilyReportFilter, label: 'Todas', icon: List },
              { key: 'BY_STREET' as FamilyReportFilter, label: 'Por Rua', icon: MapPin },
              { key: 'BY_MICROAREA' as FamilyReportFilter, label: 'Por Micro-área', icon: Filter },
            ]).map(({ key, label, icon: Ic }) => (
              <button
                key={key}
                onClick={() => { setFamilyReportFilter(key); setSelectedStreet(''); setSelectedMicroarea(''); }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  familyReportFilter === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 active:bg-slate-50'
                }`}
              >
                <Ic size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Seletor de rua */}
          {familyReportFilter === 'BY_STREET' && (
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Selecione a rua:</label>
              {uniqueStreets.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma rua encontrada nos cadastros.</p>
              ) : (
                <select
                  value={selectedStreet}
                  onChange={(e) => setSelectedStreet(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">-- Escolha uma rua --</option>
                  {uniqueStreets.map(street => {
                    const count = families.filter(f => f.address.street.trim() === street).length;
                    return (
                      <option key={street} value={street}>
                        {street} ({count} {count === 1 ? 'família' : 'famílias'})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {/* Seletor de micro-área */}
          {familyReportFilter === 'BY_MICROAREA' && (
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Selecione a micro-área (bairro):</label>
              {uniqueMicroareas.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma micro-área/bairro encontrado nos cadastros.</p>
              ) : (
                <select
                  value={selectedMicroarea}
                  onChange={(e) => setSelectedMicroarea(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">-- Escolha uma micro-área --</option>
                  {uniqueMicroareas.map(area => {
                    const count = families.filter(f => f.address.neighborhood.trim() === area).length;
                    return (
                      <option key={area} value={area}>
                        {area} ({count} {count === 1 ? 'família' : 'famílias'})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {/* Busca dentro das famílias */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={familySearchTerm}
              onChange={(e) => setFamilySearchTerm(e.target.value)}
              placeholder="Buscar por número, rua ou bairro..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
            {familySearchTerm && <button onClick={() => setFamilySearchTerm('')}><X size={14} className="text-slate-400" /></button>}
          </div>

          {/* Resultado + Exportar PDF */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-sm text-slate-800">
                <span className="font-bold text-blue-600 text-lg">{filteredFamilies.length}</span>
                <span className="text-slate-500 ml-1 text-xs">{filteredFamilies.length === 1 ? 'família' : 'famílias'}</span>
                {familyReportFilter === 'BY_STREET' && selectedStreet && (
                  <span className="text-slate-400 ml-1 text-xs">em {selectedStreet}</span>
                )}
                {familyReportFilter === 'BY_MICROAREA' && selectedMicroarea && (
                  <span className="text-slate-400 ml-1 text-xs">em {selectedMicroarea}</span>
                )}
              </p>
              {filteredFamilies.length > 0 && (
                <button
                  onClick={doExportFamiliesPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold active:bg-green-700 transition-colors shadow-sm"
                >
                  <FileDown size={14} />
                  <span>Exportar PDF</span>
                </button>
              )}
            </div>

            {filteredFamilies.length === 0 ? (
              <div className="py-16 text-center">
                <Home size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">
                  {familyReportFilter === 'BY_STREET' && !selectedStreet
                    ? 'Selecione uma rua acima'
                    : familyReportFilter === 'BY_MICROAREA' && !selectedMicroarea
                    ? 'Selecione uma micro-área acima'
                    : 'Nenhuma família encontrada'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[65vh] overflow-y-auto">
                {filteredFamilies.map(fam => {
                  const members = peopleLookup.get(fam.id) || [];
                  const pregCount = members.filter(p => p.isPregnant).length;
                  const hyperCount = members.filter(p => p.hasHypertension).length;
                  const diabCount = members.filter(p => p.hasDiabetes).length;
                  const elderlyCount = members.filter(p => calcAge(p.birthDate) >= 60).length;
                  const childCount = members.filter(p => calcAge(p.birthDate) < 12).length;

                  return (
                    <div key={fam.id} className="px-4 py-3 active:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Home size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-sm text-slate-800">Família {fam.familyNumber}</span>
                            <span className="text-[11px] text-slate-400 flex-shrink-0">{members.length} membro{members.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-slate-300 flex-shrink-0" />
                            <span className="text-[11px] text-slate-400 truncate">
                              {fam.address.street}, {fam.address.number}
                              {fam.address.neighborhood ? ` - ${fam.address.neighborhood}` : ''}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {!fam.hasBasicSanitation && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                <AlertTriangle size={10} />Sem saneamento
                              </span>
                            )}
                            {!fam.hasRunningWater && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                                <AlertTriangle size={10} />Sem água
                              </span>
                            )}
                            {!fam.hasElectricity && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">
                                <AlertTriangle size={10} />Sem energia
                              </span>
                            )}
                            {pregCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-medium">
                                <Baby size={10} />{pregCount} gestante{pregCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {hyperCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                <Heart size={10} />{hyperCount} HAS
                              </span>
                            )}
                            {diabCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                                <Activity size={10} />{diabCount} DM
                              </span>
                            )}
                            {elderlyCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                                <User size={10} />{elderlyCount} idoso{elderlyCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {childCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                <Baby size={10} />{childCount} criança{childCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {members.length === 0 && (
                              <span className="inline-flex items-center text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                                Sem membros
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
