import React, { useState, useEffect } from 'react';
import {
  ReportType,
  ReportTypeDefinition,
  ReportTemplateDefinition,
  ReportHistoryItem,
  StandardTacticalReport,
  ReportGenerationRequest
} from '../../types/reporting';
import {
  fetchReportingStatus,
  fetchReportTypes,
  fetchReportTemplates,
  fetchReportHistory,
  generateTacticalReport,
  previewTacticalReport,
  deleteReportById,
  getReportHtmlUrl,
  getReportPdfUrl,
  getReportJsonUrl
} from '../../services/reportingApi';
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
  Sparkles,
  Shield,
  Target,
  Compass,
  Users,
  GitCompare,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Layers,
  ChevronRight,
  BookOpen,
  Eye
} from 'lucide-react';

export function ReportingCentre() {
  const [activeTab, setActiveTab] = useState<
    'creator' | 'match' | 'tactical' | 'opponent' | 'coach' | 'scouting' | 'multi_match' | 'history'
  >(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('reportTab');
      if (p && ['creator', 'match', 'tactical', 'opponent', 'coach', 'scouting', 'multi_match', 'history'].includes(p)) {
        return p as any;
      }
    }
    return 'creator';
  });

  // Data states
  const [reportTypes, setReportTypes] = useState<ReportTypeDefinition[]>([]);
  const [templates, setTemplates] = useState<ReportTemplateDefinition[]>([]);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [activeReport, setActiveReport] = useState<StandardTacticalReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Configuration Form State
  const [selectedType, setSelectedType] = useState<ReportType>('MATCH_INTELLIGENCE');
  const [selectedMatch, setSelectedMatch] = useState<string>('metrica_game_1');
  const [selectedSecMatch, setSelectedSecMatch] = useState<string>('metrica_game_2');
  const [selectedTeam, setSelectedTeam] = useState<string>('Home');
  const [selectedOpponent, setSelectedOpponent] = useState<string>('Away');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('Home_10');
  const [selectedFormation, setSelectedFormation] = useState<string>('4-3-3');
  const [selectedPhilosophy, setSelectedPhilosophy] = useState<string>('POSSESSION_BUILDUP');
  const [customTitle, setCustomTitle] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [tList, tplList, histList] = await Promise.all([
        fetchReportTypes(),
        fetchReportTemplates(),
        fetchReportHistory()
      ]);
      setReportTypes(tList);
      setTemplates(tplList);
      setHistory(histList);

      // Auto-preview a template on first load if no active report
      if (!activeReport) {
        handleQuickLaunch(tplList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load reporting data:', err);
      setErrorMsg(err.message || 'Error initializing Reporting Centre');
    }
  }

  async function handleGenerate(isLiveReport: boolean = true) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const req: ReportGenerationRequest = {
        report_type: selectedType,
        match_id: selectedMatch,
        secondary_match_id: selectedSecMatch,
        team: selectedTeam,
        opponent_team: selectedOpponent,
        player_id: selectedPlayer,
        preferred_formation: selectedFormation,
        tactical_philosophy: selectedPhilosophy,
        custom_title: customTitle.trim() || undefined
      };

      if (isLiveReport) {
        const res = await generateTacticalReport(req);
        if (res.report_data) {
          setActiveReport(res.report_data);
        }
        // Refresh history
        const updatedHist = await fetchReportHistory();
        setHistory(updatedHist);
      } else {
        const previewData = await previewTacticalReport(req);
        setActiveReport(previewData);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLaunch(tpl: ReportTemplateDefinition) {
    if (!tpl) return;
    setSelectedType(tpl.report_type);
    if (tpl.match_id) setSelectedMatch(tpl.match_id);
    if (tpl.secondary_match_id) setSelectedSecMatch(tpl.secondary_match_id);
    if (tpl.team) setSelectedTeam(tpl.team);
    if (tpl.opponent_team) setSelectedOpponent(tpl.opponent_team);
    if (tpl.player_id) setSelectedPlayer(tpl.player_id);
    if (tpl.preferred_formation) setSelectedFormation(tpl.preferred_formation);
    if (tpl.tactical_philosophy) setSelectedPhilosophy(tpl.tactical_philosophy);

    setLoading(true);
    setErrorMsg(null);
    try {
      const req: ReportGenerationRequest = {
        report_type: tpl.report_type,
        match_id: tpl.match_id || selectedMatch,
        secondary_match_id: tpl.secondary_match_id || selectedSecMatch,
        team: tpl.team || selectedTeam,
        opponent_team: tpl.opponent_team || selectedOpponent,
        player_id: tpl.player_id || selectedPlayer,
        preferred_formation: tpl.preferred_formation || selectedFormation,
        tactical_philosophy: tpl.tactical_philosophy || selectedPhilosophy
      };
      const res = await generateTacticalReport(req);
      if (res.report_data) {
        setActiveReport(res.report_data);
      }
      const updatedHist = await fetchReportHistory();
      setHistory(updatedHist);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick launch generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reportId: string) {
    try {
      await deleteReportById(reportId);
      setHistory(prev => prev.filter(h => h.report_id !== reportId));
      if (activeReport?.metadata.report_id === reportId) {
        setActiveReport(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white border border-[#E5E0D8] rounded-2xl shadow-sm text-[#171717] overflow-hidden">
      {/* Sub-Header / Nav */}
      <div className="bg-[#FAF7F2] border-b border-[#E5E0D8] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FEF3E8] border border-[#FCD8B3] text-[#F28C28]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#171717] flex items-center space-x-2">
              <span>Reporting Centre</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FEF3E8] text-[#F28C28] border border-[#FCD8B3]">
                Publication Engine
              </span>
            </h2>
            <p className="text-xs text-[#525252]">Automated professional tactical reporting across 7 intelligence disciplines.</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-[#E5E0D8] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('creator')}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'creator' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Report Creator</span>
          </button>
          <button
            onClick={() => { setActiveTab('match'); setSelectedType('MATCH_INTELLIGENCE'); }}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'match' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Match Report</span>
          </button>
          <button
            onClick={() => { setActiveTab('tactical'); setSelectedType('TACTICAL_ANALYSIS'); }}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'tactical' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tactical Patterns</span>
          </button>
          <button
            onClick={() => { setActiveTab('opponent'); setSelectedType('OPPONENT_ANALYSIS'); }}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'opponent' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Opponent Dossier</span>
          </button>
          <button
            onClick={() => { setActiveTab('coach'); setSelectedType('COACH_STRATEGY'); }}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'coach' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Coach Strategy</span>
          </button>
          <button
            onClick={() => { setActiveTab('scouting'); setSelectedType('PLAYER_SCOUTING'); }}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'scouting' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Player Scouting</span>
          </button>
          <button
            onClick={() => { setActiveTab('multi_match'); setSelectedType('MULTI_MATCH_COMPARISON'); }}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'multi_match' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Comparison</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'history' ? 'bg-[#F28C28] text-white shadow-sm font-bold' : 'text-[#525252] hover:text-[#171717]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Main Reporting Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control / Template Panel */}
        {activeTab !== 'history' && (
          <div className="w-80 border-r border-[#E5E0D8] bg-[#FAF7F2] p-4 flex flex-col space-y-4 overflow-y-auto">
            {/* Quick Launch Templates */}
            <div>
              <span className="text-[11px] font-bold text-[#525252] uppercase tracking-wider block mb-2">
                1-Click Preset Templates
              </span>
              <div className="space-y-1.5">
                {templates.slice(0, 4).map(tpl => (
                  <button
                    key={tpl.template_id}
                    onClick={() => handleQuickLaunch(tpl)}
                    disabled={loading}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E5E0D8] text-xs transition flex items-center justify-between group shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-[#171717] group-hover:text-[#F28C28]">{tpl.name}</div>
                      <div className="text-[10px] text-[#525252]">{tpl.report_type.replace('_', ' ')}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#525252] group-hover:text-[#F28C28]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Configuration Form */}
            <div className="border-t border-[#E5E0D8] pt-4 space-y-3">
              <span className="text-[11px] font-bold text-[#525252] uppercase tracking-wider block">
                Report Configuration
              </span>

              {/* Type Select */}
              <div>
                <label className="text-[10px] font-semibold text-[#525252] uppercase">Report Type</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value as ReportType)}
                  className="w-full bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs text-[#171717] mt-1 focus:outline-none focus:border-[#F28C28]"
                >
                  {reportTypes.map(rt => (
                    <option key={rt.type} value={rt.type}>{rt.title}</option>
                  ))}
                </select>
              </div>

              {/* Target Match */}
              <div>
                <label className="text-[10px] font-semibold text-[#525252] uppercase">Primary Match</label>
                <select
                  value={selectedMatch}
                  onChange={e => setSelectedMatch(e.target.value)}
                  className="w-full bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs text-[#171717] mt-1 focus:outline-none focus:border-[#F28C28]"
                >
                  <option value="metrica_game_1">Metrica Game 1 (Curated 25 Hz)</option>
                  <option value="metrica_game_2">Metrica Game 2 (Validation Stream)</option>
                </select>
              </div>

              {/* Secondary Match (for Opponent & Comparison) */}
              {(selectedType === 'MULTI_MATCH_COMPARISON' || selectedType === 'OPPONENT_ANALYSIS') && (
                <div>
                  <label className="text-[10px] font-semibold text-[#525252] uppercase">Comparison Match</label>
                  <select
                    value={selectedSecMatch}
                    onChange={e => setSelectedSecMatch(e.target.value)}
                    className="w-full bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs text-[#171717] mt-1 focus:outline-none focus:border-[#F28C28]"
                  >
                    <option value="metrica_game_2">Metrica Game 2</option>
                    <option value="metrica_game_1">Metrica Game 1</option>
                  </select>
                </div>
              )}

              {/* Player Target (for Scouting) */}
              {selectedType === 'PLAYER_SCOUTING' && (
                <div>
                  <label className="text-[10px] font-semibold text-[#525252] uppercase">Target Player (Anonymous Tag)</label>
                  <select
                    value={selectedPlayer}
                    onChange={e => setSelectedPlayer(e.target.value)}
                    className="w-full bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs text-[#171717] mt-1 font-mono focus:outline-none focus:border-[#F28C28]"
                  >
                    <option value="Home_10">Home_10 (Playmaker)</option>
                    <option value="Home_6">Home_6 (Holding Pivot)</option>
                    <option value="Home_8">Home_8 (Box-to-Box)</option>
                    <option value="Home_9">Home_9 (Centre Forward)</option>
                    <option value="Away_24">Away_24 (Sprint Counter-Threat)</option>
                  </select>
                </div>
              )}

              {/* Formation (for Coach Strategy) */}
              {selectedType === 'COACH_STRATEGY' && (
                <div>
                  <label className="text-[10px] font-semibold text-[#525252] uppercase">Preferred Formation</label>
                  <select
                    value={selectedFormation}
                    onChange={e => setSelectedFormation(e.target.value)}
                    className="w-full bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs text-[#171717] mt-1 focus:outline-none focus:border-[#F28C28]"
                  >
                    <option value="4-3-3">4-3-3 (Possession Buildup)</option>
                    <option value="4-2-3-1">4-2-3-1 (Double Pivot Control)</option>
                    <option value="3-5-2">3-5-2 (Wide Wing-Backs)</option>
                    <option value="4-4-2">4-4-2 (Compact Low Block)</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={loading}
                  className="w-full bg-[#F28C28] hover:bg-[#E07B18] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Generate Professional Dossier</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleGenerate(false)}
                  disabled={loading}
                  className="w-full bg-white hover:bg-[#FAF7F2] border border-[#E5E0D8] text-[#171717] font-semibold py-1.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-[#F28C28]" />
                  <span>Preview In-Memory</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Preview & Editorial Display Area */}
        <div className="flex-1 bg-[#F5F0E6] p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
          {activeTab === 'history' ? (
            /* History & Archives Table */
            <div className="w-full max-w-4xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                <h3 className="text-base font-bold text-[#171717] flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#F28C28]" />
                  <span>Generated Report Archive</span>
                </h3>
                <button
                  onClick={loadInitialData}
                  className="text-xs text-[#525252] hover:text-[#171717] flex items-center space-x-1 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {history.length === 0 ? (
                <div className="p-12 text-center text-[#525252] text-sm bg-white rounded-2xl border border-[#E5E0D8]">
                  No reports generated yet. Use the Report Creator to generate your first professional tactical dossier.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(item => (
                    <div
                      key={item.report_id}
                      className="p-4 rounded-2xl bg-white border border-[#E5E0D8] hover:border-[#F28C28]/40 transition flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-[#F28C28] uppercase tracking-wider px-2 py-0.5 rounded bg-[#FEF3E8] border border-[#FCD8B3]">
                            {item.report_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-[#525252] font-mono">{item.report_id}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#171717] mt-1">{item.title}</h4>
                        <p className="text-xs text-[#525252]">{item.subtitle}</p>
                        <div className="text-[11px] text-[#525252] mt-2 flex items-center space-x-3">
                          <span>{item.generated_at.slice(0, 19).replace('T', ' ')} UTC</span>
                          <span>•</span>
                          <span>Sources: {item.source_matches.join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={item.export_links.pdf || getReportPdfUrl(item.report_id)}
                          download
                          className="px-3 py-1.5 rounded-lg bg-[#FEF3E8] hover:bg-[#F28C28] text-[#F28C28] hover:text-white border border-[#FCD8B3] text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                        <a
                          href={item.export_links.html || getReportHtmlUrl(item.report_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-white text-[#171717] border border-[#E5E0D8] text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>HTML</span>
                        </a>
                        <a
                          href={item.export_links.json || getReportJsonUrl(item.report_id)}
                          download
                          className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-white text-[#525252] border border-[#E5E0D8] text-xs font-semibold transition"
                        >
                          JSON
                        </a>
                        <button
                          onClick={() => handleDelete(item.report_id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-[#525252] hover:text-rose-600 border border-transparent hover:border-rose-200 transition"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeReport ? (
            /* Editorial Publication Document Container */
            <div className="w-full max-w-4xl flex flex-col space-y-4">
              {/* Publication Action Strip */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-200">Active Dossier:</span>
                  <span className="font-mono text-orange-400">{activeReport.metadata.report_id}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print (A4)</span>
                  </button>

                  <a
                    href={getReportPdfUrl(activeReport.metadata.report_id)}
                    download
                    className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-950" />
                    <span>Download PDF</span>
                  </a>

                  <a
                    href={getReportHtmlUrl(activeReport.metadata.report_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Standalone HTML</span>
                  </a>

                  <a
                    href={getReportJsonUrl(activeReport.metadata.report_id)}
                    download
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
                  >
                    JSON
                  </a>
                </div>
              </div>

              {/* Editorial Warm-Cream Document Preview */}
              <div className="bg-[#fdfbf7] text-[#0f172a] rounded-xl border border-stone-200 shadow-2xl p-10 font-sans">
                {/* Brand Header */}
                <div className="flex items-center justify-between border-b-2 border-[#ea580c] pb-4 mb-6">
                  <div className="text-xl font-black tracking-tight text-[#0f172a]">
                    Tactical<span className="text-[#ea580c]">Ghost</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-red-100 text-red-800 border border-red-200">
                    {activeReport.metadata.confidentiality_notice}
                  </div>
                </div>

                {/* Title & Type */}
                <div className="mb-6">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#ea580c] bg-orange-100 border border-orange-200 px-2 py-0.5 rounded mb-2">
                    {activeReport.metadata.report_type.replace('_', ' ')}
                  </span>
                  <h1 className="text-2xl font-black text-[#0f172a] leading-tight">
                    {activeReport.metadata.title}
                  </h1>
                  <p className="text-xs text-stone-500 font-medium mt-1">
                    {activeReport.metadata.subtitle}
                  </p>
                </div>

                {/* Metadata Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-100/80 border border-stone-200 rounded-lg p-3 text-xs mb-8">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-stone-500">Report ID</div>
                    <div className="font-semibold text-stone-800 truncate">{activeReport.metadata.report_id}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-stone-500">Generated</div>
                    <div className="font-semibold text-stone-800">{activeReport.metadata.generated_at.slice(0, 10)} UTC</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-stone-500">Source Matches</div>
                    <div className="font-semibold text-stone-800">{activeReport.metadata.source_matches.join(', ')}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-stone-500">Methodology</div>
                    <div className="font-semibold text-stone-800">{activeReport.metadata.methodology_version}</div>
                  </div>
                </div>

                {/* Table of Contents */}
                <div className="bg-[#fffaf0] border border-[#feebc8] rounded-lg p-4 mb-8">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#9c4221] mb-2">
                    Table of Contents ({activeReport.sections.length} Analytical Modules)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeReport.sections.map(s => (
                      <a key={s.section_id} href={`#${s.section_id}`} className="text-[#7b341e] hover:underline font-medium">
                        {s.section_number}. {s.title}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Rendered Analytical Sections */}
                <div className="space-y-8">
                  {activeReport.sections.map(sec => (
                    <section key={sec.section_id} id={sec.section_id} className="border-b border-stone-200 pb-6">
                      <div className="mb-3">
                        <span className="text-[10px] font-bold text-[#ea580c] uppercase tracking-wider">
                          Module {String(sec.section_number).padStart(2, '0')}
                        </span>
                        <h3 className="text-lg font-bold text-[#0f172a]">{sec.title}</h3>
                        {sec.subtitle && (
                          <p className="text-xs text-stone-500">{sec.subtitle}</p>
                        )}
                      </div>

                      {/* Section Markdown Body */}
                      <div className="text-xs text-stone-700 leading-relaxed space-y-2 whitespace-pre-line">
                        {sec.content_markdown}
                      </div>

                      {/* Section Visualizations */}
                      {sec.visualizations && sec.visualizations.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {sec.visualizations.map(v => (
                            <div key={v.viz_id} className="bg-[#0f172a] rounded-lg p-4 shadow-lg">
                              <div className="flex items-center justify-between text-xs text-stone-300 font-bold mb-2">
                                <span>{v.title}</span>
                                <span className="text-[10px] font-mono text-stone-400">{v.units}</span>
                              </div>
                              <div
                                className="flex justify-center"
                                dangerouslySetInnerHTML={{ __html: v.svg_content }}
                              />
                              <p className="text-[11px] text-stone-300 mt-2 pt-2 border-t border-slate-800">
                                <strong>Interpretation:</strong> {v.interpretation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                {/* Actionable Recommendations */}
                {activeReport.recommendations && activeReport.recommendations.length > 0 && (
                  <div className="mt-8 pt-4">
                    <h3 className="text-base font-bold text-[#0f172a] mb-3">Strategic Action Recommendations</h3>
                    <div className="space-y-3">
                      {activeReport.recommendations.map(r => (
                        <div key={r.recommendation_id} className="p-3.5 rounded bg-stone-100 border-l-4 border-[#ea580c] text-xs">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-red-700 uppercase text-[9px] bg-red-100 px-1.5 py-0.5 rounded">
                              {r.priority} PRIORITY
                            </span>
                            <span className="font-semibold text-sky-800 uppercase text-[9px] bg-sky-100 px-1.5 py-0.5 rounded">
                              {r.evidence_category}
                            </span>
                          </div>
                          <h4 className="font-bold text-stone-900">{r.headline}</h4>
                          <p className="text-stone-700 mt-1">{r.details}</p>
                          <div className="text-[10px] text-stone-500 mt-2 pt-1 border-t border-stone-200">
                            <strong>Counter-Risks:</strong> {r.counter_risks.join('; ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Limitations & Provenance Notice */}
                <div className="mt-8 p-4 rounded bg-stone-100 text-[11px] text-stone-600 border border-stone-200">
                  <div className="font-bold text-stone-800 mb-1">Data Provenance & Scientific Boundaries</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {activeReport.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                  <div className="text-[9px] text-stone-400 mt-3">
                    {activeReport.metadata.analyst_signoff} | TacticalGhost Evidence Engine
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 text-sm">
              <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p>Configure and generate a report using the sidebar controls, or pick a 1-click preset template.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
