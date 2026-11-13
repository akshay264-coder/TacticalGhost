import React from 'react';
import { DecisionEvaluation, ActionAlternative } from '../../types/tactical';
import { Shuffle, CheckCircle2, TrendingUp, ShieldAlert, Award, HelpCircle } from 'lucide-react';

interface TacticalDecisionsPanelProps {
  evaluation: DecisionEvaluation | null;
  onSelectAlternative?: (alt: ActionAlternative) => void;
}

export const TacticalDecisionsPanel: React.FC<TacticalDecisionsPanelProps> = ({
  evaluation,
  onSelectAlternative,
}) => {
  if (!evaluation || !evaluation.evaluation || !evaluation.evaluation.ball_carrier) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        <Shuffle className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
        Navigate to a designated Decision Frame to inspect counterfactual alternatives.
      </div>
    );
  }

  const { ball_carrier, alternatives } = evaluation.evaluation;

  return (
    <div className="space-y-4">
      {/* Carrier Context Header */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block">Decision Moment (Frame {evaluation.decision_frame})</span>
          <span className="font-semibold text-sm text-slate-200">
            Ball Carrier: <strong className="text-cyan-400">Player {ball_carrier.jersey_number}</strong> ({ball_carrier.team})
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase block">Current Threat (xT)</span>
          <span className="font-mono font-bold text-sm text-amber-400">{ball_carrier.current_xt.toFixed(3)}</span>
        </div>
      </div>

      {/* Disclaimers & Methodology Note (Rule 4 & 5 compliance) */}
      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2">
        <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Explainable Tactical Modeling:</strong> Evaluates mathematical expected threat (xT) advancement and execution risk. We do not claim coordinates alone prove subjective player intent.
        </p>
      </div>

      {/* Alternatives List */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <span>Evaluated Available Options ({alternatives.length})</span>
          <span className="text-slate-500 font-mono text-[10px]">Ranked by TEV</span>
        </div>

        {alternatives.map((alt, idx) => {
          const isActual = alt.is_actual_decision;
          const isOptimal = alt.recommendation_tier === 'Optimal Alternative';

          return (
            <div
              key={idx}
              onClick={() => onSelectAlternative && onSelectAlternative(alt)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isActual
                  ? 'bg-blue-950/30 border-blue-600/80 shadow-md'
                  : isOptimal
                  ? 'bg-purple-950/30 border-purple-500/80 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${
                    isActual ? 'bg-blue-600 text-white' : 'bg-purple-900 text-purple-200'
                  }`}>
                    {alt.action_type} {alt.target_jersey ? `-> P${alt.target_jersey}` : ''}
                  </span>
                  {isActual && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/60 flex items-center space-x-1">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Actual Observed
                    </span>
                  )}
                  {isOptimal && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60 flex items-center space-x-1">
                      <Award className="w-2.5 h-2.5 mr-0.5" /> High-Value Alternative
                    </span>
                  )}
                </div>

                {/* TEV Value */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">TACTICAL EXP VALUE</span>
                  <span className={`font-mono font-bold text-xs ${
                    alt.tactical_expected_value >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {alt.tactical_expected_value >= 0 ? `+${alt.tactical_expected_value.toFixed(3)}` : alt.tactical_expected_value.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Quantitative Metrics */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono bg-slate-900/60 p-2 rounded-lg">
                <div>
                  <span className="text-slate-500 block text-[9px]">EXECUTION SAFETY</span>
                  <span className={alt.execution_success_prob >= 0.65 ? 'text-emerald-400' : 'text-amber-400'}>
                    {Math.round(alt.execution_success_prob * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">xT ADVANCEMENT</span>
                  <span className={alt.xt_gain > 0 ? 'text-cyan-400' : 'text-slate-400'}>
                    {alt.xt_gain > 0 ? `+${alt.xt_gain.toFixed(3)}` : alt.xt_gain.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">RISK CATEGORY</span>
                  <span className={alt.risk_level === 'Low Risk' ? 'text-emerald-400' : alt.risk_level === 'High Risk' ? 'text-rose-400' : 'text-amber-400'}>
                    {alt.risk_level}
                  </span>
                </div>
              </div>

              {/* Rationale explanation */}
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {alt.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
