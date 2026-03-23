import { Badge } from './ui/Badge';

type CiotStatus = 'emitido' | 'em_andamento' | 'concluido' | 'cancelado';
type PefStatus = 'pendente' | 'pago' | 'estornado';
type TransportadorStatus = 'ativo' | 'inativo';

const ciotStatusConfig: Record<CiotStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'danger' }> = {
  emitido: { label: 'Emitido', variant: 'info' },
  em_andamento: { label: 'Em Andamento', variant: 'warning' },
  concluido: { label: 'Concluído', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
};

const pefStatusConfig: Record<PefStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  pago: { label: 'Pago', variant: 'success' },
  estornado: { label: 'Estornado', variant: 'danger' },
};

const transportadorStatusConfig: Record<TransportadorStatus, { label: string; variant: 'success' | 'default' }> = {
  ativo: { label: 'Ativo', variant: 'success' },
  inativo: { label: 'Inativo', variant: 'default' },
};

interface CiotStatusBadgeProps {
  status: string;
}

export function CiotStatusBadge({ status }: CiotStatusBadgeProps) {
  const config = ciotStatusConfig[status as CiotStatus] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PefStatusBadge({ status }: CiotStatusBadgeProps) {
  const config = pefStatusConfig[status as PefStatus] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function TransportadorStatusBadge({ status }: CiotStatusBadgeProps) {
  const config = transportadorStatusConfig[status as TransportadorStatus] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
