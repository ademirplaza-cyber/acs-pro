import { jsPDF } from 'jspdf';
import { Family, Person } from '../types';

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const calculateGestationalAge = (dum: string): string => {
  const dumDate = new Date(dum);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - dumDate.getTime());
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  const diffDays = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
  return `${diffWeeks}s ${diffDays}d`;
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};

const genderLabel = (gender: string): string => {
  if (gender === 'F') return 'Feminino';
  if (gender === 'M') return 'Masculino';
  return 'Outro';
};

const dwellingLabel = (type?: string): string => {
  if (type === 'HOUSE') return 'Casa';
  if (type === 'APARTMENT') return 'Apartamento';
  if (type === 'SHACK') return 'Barraco/Favela';
  if (type === 'OTHER') return 'Outro';
  return 'Não informado';
};

export function exportFamilyPDF(family: Family, people: Person[], agentName: string): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 0;

  // ============================================
  // HELPERS
  // ============================================

  const checkPageBreak = (neededSpace: number): void => {
    if (y + neededSpace > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }
  };

  const drawHorizontalLine = (yPos: number, color: [number, number, number] = [200, 200, 200]): void => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  };

  const addSectionTitle = (title: string, bgColor: [number, number, number] = [109, 40, 217]): void => {
    checkPageBreak(14);
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(marginLeft, y, contentWidth, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, marginLeft + 4, y + 6.5);
    doc.setTextColor(0, 0, 0);
    y += 13;
  };

  const addField = (label: string, value: string): void => {
    checkPageBreak(7);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label + ':', marginLeft + 2, y);
    const labelWidth = doc.getTextWidth(label + ': ');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const maxValueWidth = contentWidth - labelWidth - 6;
    const lines = doc.splitTextToSize(value || 'Não informado', maxValueWidth);
    doc.text(lines, marginLeft + 2 + labelWidth, y);
    y += lines.length * 4.5;
  };

  const addFieldInline = (
    label1: string, value1: string,
    label2: string, value2: string,
    label3?: string, value3?: string
  ): void => {
    checkPageBreak(7);
    const colWidth = label3 ? contentWidth / 3 : contentWidth / 2;

    doc.setFontSize(8.5);

    // Col 1
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label1 + ':', marginLeft + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(value1 || '-', marginLeft + 2 + doc.getTextWidth(label1 + ': '), y);

    // Col 2
    const col2X = marginLeft + colWidth;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label2 + ':', col2X, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(value2 || '-', col2X + doc.getTextWidth(label2 + ': '), y);

    // Col 3 (optional)
    if (label3 && value3 !== undefined) {
      const col3X = marginLeft + colWidth * 2;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label3 + ':', col3X, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(value3 || '-', col3X + doc.getTextWidth(label3 + ': '), y);
    }

    y += 5;
  };

  const addBadge = (text: string, xPos: number, yPos: number): number => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const textW = doc.getTextWidth(text);
    const badgeW = textW + 6;
    const badgeH = 5;
    doc.setFillColor(240, 240, 250);
    doc.setDrawColor(180, 180, 220);
    doc.roundedRect(xPos, yPos - 3.5, badgeW, badgeH, 1.5, 1.5, 'FD');
    doc.setTextColor(80, 60, 140);
    doc.text(text, xPos + 3, yPos);
    doc.setTextColor(0, 0, 0);
    return badgeW + 2;
  };

  // ============================================
  // CABEÇALHO
  // ============================================

  // Fundo roxo do cabeçalho
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACS Top', marginLeft, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ficha Completa da Familia', marginLeft, 21);

  doc.setFontSize(8);
  doc.text(`Agente: ${agentName}`, marginLeft, 28);
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, marginLeft, 33);

  // Número da família no canto direito
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${family.familyNumber}`, pageWidth - marginRight, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${people.length} membro(s)`, pageWidth - marginRight, 28, { align: 'right' });

  y = 45;

  // ============================================
  // DADOS DA FAMÍLIA
  // ============================================

  addSectionTitle('DADOS DA FAMILIA', [37, 99, 235]);

  const fullAddress = [
    family.address.street,
    family.address.number,
    family.address.complement,
    family.address.neighborhood,
    family.address.city,
    family.address.state,
  ].filter(Boolean).join(', ');

  addField('Endereco', fullAddress);
  if (family.address.zipCode) {
    addField('CEP', family.address.zipCode);
  }

  y += 2;
  addFieldInline(
    'Saneamento', family.hasBasicSanitation ? 'Sim' : 'Nao',
    'Agua encanada', family.hasRunningWater ? 'Sim' : 'Nao',
    'Energia eletrica', family.hasElectricity ? 'Sim' : 'Nao'
  );

  addFieldInline(
    'Tipo domicilio', dwellingLabel(family.dwellingType),
    'Renda familiar', family.householdIncome ? `R$ ${family.householdIncome.toFixed(2)}` : 'Nao informada'
  );

  if (family.notes) {
    addField('Observacoes', family.notes);
  }

  if (family.address.latitude && family.address.longitude) {
    addField('Coordenadas GPS', `${family.address.latitude.toFixed(6)}, ${family.address.longitude.toFixed(6)}`);
  }

  y += 3;

  // ============================================
  // RESUMO ESTATÍSTICO
  // ============================================

  addSectionTitle('RESUMO ESTATISTICO', [16, 185, 129]);

  const stats = {
    total: people.length,
    children: people.filter(p => calculateAge(p.birthDate) < 12).length,
    elderly: people.filter(p => calculateAge(p.birthDate) >= 60).length,
    pregnant: people.filter(p => p.isPregnant && !p.isPuerperium).length,
    puerperium: people.filter(p => p.isPregnant && p.isPuerperium).length,
    hypertensive: people.filter(p => p.hasHypertension).length,
    diabetic: people.filter(p => p.hasDiabetes).length,
    disabled: people.filter(p => p.isDisabled).length,
    bedridden: people.filter(p => p.isBedridden).length,
    insulin: people.filter(p => p.usesInsulin).length,
    smoker: people.filter(p => p.isSmoker).length,
    alcoholic: people.filter(p => p.isAlcoholic).length,
    drugUser: people.filter(p => p.isDrugUser).length,
    bolsaFamilia: people.filter(p => p.receivesBolsaFamilia).length,
  };

  const statsLine1 = `Total: ${stats.total}  |  Criancas (<12): ${stats.children}  |  Idosos (60+): ${stats.elderly}  |  Gestantes: ${stats.pregnant}  |  Puerperas: ${stats.puerperium}`;
  const statsLine2 = `Hipertensos: ${stats.hypertensive}  |  Diabeticos: ${stats.diabetic}  |  Insulina: ${stats.insulin}  |  PcD: ${stats.disabled}  |  Acamados: ${stats.bedridden}`;
  const statsLine3 = `Fumantes: ${stats.smoker}  |  Alcoolatras: ${stats.alcoholic}  |  Usuarios de drogas: ${stats.drugUser}  |  Bolsa Familia: ${stats.bolsaFamilia}`;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(statsLine1, marginLeft + 2, y);
  y += 5;
  doc.text(statsLine2, marginLeft + 2, y);
  y += 5;
  doc.text(statsLine3, marginLeft + 2, y);
  y += 8;

  // ============================================
  // MEMBROS DA FAMÍLIA
  // ============================================

  addSectionTitle(`MEMBROS DA FAMILIA (${people.length})`, [109, 40, 217]);

  people.forEach((person, index) => {
    const age = calculateAge(person.birthDate);

    // Estima espaço necessário por membro (mínimo ~45mm, pode ser mais)
    checkPageBreak(55);

    // Cabeçalho do membro
    const bgColor: [number, number, number] = person.isHeadOfFamily ? [254, 249, 195] : [248, 250, 252];
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(marginLeft, y, contentWidth, 8, 1.5, 1.5, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    const memberTitle = `${index + 1}. ${person.name}`;
    doc.text(memberTitle, marginLeft + 3, y + 5.5);

    if (person.isHeadOfFamily) {
      const titleWidth = doc.getTextWidth(memberTitle);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7);
      doc.text('RESPONSAVEL', marginLeft + 3 + titleWidth + 4, y + 5.5);
    }

    // Idade e sexo no canto direito
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${age} anos - ${genderLabel(person.gender)}`, pageWidth - marginRight - 3, y + 5.5, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    y += 12;

    // Dados pessoais
    if (person.birthDate) {
      addFieldInline(
        'Nascimento', formatDate(person.birthDate),
        'Sexo', genderLabel(person.gender),
        'Idade', `${age} anos`
      );
    }

    if (person.cpf || person.cns) {
      addFieldInline(
        'CPF', person.cpf || '-',
        'CNS', person.cns || '-'
      );
    }

    if (person.phone || person.occupation) {
      addFieldInline(
        'Telefone', person.phone || '-',
        'Ocupacao', person.occupation || '-'
      );
    }

    if (person.relationshipToHead) {
      addField('Parentesco', person.relationshipToHead);
    }

    // Condições de saúde (badges em texto)
    const conditions: string[] = [];
    if (person.hasHypertension) conditions.push('Hipertensao');
    if (person.hasDiabetes) conditions.push('Diabetes');
    if (person.usesInsulin) conditions.push('Usa Insulina');
    if (person.isPregnant && !person.isPuerperium) conditions.push('Gestante');
    if (person.isPregnant && person.isPuerperium) conditions.push('Puerpera');
    if (person.isHighRiskPregnancy && person.isPregnant && !person.isPuerperium) conditions.push('Alto Risco');
    if (person.isDisabled) conditions.push('PcD');
    if (person.isBedridden) conditions.push('Acamado');
    if (person.hasMobilityDifficulty) conditions.push('Dif. Locomocao');
    if (person.isSmoker) conditions.push('Fumante');
    if (person.isAlcoholic) conditions.push('Alcoolatra');
    if (person.isDrugUser) conditions.push('Usr. Drogas');
    if (person.receivesBolsaFamilia) conditions.push('Bolsa Familia');
    if (person.isWorking) conditions.push('Trabalha');
    if (age < 12) conditions.push('Crianca');
    if (age >= 60) conditions.push('Idoso');

    if (conditions.length > 0) {
      checkPageBreak(10);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Condicoes:', marginLeft + 2, y);
      y += 1;

      let badgeX = marginLeft + 2;
      const badgeY = y + 4;
      const maxX = pageWidth - marginRight;

      for (const cond of conditions) {
        doc.setFontSize(7.5);
        const testW = doc.getTextWidth(cond) + 8;
        if (badgeX + testW > maxX) {
          badgeX = marginLeft + 2;
          y += 6;
          checkPageBreak(8);
        }
        const bw = addBadge(cond, badgeX, y + 4);
        badgeX += bw;
      }
      y += 8;
    } else {
      checkPageBreak(7);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 139, 34);
      doc.text('Sem condicoes especiais', marginLeft + 2, y);
      doc.setTextColor(0, 0, 0);
      y += 5;
    }

    // Gestante — info extra
    if (person.isPregnant && !person.isPuerperium && person.lastMenstrualPeriod) {
      checkPageBreak(10);
      addFieldInline(
        'DUM', formatDate(person.lastMenstrualPeriod),
        'IG', calculateGestationalAge(person.lastMenstrualPeriod),
        'DPP', person.pregnancyDueDate ? formatDate(person.pregnancyDueDate) : '-'
      );
    }

    // NIS
    if (person.receivesBolsaFamilia && person.nisNumber) {
      addField('NIS', person.nisNumber);
    }

    // Doenças crônicas
    if (person.chronicDiseases && person.chronicDiseases.length > 0) {
      addField('Doencas cronicas', person.chronicDiseases.join(', '));
    }

    // Medicamentos
    if (person.medications && person.medications.length > 0) {
      addField('Medicamentos', person.medications.join(', '));
    }

    // Doenças raras
    if (person.rareDiseases) {
      addField('Doencas raras', person.rareDiseases);
    }

    // Outras condições
    if (person.otherConditions) {
      addField('Outras condicoes', person.otherConditions);
    }

    // Observações de saúde
    if (person.healthObservations) {
      addField('Observacoes de saude', person.healthObservations);
    }

    // Linha separadora entre membros
    y += 2;
    if (index < people.length - 1) {
      checkPageBreak(5);
      drawHorizontalLine(y);
      y += 5;
    }
  });

  // ============================================
  // RODAPÉ EM TODAS AS PÁGINAS
  // ============================================

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `ACS Top - acstop.com.br | Familia ${family.familyNumber} | Pagina ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // ============================================
  // DOWNLOAD
  // ============================================

  const fileName = `Familia_${family.familyNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
