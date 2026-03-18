import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

type ViewMode = 'OVERVIEW' | 'SEARCH';

export const Reports = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('OVERVIEW');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);

  const [families, setFamilies] = useState<Family[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);

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
    const [y, m] = selectedMonth.split('-').map(Number);
    const ms = new Date(y, m - 1, 1), me = new Date(y, m, 0, 23, 59, 59);
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
          <button onClick={doExport} className="p-2 rounded-lg bg-slate-100 active:bg-slate-200 transition-colors">
            <Download size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Tab switch — agora só 2 abas */}
      <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 gap-1">
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
                <button onClick={doExport} className="flex items-center gap-1 text-xs text-slate-500 font-medium active:text-slate-800">
                  <Download size={12} /> Exportar
                </button>
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
    </div>
  );
}