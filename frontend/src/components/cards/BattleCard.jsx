import { Swords, ArrowRight, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { riskHex } from '../../lib/utils';

function scoreOf(p) {
  return Number.isFinite(p?.safe_score) ? p.safe_score : null;
}

export function BattleCard({ propertyA, propertyB }) {
  const t = useT();
  const setSelectingBattlePin = useAppStore((s) => s.setSelectingBattlePin);
  const selectingBattlePin = useAppStore((s) => s.selectingBattlePin);

  if (!propertyB) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Swords className="h-3 w-3 text-risk-danger" />
            {t('battle.setup')}
          </CardTitle>
        </CardHeader>

        <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.02] p-4 text-center">
          <p className="text-[11px] text-text-muted leading-relaxed mb-3">
            {t('battle.selectB')}{' '}
            <span className="text-text-primary">Site A</span>.
          </p>
          <Button
            variant={selectingBattlePin ? 'danger' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setSelectingBattlePin(!selectingBattlePin)}
          >
            {selectingBattlePin ? t('battle.clickMap') : t('battle.selectTarget')}
          </Button>
        </div>
      </Card>
    );
  }

  const scoreA = scoreOf(propertyA);
  const scoreB = scoreOf(propertyB);
  const winner = Number.isFinite(scoreA) && Number.isFinite(scoreB)
    ? scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : null
    : null;

  return (
    <Card glow={winner ? 'safe' : null}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Trophy className="h-3 w-3 text-amber-400" />
          {t('battle.verdict')}
        </CardTitle>
        {winner && (
          <Badge variant="safe">
            Site {winner} wins
          </Badge>
        )}
      </CardHeader>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <SitePill label="A" score={scoreA} address={propertyA.address} />
        <ArrowRight className="h-4 w-4 text-text-muted" />
        <SitePill label="B" score={scoreB} address={propertyB.address} />
      </div>
    </Card>
  );
}

function SitePill({ label, score, address }) {
  const ready = Number.isFinite(score);
  const displayScore = ready ? score : 0;
  const hex = riskHex(displayScore);
  return (
    <div
      className="rounded-lg border bg-white/[0.02] p-2.5"
      style={{ borderColor: `${hex}40` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[9px] font-bold tracking-[0.2em] uppercase"
          style={{ color: hex }}
        >
          Site {label}
        </span>
        <span className="data-num text-[15px] text-text-primary font-semibold">
          {ready ? score : 'N/A'}
        </span>
      </div>
      <p className="line-clamp-1 text-[10px] text-text-muted">{address}</p>
    </div>
  );
}
