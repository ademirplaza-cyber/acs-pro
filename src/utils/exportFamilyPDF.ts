import jsPDF from 'jspdf';
import { Family, Person } from '../types';

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export function exportFamilyPDF(family: Family, people: Person[], agentName: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkNewPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin;
    }
  };

  // === CABEÇALHO ===
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACS Top — Saúde Integrada', margin, 15);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ficha da Família ${family.familyNumber}`, margin, 23);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} • Agente: ${agentName}`, margin, 30);
  y = 42;

  // === DADOS DA FAMÍLIA ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados da Família', margin, y);
  y += 8;

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const familyFields = [
    ['Número da Família', family.familyNumber],
    ['Endereço', `${family.address.street}, ${family.address.number}${family.address.complement ? ' - ' + family.address.complement : ''}`],
    ['Bairro', family.address.neighborhood || '—'],
    ['Cidade/UF', `${family.address.city || '—'}/${family.address.state || '—'}`],
    ['CEP', family.address.zipCode || '—'],
    ['Tipo de Domicílio', family.dwellingType === 'HOUSE' ? 'Casa' : family.dwellingType === 'APARTMENT' ? 'Apartamento' : family.dwellingType === 'SHACK' ? 'Barraco' : 'Outro'],
    ['Saneamento Básico', family.hasBasicSanitation ? 'Sim' : 'Não'],
    ['Água Encanada', family.hasRunningWater ? 'Sim' : 'Não'],
    ['Energia Elétrica', family.hasElectricity ? 'Sim' : 'Não'],
    ['Renda Familiar', family.householdIncome ? `R$ ${family.householdIncome.toFixed(2)}` : '—'],
    ['Cadastrada em', new Date(family.registeredAt).toLocaleDateString('pt-BR')],
  ];

  familyFields.forEach(([label, value]) => {
    checkNewPage(6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}: `, margin, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + labelWidth, y);
    y += 6;
  });

  if (family.notes) {
    checkNewPage(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações: ', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    const lines = doc.splitTextToSize(family.notes, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  y += 8;

  // === RESUMO DE MEMBROS ===
  checkNewPage(20);
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Membros da Família (${people.length})`, margin, y);
  y += 8;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  if (people.length === 0) {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum membro cadastrado.', margin, y);
    y += 10;
  } else {
    // Tabela de membros
    const colWidths = [55, 18, 22, 85];
    const headers = ['Nome', 'Idade', 'Sexo', 'Condições de Saúde'];

    // Header da tabela
    doc.setFillColor(240, 244, 255);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin;
    headers.forEach((h, i) => {
      doc.text(h, xPos + 2, y);
      xPos += colWidths[i];
    });
    y += 7;

    // Linhas
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    people.forEach((person) => {
      const age = calculateAge(person.birthDate);
      const conditions: string[] = [];

      if (person.isHeadOfFamily) conditions.push('Responsável');
      if (person.hasHypertension) conditions.push('Hipertensão');
      if (person.hasDiabetes) conditions.push('Diabetes');
      if (person.usesInsulin) conditions.push('Insulina');
      if (person.isPregnant && !(person as any).isPuerperium) conditions.push('Gestante');
      if (person.isPregnant && (person as any).isPuerperium) conditions.push('Puérpera');
      if (person.isHighRiskPregnancy && person.isPregnant) conditions.push('Alto Risco');
      if (person.isBedridden) conditions.push('Acamado');
      if (person.isDisabled) conditions.push('PcD');
      if (person.hasMobilityDifficulty) conditions.push('Dif. Locomoção');
      if (person.isSmoker) conditions.push('Fumante');
      if (person.isAlcoholic) conditions.push('Alcoólatra');
      if (person.isDrugUser) conditions.push('Usuário de Drogas');
      if (person.receivesBolsaFamilia) conditions.push('Bolsa Família');
      if ((person as any).otherConditions) conditions.push((person as any).otherConditions);
      if (conditions.length === 0) conditions.push('Sem condições especiais');

      const condText = conditions.join(', ');
      const condLines = doc.splitTextToSize(condText, colWidths[3] - 4);
      const rowHeight = Math.max(6, condLines.length * 4.5 + 2);

      checkNewPage(rowHeight + 2);

      // Zebra
      if (people.indexOf(person) % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, y - 4, contentWidth, rowHeight, 'F');
      }

      xPos = margin;
      const nameLines = doc.splitTextToSize(person.name, colWidths[0] - 4);
      doc.text(nameLines, xPos + 2, y);
      xPos += colWidths[0];

      doc.text(`${age} anos`, xPos + 2, y);
      xPos += colWidths[1];

      doc.text(person.gender === 'F' ? 'Fem' : person.gender === 'M' ? 'Masc' : 'Outro', xPos + 2, y);
      xPos += colWidths[2];

      doc.text(condLines, xPos + 2, y);

      y += rowHeight;
    });
  }

  y += 10;

  // === FICHAS INDIVIDUAIS ===
  people.forEach((person) => {
    checkNewPage(60);
    const age = calculateAge(person.birthDate);

    doc.setFillColor(245, 243, 255);
    doc.rect(margin, y - 4, contentWidth, 10, 'F');
    doc.setTextColor(107, 33, 168);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${person.name}${person.isHeadOfFamily ? ' (Responsável)' : ''}`, margin + 2, y + 2);
    y += 12;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const personFields: [string, string][] = [
      ['Nascimento', `${new Date(person.birthDate).toLocaleDateString('pt-BR')} (${age} anos)`],
      ['Sexo', person.gender === 'F' ? 'Feminino' : person.gender === 'M' ? 'Masculino' : 'Outro'],
      ['CPF', person.cpf || '—'],
      ['CNS', person.cns || '—'],
      ['Telefone', person.phone || '—'],
      ['Ocupação', person.occupation || '—'],
      ['Parentesco', person.relationshipToHead || '—'],
    ];

    personFields.forEach(([label, value]) => {
      checkNewPage(5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}: `, margin + 2, y);
      const lw = doc.getTextWidth(`${label}: `);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 2 + lw, y);
      y += 5;
    });

    // Condições
    const conditions: string[] = [];
    if (person.hasHypertension) conditions.push('Hipertensão');
    if (person.hasDiabetes) conditions.push('Diabetes');
    if (person.usesInsulin) conditions.push('Usa Insulina');
    if (person.isPregnant && !(person as any).isPuerperium) conditions.push('Gestante');
    if (person.isPregnant && (person as any).isPuerperium) conditions.push('Puérpera');
    if (person.isHighRiskPregnancy) conditions.push('Gestação Alto Risco');
    if (person.isBedridden) conditions.push('Acamado');
    if (person.isDisabled) conditions.push('PcD');
    if (person.hasMobilityDifficulty) conditions.push('Dif. Locomoção');
    if (person.isSmoker) conditions.push('Fumante');
    if (person.isAlcoholic) conditions.push('Alcoólatra');
    if (person.isDrugUser) conditions.push('Usuário de Drogas');
    if (person.receivesBolsaFamilia) conditions.push(`Bolsa Família${person.nisNumber ? ' (NIS: ' + person.nisNumber + ')' : ''}`);
    if ((person as any).otherConditions) conditions.push((person as any).otherConditions);

    checkNewPage(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Condições: ', margin + 2, y);
    const cw = doc.getTextWidth('Condições: ');
    doc.setFont('helvetica', 'normal');
    const condStr = conditions.length > 0 ? conditions.join(', ') : 'Sem condições especiais';
    const condLines = doc.splitTextToSize(condStr, contentWidth - cw - 4);
    doc.text(condLines, margin + 2 + cw, y);
    y += condLines.length * 5;

    if (person.chronicDiseases && person.chronicDiseases.length > 0) {
      checkNewPage(6);
      doc.setFont('helvetica', 'bold');
      doc.text('Doenças Crônicas: ', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      const dLines = doc.splitTextToSize(person.chronicDiseases.join(', '), contentWidth - 4);
      doc.text(dLines, margin + 2, y);
      y += dLines.length * 5;
    }

    if (person.medications && person.medications.length > 0) {
      checkNewPage(6);
      doc.setFont('helvetica', 'bold');
      doc.text('Medicamentos: ', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      const mLines = doc.splitTextToSize(person.medications.join(', '), contentWidth - 4);
      doc.text(mLines, margin + 2, y);
      y += mLines.length * 5;
    }

    if (person.healthObservations) {
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações: ', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      const oLines = doc.splitTextToSize(person.healthObservations, contentWidth - 4);
      doc.text(oLines, margin + 2, y);
      y += oLines.length * 5;
    }

    y += 8;
    checkNewPage(2);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  });

  // === RODAPÉ ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`ACS Top — Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  doc.save(`Familia_${family.familyNumber}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
