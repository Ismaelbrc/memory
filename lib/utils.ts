import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateCiotNumber(): string {
  const timestamp = Date.now();
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `CIOT${timestamp}${seq}`;
}

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
}

export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcDigit = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + parseInt(base[i]) * w, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigit(digits, weights1);
  if (d1 !== parseInt(digits[12])) return false;

  const d2 = calcDigit(digits, weights2);
  return d2 === parseInt(digits[13]);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string): string {
  if (!date) return '';
  const d = new Date(date + (date.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function formatDateInput(date: string): string {
  if (!date) return '';
  // Convert from DD/MM/YYYY to YYYY-MM-DD for input
  const parts = date.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ANTT minimum freight table (R$ per km per tonne)
export const ANTT_PISO_MINIMO: Record<string, number> = {
  granel_solido: 3.29,
  granel_liquido: 3.67,
  fracionado: 4.08,
  neogranel: 3.52,
  carga_geral: 3.49,
  perigosa: 4.49,
  outros: 3.29,
};

export function validateFreightMinimum(
  valorFrete: number,
  distanceKm: number,
  tipoCarga: string
): boolean {
  const pisoKm = ANTT_PISO_MINIMO[tipoCarga] || ANTT_PISO_MINIMO.outros;
  const pisoMinimo = (pisoKm / 100) * distanceKm;
  return valorFrete >= pisoMinimo;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
