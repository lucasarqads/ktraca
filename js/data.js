/* ==========================================================================
   Festec — Dados fictícios iniciais (demonstração)
   Todos os nomes, e-mails e telefones são inventados.
   status: 'aguardando' | 'presente' | 'cancelado'
   type:   'pista' | 'vip' | 'imprensa' | 'staff'
   age: idade exata em anos (evento +18)
   checkin: horário 'HH:MM' ou null
   ========================================================================== */

window.FESTEC_EVENT = {
  name: 'Festec Summit 2026',
  date: '22/11/2026',
  time: '19h',
  venue: 'Espaço Vila Nova, São Paulo'
};

window.FESTEC_SEED = [
  { id: 'g01', name: 'Ana Beatriz Persona Teste', email: 'ana.souza@email.com',        phone: '(00) 00000-0000', type: 'vip',      code: 'FST-4821', companions: 1, age: 29, status: 'presente',   checkin: '19:04', notes: 'Mesa 3 — reservada' },
  { id: 'g02', name: 'Bruno Henrique Persona Teste', email: 'bruno.lima@gmail.com',       phone: '(00) 00000-0000', type: 'pista',    code: 'FST-1307', companions: 0, age: 31, status: 'presente',   checkin: '19:11', notes: '' },
  { id: 'g03', name: 'Camila Persona Teste',   email: 'camila.rod@outlook.com',     phone: '(00) 00000-0000', type: 'imprensa', code: 'FST-5590', companions: 0, age: 38, status: 'aguardando', checkin: null,    notes: 'Revista Cena Urbana' },
  { id: 'g04', name: 'Diego Persona Teste',    email: 'diego.f@empresa.com.br',     phone: '(00) 00000-0000', type: 'staff',    code: 'FST-2046', companions: 0, age: 42, status: 'presente',   checkin: '17:45', notes: 'Equipe de credenciamento' },
  { id: 'g05', name: 'Eduarda Persona Teste',  email: 'duda.martins@gmail.com',     phone: '(00) 00000-0000', type: 'pista',    code: 'FST-7712', companions: 2, age: 22, status: 'aguardando', checkin: null,    notes: '' },
  { id: 'g06', name: 'Felipe Persona Teste',   email: 'felipe.carvalho@email.com',  phone: '(00) 00000-0000', type: 'vip',      code: 'FST-3398', companions: 1, age: 51, status: 'aguardando', checkin: null,    notes: 'Patrocinador' },
  { id: 'g07', name: 'Gabriela Persona Teste', email: 'gabi.alves@hotmail.com',     phone: '(00) 00000-0000', type: 'pista',    code: 'FST-8054', companions: 0, age: 24, status: 'cancelado',  checkin: null,    notes: 'Cancelou por e-mail' },
  { id: 'g08', name: 'Henrique Persona Teste', email: 'henrique.b@gmail.com',       phone: '(00) 00000-0000', type: 'pista',    code: 'FST-6129', companions: 1, age: 33, status: 'presente',   checkin: '19:23', notes: '' },
  { id: 'g09', name: 'Isabela Persona Teste',  email: 'isa.nogueira@email.com',     phone: '(00) 00000-0000', type: 'vip',      code: 'FST-9473', companions: 2, age: 36, status: 'presente',   checkin: '19:02', notes: 'Alergia a amendoim' },
  { id: 'g10', name: 'João Pedro Persona Teste', email: 'jp.ribeiro@outlook.com',     phone: '(00) 00000-0000', type: 'pista',    code: 'FST-1185', companions: 0, age: 19, status: 'aguardando', checkin: null,    notes: '' },
  { id: 'g11', name: 'Karina Persona Teste',   email: 'karina.duarte@jornal.com',   phone: '(00) 00000-0000', type: 'imprensa', code: 'FST-4402', companions: 1, age: 27, status: 'presente',   checkin: '18:58', notes: 'Fotógrafa — acesso ao palco' },
  { id: 'g12', name: 'Lucas Persona Teste',    email: 'lucas.moreira@gmail.com',    phone: '(00) 00000-0000', type: 'pista',    code: 'FST-3067', companions: 3, age: 23, status: 'aguardando', checkin: null,    notes: '' },
  { id: 'g13', name: 'Mariana Persona Teste',  email: 'mari.costa@email.com',       phone: '(00) 00000-0000', type: 'vip',      code: 'FST-5821', companions: 0, age: 40, status: 'aguardando', checkin: null,    notes: 'Palestrante convidada' },
  { id: 'g14', name: 'Nicolas Persona Teste',  email: 'nicolas.t@empresa.com.br',   phone: '(00) 00000-0000', type: 'staff',    code: 'FST-7340', companions: 0, age: 30, status: 'presente',   checkin: '17:30', notes: 'Técnico de som' },
  { id: 'g15', name: 'Olívia Persona Teste',   email: 'olivia.pereira@gmail.com',   phone: '(00) 00000-0000', type: 'pista',    code: 'FST-2219', companions: 1, age: 47, status: 'cancelado',  checkin: null,    notes: '' },
  { id: 'g16', name: 'Paulo Vitor Persona Teste', email: 'pv.gomes@hotmail.com',       phone: '(00) 00000-0000', type: 'pista',    code: 'FST-6658', companions: 0, age: 21, status: 'presente',   checkin: '19:31', notes: '' },
  { id: 'g17', name: 'Rafaela Persona Teste',  email: 'rafa.cardoso@email.com',     phone: '(00) 00000-0000', type: 'vip',      code: 'FST-8890', companions: 1, age: 34, status: 'aguardando', checkin: null,    notes: '' },
  { id: 'g18', name: 'Samuel Persona Teste',   email: 'samuel.oli@gmail.com',       phone: '(00) 00000-0000', type: 'pista',    code: 'FST-1532', companions: 2, age: 63, status: 'aguardando', checkin: null,    notes: 'Chega após as 20h' },
  { id: 'g19', name: 'Thaís Persona Teste',    email: 'thais.mendes@podcast.fm',    phone: '(00) 00000-0000', type: 'imprensa', code: 'FST-9017', companions: 0, age: 28, status: 'aguardando', checkin: null,    notes: 'Podcast Noite Adentro' },
  { id: 'g20', name: 'Vinícius Persona Teste', email: 'vini.araujo@outlook.com',    phone: '(00) 00000-0000', type: 'pista',    code: 'FST-4763', companions: 0, age: 20, status: 'presente',   checkin: '19:17', notes: '' },
  { id: 'g21', name: 'Yasmin Persona Teste',   email: 'yasmin.freitas@gmail.com',   phone: '(00) 00000-0000', type: 'pista',    code: 'FST-3841', companions: 1, age: 25, status: 'aguardando', checkin: null,    notes: '' },
  { id: 'g22', name: 'Rodrigo Persona Teste',  email: 'rodrigo.pacheco@email.com',  phone: '(00) 00000-0000', type: 'vip',      code: 'FST-5276', companions: 2, age: 55, status: 'cancelado',  checkin: null,    notes: 'Remarcou para a próxima edição' },
  { id: 'g23', name: 'Letícia Persona Teste',  email: 'leticia.ramos@empresa.com.br', phone: '(00) 00000-0000', type: 'staff', code: 'FST-6904', companions: 0, age: 32, status: 'aguardando', checkin: null,    notes: 'Recepção — turno 2' },
  { id: 'g24', name: 'Matheus Persona Teste',  email: 'matheus.cav@gmail.com',      phone: '(00) 00000-0000', type: 'pista',    code: 'FST-2675', companions: 0, age: 44, status: 'aguardando', checkin: null,    notes: '' },
  { id: 'g25', name: 'Juliana Persona Teste',  email: 'ju.azevedo@hotmail.com',     phone: '(00) 00000-0000', type: 'pista',    code: 'FST-7158', companions: 1, age: 61, status: 'presente',   checkin: '19:08', notes: '' }
];
