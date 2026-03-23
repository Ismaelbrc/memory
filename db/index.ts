import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'fretecontrol.db');
const dataDir = path.join(process.cwd(), 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operador' CHECK(role IN ('admin', 'operador', 'financeiro')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transportadores (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    cnh_numero TEXT NOT NULL,
    cnh_categoria TEXT NOT NULL,
    cnh_vencimento TEXT NOT NULL,
    rntrc TEXT NOT NULL,
    banco TEXT,
    agencia TEXT,
    conta TEXT,
    tipo_conta TEXT CHECK(tipo_conta IN ('corrente', 'poupanca')),
    status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS veiculos (
    id TEXT PRIMARY KEY,
    placa TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL CHECK(tipo IN ('truck', 'carreta', 'bitrem', 'reboque', 'vanderleia', 'outros')),
    rntrc TEXT NOT NULL,
    proprietario_id TEXT NOT NULL REFERENCES transportadores(id),
    crlv_vencimento TEXT NOT NULL,
    seguro_vencimento TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contratantes (
    id TEXT PRIMARY KEY,
    razao_social TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    endereco TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ciots (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    data_emissao TEXT NOT NULL,
    tipo_operacao TEXT NOT NULL CHECK(tipo_operacao IN ('contratacao', 'subcontratacao')),
    contratante_id TEXT NOT NULL REFERENCES contratantes(id),
    transportador_id TEXT NOT NULL REFERENCES transportadores(id),
    veiculo_id TEXT NOT NULL REFERENCES veiculos(id),
    origem_municipio TEXT NOT NULL,
    origem_uf TEXT NOT NULL,
    destino_municipio TEXT NOT NULL,
    destino_uf TEXT NOT NULL,
    produto TEXT NOT NULL,
    tipo_carga TEXT NOT NULL,
    peso_kg REAL NOT NULL,
    valor_carga REAL NOT NULL,
    valor_frete REAL NOT NULL,
    adiantamento REAL DEFAULT 0,
    complemento REAL DEFAULT 0,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'emitido' CHECK(status IN ('emitido', 'em_andamento', 'concluido', 'cancelado')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pef_lancamentos (
    id TEXT PRIMARY KEY,
    ciot_id TEXT NOT NULL REFERENCES ciots(id),
    tipo TEXT NOT NULL CHECK(tipo IN ('adiantamento', 'complemento', 'pedagio', 'combustivel', 'outros')),
    valor REAL NOT NULL,
    data_pagamento TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL CHECK(forma_pagamento IN ('pix', 'ted', 'cartao_frete')),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'pago', 'estornado')),
    comprovante_url TEXT,
    descricao TEXT,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export default db;
