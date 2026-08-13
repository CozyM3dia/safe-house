import { Swords, ArrowRight, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { riskHex } from '../../lib/utils';

function scoreOf(p) {
  if (!p?.radarData) return 50;
  if (p.isOcean) return 0; // Lautan tidak bisa dibangun, skor otomatis 0
  const { flood = 0, soil = 0, seismic = 0, air = 0 } = p.radarData;
  const elevR = (p.elevasi ?? 50) < 10 ? 70 : 25;
  return Math.round(100 - (flood + soil + seismic + air + elevR) / 5);
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
  const winner = scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : null;

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
  const hex = riskHex(score);
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
          {score}
        </span>
      </div>
      <p className="line-clamp-1 text-[10px] text-text-muted">{address}</p>
    </div>
  );
}
