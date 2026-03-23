import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'operador', 'financeiro'] }).notNull().default('operador'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const transportadores = sqliteTable('transportadores', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  cpf: text('cpf').notNull().unique(),
  cnh_numero: text('cnh_numero').notNull(),
  cnh_categoria: text('cnh_categoria').notNull(),
  cnh_vencimento: text('cnh_vencimento').notNull(),
  rntrc: text('rntrc').notNull(),
  banco: text('banco'),
  agencia: text('agencia'),
  conta: text('conta'),
  tipo_conta: text('tipo_conta', { enum: ['corrente', 'poupanca'] }),
  status: text('status', { enum: ['ativo', 'inativo'] }).notNull().default('ativo'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const veiculos = sqliteTable('veiculos', {
  id: text('id').primaryKey(),
  placa: text('placa').notNull().unique(),
  tipo: text('tipo', { enum: ['truck', 'carreta', 'bitrem', 'reboque', 'vanderleia', 'outros'] }).notNull(),
  rntrc: text('rntrc').notNull(),
  proprietario_id: text('proprietario_id').notNull().references(() => transportadores.id),
  crlv_vencimento: text('crlv_vencimento').notNull(),
  seguro_vencimento: text('seguro_vencimento').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const contratantes = sqliteTable('contratantes', {
  id: text('id').primaryKey(),
  razao_social: text('razao_social').notNull(),
  cnpj: text('cnpj').notNull().unique(),
  email: text('email').notNull(),
  telefone: text('telefone').notNull(),
  responsavel: text('responsavel').notNull(),
  endereco: text('endereco').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const ciots = sqliteTable('ciots', {
  id: text('id').primaryKey(),
  numero: text('numero').notNull().unique(),
  data_emissao: text('data_emissao').notNull(),
  tipo_operacao: text('tipo_operacao', { enum: ['contratacao', 'subcontratacao'] }).notNull(),
  contratante_id: text('contratante_id').notNull().references(() => contratantes.id),
  transportador_id: text('transportador_id').notNull().references(() => transportadores.id),
  veiculo_id: text('veiculo_id').notNull().references(() => veiculos.id),
  origem_municipio: text('origem_municipio').notNull(),
  origem_uf: text('origem_uf').notNull(),
  destino_municipio: text('destino_municipio').notNull(),
  destino_uf: text('destino_uf').notNull(),
  produto: text('produto').notNull(),
  tipo_carga: text('tipo_carga').notNull(),
  peso_kg: real('peso_kg').notNull(),
  valor_carga: real('valor_carga').notNull(),
  valor_frete: real('valor_frete').notNull(),
  adiantamento: real('adiantamento').default(0),
  complemento: real('complemento').default(0),
  observacoes: text('observacoes'),
  status: text('status', { enum: ['emitido', 'em_andamento', 'concluido', 'cancelado'] }).notNull().default('emitido'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const pef_lancamentos = sqliteTable('pef_lancamentos', {
  id: text('id').primaryKey(),
  ciot_id: text('ciot_id').notNull().references(() => ciots.id),
  tipo: text('tipo', { enum: ['adiantamento', 'complemento', 'pedagio', 'combustivel', 'outros'] }).notNull(),
  valor: real('valor').notNull(),
  data_pagamento: text('data_pagamento').notNull(),
  forma_pagamento: text('forma_pagamento', { enum: ['pix', 'ted', 'cartao_frete'] }).notNull(),
  status: text('status', { enum: ['pendente', 'pago', 'estornado'] }).notNull().default('pendente'),
  comprovante_url: text('comprovante_url'),
  descricao: text('descricao'),
  observacao: text('observacao'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Transportador = typeof transportadores.$inferSelect;
export type NewTransportador = typeof transportadores.$inferInsert;
export type Veiculo = typeof veiculos.$inferSelect;
export type NewVeiculo = typeof veiculos.$inferInsert;
export type Contratante = typeof contratantes.$inferSelect;
export type NewContratante = typeof contratantes.$inferInsert;
export type Ciot = typeof ciots.$inferSelect;
export type NewCiot = typeof ciots.$inferInsert;
export type PefLancamento = typeof pef_lancamentos.$inferSelect;
export type NewPefLancamento = typeof pef_lancamentos.$inferInsert;
