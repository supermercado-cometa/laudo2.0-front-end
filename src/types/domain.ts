export type EstadoEquipamento = "funcionando" | "nao_funcionando" | "";
export type Necessidade = "substituido" | "enviar_conserto" | "descartado" | "";

export type SetorType = {
  id: number;
  nome: string;
};

export type LojaType = {
  id: number;
  nome: string;
};

export type Equipamento = {
  id: number;
  nome: string;
  modelo_id: number;
  setor_id: number;
  loja_id: number;
  estado: EstadoEquipamento;
  necessidade: Necessidade;
};

export type InfoLaudo = {
  id: number;
  numeroChamado: string;
  tecnico: string;
  equipamento: string;
  modelo: string;
  loja: string;
  setor: string;
  tombo: string;
  data: string;
  testesRealizados?: string | null;
  diagnostico?: string | null;
  estadoEquipamento?: "FUNCIONANDO" | "NAO_FUNCIONANDO" | null;
  necessidade?: "SUBSTITUIDO" | "ENVIAR_CONSERTO" | "DESCARTADO" | null;
  createdAt: string;
  createdByUsername?: string | null;
};
