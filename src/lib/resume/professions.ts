import type { TemplateId } from "./schema";

export interface Profession {
  id: string;
  name: string;
  category: string;
  template: TemplateId;
  /** Segunda opção de modelo para a profissão */
  alt: TemplateId;
  /** Palavras-chave e competências típicas (sugestões que o usuário só adiciona se forem verdadeiras) */
  keywords: string[];
  /** Outros nomes pelos quais a profissão é conhecida (usados na busca) */
  aliases: string[];
}

export const TEMPLATE_REASON: Record<TemplateId, string> = {
  classic: "Formato mais aceito por RH em áreas tradicionais e mais bem lido por sistemas de triagem (ATS): coluna única, fonte sóbria e títulos claros.",
  minimal: "Leitura limpa, sem elementos gráficos e com máxima compatibilidade com ATS. Ideal para funções técnicas e posições em que o conteúdo fala por si.",
  modern: "Barra lateral com foto, contato e competências. Valoriza a apresentação pessoal em funções com contato direto com pessoas e clientes.",
  "first-job": "Prioriza objetivo, formação, cursos e habilidades. Perfeito para quem está começando ou tem pouca experiência formal.",
  creative: "Foto grande e identidade visual marcante. Indicado para quem trabalha com imagem, design e portfólio.",
};

const ALT: Record<TemplateId, TemplateId> = { classic: "minimal", minimal: "classic", modern: "classic", "first-job": "classic", creative: "modern" };

type Row = [name: string, template: TemplateId, keywords: string[], aliases?: string[]];

const CATEGORIES: { name: string; rows: Row[] }[] = [
  { name: "Administrativo e escritório", rows: [
    ["Assistente administrativo", "classic", ["Pacote Office", "Organização de documentos", "Atendimento telefônico", "Controle de agenda", "Comunicação"]],
    ["Auxiliar administrativo", "classic", ["Excel", "Arquivo e protocolo", "Atendimento ao público", "Digitação", "Organização"]],
    ["Recepcionista", "modern", ["Atendimento ao cliente", "Gestão de agenda", "Telefonia", "Cordialidade", "Controle de visitantes"]],
    ["Secretária / Secretário executivo", "classic", ["Gestão de agenda", "Redação empresarial", "Organização de reuniões", "Excel", "Confidencialidade"]],
    ["Assistente financeiro", "classic", ["Contas a pagar e receber", "Conciliação bancária", "Excel avançado", "Fluxo de caixa", "Emissão de notas fiscais"]],
    ["Auxiliar contábil", "classic", ["Lançamentos contábeis", "Conciliação", "Notas fiscais", "Excel", "Sistemas contábeis"]],
    ["Contador", "classic", ["Contabilidade fiscal", "Balanços", "SPED", "Legislação tributária", "Sistemas contábeis"]],
    ["Analista financeiro", "classic", ["Análise de indicadores", "Orçamento", "Fluxo de caixa", "Excel avançado", "Relatórios gerenciais"]],
    ["Analista fiscal", "classic", ["Apuração de impostos", "SPED", "Notas fiscais", "Legislação tributária", "ERP"]],
    ["Assistente de RH / Departamento pessoal", "classic", ["Admissão e demissão", "Folha de pagamento", "Benefícios", "Legislação trabalhista", "eSocial"]],
    ["Analista de Recursos Humanos", "classic", ["Recrutamento e seleção", "Entrevistas por competências", "Treinamento", "Indicadores de RH", "Comunicação"]],
    ["Auxiliar de escritório", "classic", ["Pacote Office", "Organização", "Atendimento", "Digitação", "Proatividade"]],
    ["Analista de compras / Comprador", "classic", ["Negociação com fornecedores", "Cotações", "ERP", "Controle de estoque", "Análise de custos"]],
    ["Telefonista / Digitador(a)", "classic", ["Atendimento telefônico", "Digitação", "Pacote Office", "Organização", "Comunicação"], ["telefonista", "digitador", "digitadora"]],
    ["Office boy / Auxiliar de serviços externos", "classic", ["Serviços bancários e cartoriais", "Entrega de documentos", "Organização de rotas", "Pontualidade", "Responsabilidade"], ["office boy", "contínuo", "continuo", "mensageiro"]],
    ["Gerente administrativo", "classic", ["Gestão de equipes", "Orçamento", "Controle de processos", "Indicadores", "Liderança"]],
  ]},
  { name: "Vendas e atendimento", rows: [
    ["Vendedor(a) de loja", "modern", ["Atendimento ao cliente", "Negociação", "Metas de vendas", "Pós-venda", "Comunicação"]],
    ["Operador(a) de caixa", "classic", ["Operação de PDV", "Atenção a detalhes", "Atendimento", "Fechamento de caixa", "Agilidade"]],
    ["Atendente de loja", "modern", ["Atendimento ao público", "Organização de vitrine", "Controle de estoque", "Comunicação", "Simpatia"]],
    ["Atendente de telemarketing / Call center", "classic", ["Atendimento receptivo", "Comunicação clara", "CRM", "Resolução de problemas", "Metas de qualidade"]],
    ["Representante comercial", "modern", ["Prospecção de clientes", "Negociação", "CRM", "Gestão de carteira", "Metas"]],
    ["Consultor(a) de vendas", "modern", ["Venda consultiva", "Prospecção", "Negociação", "CRM", "Relacionamento"]],
    ["Promotor(a) de vendas", "modern", ["Ações de ponto de venda", "Merchandising", "Relatórios de visita", "Negociação", "Dinamismo"]],
    ["Supervisor(a) de vendas", "classic", ["Gestão de equipe", "Indicadores comerciais", "Treinamento", "Metas", "Planejamento"]],
    ["Gerente de loja", "classic", ["Gestão de equipe", "Resultados de vendas", "Controle de estoque", "Atendimento", "Liderança"]],
    ["Atendente de farmácia", "classic", ["Atendimento ao cliente", "Conhecimento de medicamentos", "Controle de estoque", "Sistemas de PDV", "Ética"]],
    ["Analista de Customer Success", "modern", ["Relacionamento com clientes", "Onboarding", "Indicadores de satisfação", "CRM", "Comunicação"]],
  ]},
  { name: "Tecnologia", rows: [
    ["Desenvolvedor(a) de software", "minimal", ["Lógica de programação", "Git", "APIs REST", "Banco de dados", "Metodologias ágeis"]],
    ["Analista de sistemas", "minimal", ["Levantamento de requisitos", "Modelagem de dados", "SQL", "Documentação", "Metodologias ágeis"]],
    ["Analista de suporte / Help desk", "classic", ["Atendimento de chamados", "Windows e Linux", "Redes", "Resolução de problemas", "Comunicação"]],
    ["Técnico(a) de informática", "classic", ["Manutenção de computadores", "Redes", "Instalação de softwares", "Suporte ao usuário", "Hardware"]],
    ["Analista de dados", "minimal", ["SQL", "Excel avançado", "Power BI", "Python", "Visualização de dados"]],
    ["Cientista de dados", "minimal", ["Python", "Estatística", "Machine learning", "SQL", "Visualização de dados"]],
    ["Analista de qualidade (QA)", "minimal", ["Testes manuais e automatizados", "Plano de testes", "Jira", "Metodologias ágeis", "Atenção a detalhes"]],
    ["Engenheiro(a) DevOps", "minimal", ["CI/CD", "Docker", "Cloud (AWS/Azure/GCP)", "Linux", "Monitoramento"]],
    ["Designer UX/UI", "creative", ["Pesquisa com usuários", "Figma", "Prototipação", "Design system", "Usabilidade"]],
    ["Gerente de projetos de TI", "classic", ["Gestão de projetos", "Metodologias ágeis", "Cronogramas", "Gestão de riscos", "Comunicação com stakeholders"]],
    ["Desenvolvedor(a) web / Front-end", "minimal", ["HTML, CSS e JavaScript", "React", "Git", "Responsividade", "APIs REST"], ["front end", "frontend", "programador web", "site"]],
    ["Técnico(a) de redes / Suporte técnico", "classic", ["Redes e cabeamento", "Roteadores e Wi-Fi", "Suporte remoto", "Resolução de problemas", "Windows e Linux"], ["redes", "suporte", "cabeamento", "ti"]],
    ["Analista de segurança da informação", "minimal", ["Gestão de vulnerabilidades", "Políticas de segurança", "Redes", "Resposta a incidentes", "LGPD"]],
  ]},
  { name: "Saúde", rows: [
    ["Enfermeiro(a)", "classic", ["Assistência de enfermagem", "SAE", "Segurança do paciente", "Gestão de equipe", "Registros clínicos"]],
    ["Técnico(a) de enfermagem", "classic", ["Cuidados ao paciente", "Aferição de sinais vitais", "Medicação", "Biossegurança", "Trabalho em equipe"]],
    ["Médico(a)", "classic", ["Atendimento clínico", "Prontuário eletrônico", "Diagnóstico", "Trabalho multiprofissional", "Ética médica"]],
    ["Dentista", "classic", ["Atendimento clínico", "Biossegurança", "Planejamento de tratamento", "Prontuário", "Relacionamento com pacientes"]],
    ["Fisioterapeuta", "classic", ["Avaliação funcional", "Reabilitação", "Planos de tratamento", "Atendimento humanizado", "Prontuário"]],
    ["Nutricionista", "classic", ["Avaliação nutricional", "Planos alimentares", "Orientação a pacientes", "Educação alimentar", "Atendimento clínico"]],
    ["Psicólogo(a)", "classic", ["Atendimento clínico", "Avaliação psicológica", "Escuta qualificada", "Ética profissional", "Elaboração de laudos"]],
    ["Farmacêutico(a)", "classic", ["Dispensação de medicamentos", "Atenção farmacêutica", "Controle de estoque", "Vigilância sanitária", "Legislação"]],
    ["Auxiliar de saúde bucal", "classic", ["Biossegurança", "Apoio ao dentista", "Esterilização", "Agendamento", "Atendimento"]],
    ["Cuidador(a) de idosos", "classic", ["Cuidados diários", "Administração de medicação", "Paciência e empatia", "Primeiros socorros", "Acompanhamento"]],
    ["Biomédico(a)", "classic", ["Análises clínicas", "Biossegurança", "Controle de qualidade", "Equipamentos laboratoriais", "Laudos"]],
    ["Veterinário(a)", "classic", ["Atendimento clínico", "Cirurgia", "Vacinação", "Exames laboratoriais", "Relacionamento com tutores"]],
  ]},
  { name: "Educação", rows: [
    ["Professor(a)", "classic", ["Planejamento de aulas", "Didática", "Avaliação de aprendizagem", "BNCC", "Comunicação com famílias"]],
    ["Pedagogo(a) / Coordenador(a) pedagógico", "classic", ["Projeto político-pedagógico", "Formação de professores", "Gestão escolar", "Avaliação", "Mediação de conflitos"]],
    ["Auxiliar de educação infantil / Monitor(a)", "classic", ["Cuidado com crianças", "Atividades lúdicas", "Primeiros socorros", "Comunicação com famílias", "Paciência"]],
    ["Instrutor(a) / Treinador(a)", "modern", ["Didática", "Elaboração de treinamentos", "Apresentações", "Avaliação de resultados", "Comunicação"]],
    ["Professor(a) de idiomas", "modern", ["Metodologias de ensino", "Conversação", "Preparação para exames", "Planejamento de aulas", "Fluência"]],
  ]},
  { name: "Engenharia e indústria", rows: [
    ["Engenheiro(a) civil", "classic", ["Gestão de obras", "AutoCAD", "Orçamento e planejamento", "Normas técnicas", "Fiscalização"]],
    ["Engenheiro(a) mecânico(a)", "classic", ["Projetos mecânicos", "SolidWorks", "Manutenção industrial", "Normas técnicas", "Melhoria contínua"]],
    ["Engenheiro(a) elétrico(a)", "classic", ["Projetos elétricos", "NR-10", "AutoCAD", "Automação", "Manutenção"]],
    ["Engenheiro(a) de produção", "classic", ["Melhoria contínua", "Lean manufacturing", "Indicadores (KPIs)", "Gestão de processos", "Excel"]],
    ["Técnico(a) em segurança do trabalho", "classic", ["Normas regulamentadoras (NRs)", "Inspeções de segurança", "Treinamentos", "CIPA", "Investigação de acidentes"]],
    ["Operador(a) de produção", "classic", ["Operação de máquinas", "Controle de qualidade", "Normas de segurança", "Trabalho em equipe", "Organização"]],
    ["Mecânico(a) industrial", "classic", ["Manutenção preventiva e corretiva", "Leitura de desenho técnico", "Soldagem", "Normas de segurança", "Lubrificação"]],
    ["Eletricista", "classic", ["Instalações elétricas", "NR-10", "Manutenção", "Leitura de diagramas", "Quadros de comando"]],
    ["Soldador(a)", "classic", ["Soldagem MIG/TIG/eletrodo", "Leitura de desenho técnico", "Normas de segurança", "Corte e montagem", "Inspeção"]],
    ["Técnico(a) em eletrotécnica / mecatrônica", "classic", ["Automação industrial", "CLP", "Manutenção", "Leitura de diagramas", "Normas de segurança"]],
    ["Analista de qualidade industrial", "classic", ["Controle de qualidade", "ISO 9001", "Auditorias internas", "Indicadores", "Ações corretivas"]],
  ]},
  { name: "Logística e transporte", rows: [
    ["Auxiliar de logística / Estoquista", "classic", ["Recebimento e expedição", "Controle de estoque", "Inventário", "WMS", "Organização"]],
    ["Almoxarife", "classic", ["Controle de materiais", "Inventário", "Notas fiscais", "ERP", "Organização"]],
    ["Operador(a) de empilhadeira", "classic", ["Operação de empilhadeira", "Movimentação de cargas", "Normas de segurança", "Armazenagem", "Atenção"]],
    ["Motorista", "classic", ["CNH (categoria)", "Direção defensiva", "Roteirização", "Conferência de cargas", "Pontualidade"]],
    ["Motoboy / Entregador(a)", "classic", ["CNH A", "Conhecimento de rotas", "Pontualidade", "Atendimento ao cliente", "Responsabilidade"]],
    ["Analista de logística", "classic", ["Planejamento logístico", "Indicadores", "Gestão de transportes", "ERP", "Excel avançado"]],
    ["Conferente", "classic", ["Conferência de cargas", "Notas fiscais", "Sistemas de estoque", "Organização", "Atenção a detalhes"]],
  ]},
  { name: "Construção e serviços gerais", rows: [
    ["Pedreiro / Mestre de obras", "classic", ["Alvenaria", "Leitura de projetos", "Acabamento", "Gestão de equipe", "Normas de segurança"]],
    ["Pintor(a)", "classic", ["Pintura residencial e predial", "Preparação de superfícies", "Acabamento", "Normas de segurança", "Capricho"]],
    ["Auxiliar de serviços gerais", "classic", ["Limpeza e conservação", "Organização", "Pontualidade", "Responsabilidade", "Trabalho em equipe"]],
    ["Porteiro(a) / Controlador(a) de acesso", "classic", ["Controle de acesso", "Atendimento", "Registro de ocorrências", "Segurança patrimonial", "Cordialidade"]],
    ["Vigilante", "classic", ["Segurança patrimonial", "Rondas", "Registro de ocorrências", "Curso de vigilante", "Atenção"]],
    ["Zelador(a) / Auxiliar de manutenção predial", "classic", ["Manutenção predial", "Pequenos reparos", "Limpeza", "Organização", "Responsabilidade"]],
    ["Jardineiro(a)", "classic", ["Paisagismo", "Poda e manutenção", "Irrigação", "Uso de equipamentos", "Cuidado com plantas"]],
    ["Ajudante geral", "classic", ["Auxílio em obras e serviços", "Disposição física", "Pontualidade", "Aprendizado rápido", "Trabalho em equipe"]],
    ["Auxiliar de limpeza", "classic", ["Limpeza profissional", "Produtos e equipamentos", "Organização", "Pontualidade", "Responsabilidade"]],
  ]},
  { name: "Alimentação e hotelaria", rows: [
    ["Cozinheiro(a)", "classic", ["Preparo de pratos", "Boas práticas de manipulação", "Controle de estoque", "Fichas técnicas", "Organização de cozinha"]],
    ["Auxiliar de cozinha", "classic", ["Pré-preparo", "Higiene e manipulação de alimentos", "Organização", "Agilidade", "Trabalho em equipe"]],
    ["Garçom / Garçonete", "modern", ["Atendimento ao cliente", "Conhecimento de cardápio", "Agilidade", "Trabalho em equipe", "Comunicação"]],
    ["Barista / Atendente de café", "modern", ["Preparo de bebidas", "Atendimento", "Higiene", "Operação de máquinas", "Agilidade"]],
    ["Padeiro(a) / Confeiteiro(a)", "classic", ["Panificação", "Confeitaria", "Boas práticas", "Controle de qualidade", "Criatividade"]],
    ["Recepcionista de hotel", "modern", ["Check-in e check-out", "Atendimento ao hóspede", "Idiomas", "Sistemas de reservas", "Cordialidade"]],
    ["Camareira / Governanta", "classic", ["Arrumação de quartos", "Padrões de qualidade", "Controle de enxoval", "Organização", "Atenção a detalhes"]],
    ["Gerente de restaurante", "classic", ["Gestão de equipe", "Controle de custos", "Atendimento", "Indicadores", "Escalas"]],
  ]},
  { name: "Marketing, comunicação e criação", rows: [
    ["Designer gráfico", "creative", ["Adobe Photoshop", "Illustrator", "Identidade visual", "Diagramação", "Criatividade"]],
    ["Social media", "creative", ["Planejamento de conteúdo", "Gestão de redes sociais", "Canva", "Métricas de engajamento", "Copywriting"]],
    ["Analista de marketing", "modern", ["Planejamento de campanhas", "Google Analytics", "Mídia paga", "SEO", "Relatórios de resultados"]],
    ["Redator(a) / Copywriter", "minimal", ["Redação publicitária", "SEO", "Revisão", "Pesquisa", "Storytelling"]],
    ["Jornalista", "classic", ["Apuração", "Redação jornalística", "Entrevistas", "Edição", "Ética profissional"]],
    ["Fotógrafo(a)", "creative", ["Fotografia", "Lightroom", "Iluminação", "Edição de imagens", "Portfólio"]],
    ["Editor(a) de vídeo / Videomaker", "creative", ["Premiere", "After Effects", "Roteiro", "Captação", "Edição de vídeo"]],
    ["Publicitário(a)", "modern", ["Criação de campanhas", "Planejamento", "Atendimento a clientes", "Briefing", "Mídia"]],
    ["Arquiteto(a) / Designer de interiores", "creative", ["AutoCAD", "SketchUp", "Projetos", "Renderização", "Portfólio"]],
    ["Produtor(a) de conteúdo", "creative", ["Roteiro", "Edição", "Redes sociais", "Pesquisa", "Criatividade"]],
    ["Assessor(a) de imprensa", "modern", ["Relacionamento com a mídia", "Release", "Gestão de crise", "Redação", "Planejamento"]],
  ]},
  { name: "Jurídico, finanças e gestão", rows: [
    ["Advogado(a)", "classic", ["Pesquisa jurídica", "Elaboração de peças", "Contratos", "Atendimento a clientes", "OAB"]],
    ["Assistente jurídico / Paralegal", "classic", ["Acompanhamento processual", "Redação de documentos", "Pesquisa", "Organização", "Sistemas jurídicos"]],
    ["Analista de projetos / PMO", "classic", ["Gestão de projetos", "Cronogramas", "Indicadores", "Gestão de riscos", "Comunicação"]],
    ["Gerente comercial", "classic", ["Gestão comercial", "Metas e resultados", "Negociação", "Liderança", "Planejamento estratégico"]],
    ["Consultor(a) empresarial", "classic", ["Diagnóstico organizacional", "Análise de processos", "Apresentações", "Gestão de projetos", "Comunicação"]],
    ["Analista de crédito / Bancário(a)", "classic", ["Análise de crédito", "Atendimento ao cliente", "Produtos bancários", "Compliance", "Excel"]],
    ["Diretor(a) / Executivo(a)", "minimal", ["Liderança estratégica", "Gestão de resultados", "Governança", "Planejamento", "Gestão de pessoas"]],
  ]},
  { name: "Beleza, bem-estar e esportes", rows: [
    ["Cabeleireiro(a)", "modern", ["Corte e coloração", "Escova e penteados", "Atendimento ao cliente", "Tendências", "Higiene"]],
    ["Manicure / Pedicure", "modern", ["Esmaltação", "Alongamento de unhas", "Biossegurança", "Atendimento", "Criatividade"]],
    ["Barbeiro(a)", "modern", ["Cortes masculinos", "Barba", "Atendimento ao cliente", "Higiene", "Tendências"]],
    ["Esteticista", "modern", ["Limpeza de pele", "Massagens", "Depilação", "Biossegurança", "Atendimento"]],
    ["Maquiador(a)", "creative", ["Maquiagem social e artística", "Visagismo", "Produtos e técnicas", "Atendimento", "Portfólio"]],
    ["Personal trainer / Educador(a) físico(a)", "modern", ["Prescrição de treinos", "Avaliação física", "Motivação", "CREF", "Acompanhamento de alunos"]],
    ["Massoterapeuta", "modern", ["Massagem terapêutica", "Anamnese", "Biossegurança", "Atendimento", "Técnicas corporais"]],
  ]},
  { name: "Agro e meio ambiente", rows: [
    ["Técnico(a) agrícola / Agrônomo(a)", "classic", ["Manejo de culturas", "Assistência técnica", "Máquinas agrícolas", "Gestão de insumos", "Relatórios técnicos"]],
    ["Operador(a) de máquinas agrícolas", "classic", ["Operação de tratores e colheitadeiras", "Manutenção básica", "Normas de segurança", "CNH", "Responsabilidade"]],
    ["Analista ambiental", "classic", ["Licenciamento ambiental", "Legislação ambiental", "Relatórios técnicos", "Gestão de resíduos", "Auditorias"]],
  ]},
  { name: "Serviços domésticos e limpeza", rows: [
    ["Faxineira / Diarista", "classic", ["Limpeza residencial e comercial", "Organização", "Produtos de limpeza", "Pontualidade", "Responsabilidade", "Confiança"], ["faxineiro", "diarista", "limpeza", "servente", "serviços gerais", "zeladora"]],
    ["Empregada doméstica", "classic", ["Limpeza e organização da casa", "Lavagem e passadoria", "Preparo de refeições", "Cuidado com crianças e idosos", "Responsabilidade", "Discrição"], ["doméstica", "domestica", "empregada", "mensalista", "governanta de casa"]],
    ["Babá", "classic", ["Cuidado com crianças", "Atividades lúdicas", "Primeiros socorros", "Preparo de refeições infantis", "Paciência", "Rotina e higiene"], ["baba", "cuidadora de crianças", "nanny", "cuidador infantil"]],
    ["Passadeira / Lavadeira", "classic", ["Passadoria", "Lavagem de roupas", "Cuidado com tecidos", "Organização", "Capricho"], ["passadeira", "lavadeira", "roupas"]],
    ["Cozinheira doméstica / Marmiteira", "classic", ["Preparo de refeições", "Cardápios variados", "Higiene e manipulação de alimentos", "Organização da cozinha", "Economia de ingredientes"], ["cozinheira", "marmita", "marmiteira", "quentinha"]],
    ["Caseiro(a)", "classic", ["Cuidado de sítio e chácara", "Manutenção e pequenos reparos", "Jardinagem", "Cuidado com animais", "Segurança do local"], ["caseiro", "caseira", "zelador de sítio"]],
    ["Auxiliar de lavanderia", "classic", ["Lavagem e secagem industrial", "Passadoria", "Separação de peças", "Organização", "Agilidade"], ["lavanderia", "lavador de roupas"]],
    ["Lavador(a) de carros", "classic", ["Lavagem e higienização", "Polimento", "Atendimento ao cliente", "Agilidade", "Cuidado com veículos"], ["lava jato", "lavador de carro", "lava rápido"]],
    ["Piscineiro(a)", "classic", ["Limpeza de piscinas", "Tratamento da água", "Manutenção de equipamentos", "Produtos químicos", "Pontualidade"], ["piscina"]],
    ["Dedetizador(a)", "classic", ["Controle de pragas", "Uso de produtos químicos", "Normas de segurança", "Atendimento ao cliente", "Relatórios de serviço"], ["controle de pragas"]],
    ["Costureira / Alfaiate", "classic", ["Corte e costura", "Máquinas de costura", "Ajustes e reformas", "Leitura de moldes", "Capricho"], ["costureira", "alfaiate", "modista", "costura"]],
  ]},
  { name: "Comércio e supermercado", rows: [
    ["Repositor(a) de mercadorias", "classic", ["Reposição de produtos", "Organização de gôndolas", "Conferência de validade", "Controle de estoque", "Agilidade"], ["repositor", "repositora", "supermercado", "gondola"]],
    ["Empacotador(a)", "classic", ["Embalagem de produtos", "Atendimento ao cliente", "Organização", "Agilidade", "Trabalho em equipe"], ["empacotador", "embalador", "bagger"]],
    ["Açougueiro(a)", "classic", ["Corte e desossa", "Higiene e boas práticas", "Atendimento ao cliente", "Controle de estoque", "Uso de facas e equipamentos"], ["açougue", "acougue", "magarefe"]],
    ["Atendente de padaria / Balconista", "modern", ["Atendimento ao cliente", "Fatiamento de frios", "Organização do balcão", "Operação de caixa", "Agilidade"], ["balconista", "atendente de padaria", "atendente de balcão", "padaria"]],
    ["Frentista", "classic", ["Abastecimento", "Atendimento ao cliente", "Operação de caixa", "Normas de segurança", "Conferência de produtos"], ["posto de gasolina", "abastecedor"]],
    ["Fiscal de loja / Prevenção de perdas", "classic", ["Prevenção de perdas", "Observação e atenção", "Abordagem ao cliente", "Registro de ocorrências", "Conferência de estoque"], ["fiscal de prevenção", "segurança de loja"]],
    ["Vendedor(a) autônomo(a) / Revendedor(a)", "modern", ["Venda direta", "Prospecção de clientes", "Atendimento por redes sociais", "Negociação", "Controle de pedidos"], ["revendedora", "vendas diretas", "catálogo", "autônomo"]],
    ["Atendente de lanchonete", "modern", ["Atendimento ao cliente", "Preparo de lanches", "Operação de caixa", "Agilidade", "Higiene"], ["lanchonete", "fast food", "atendente de restaurante"]],
  ]},
  { name: "Construção e manutenção", rows: [
    ["Servente de obras / Ajudante de pedreiro", "classic", ["Auxílio em obras", "Preparo de massa", "Transporte de materiais", "Normas de segurança", "Disposição física"], ["servente", "ajudante de pedreiro", "ajudante de obra"]],
    ["Carpinteiro(a) / Marceneiro(a)", "classic", ["Corte e montagem de madeira", "Leitura de projetos", "Acabamento", "Uso de ferramentas", "Móveis planejados"], ["carpinteiro", "marceneiro", "móveis"]],
    ["Encanador(a) / Bombeiro hidráulico", "classic", ["Instalações hidráulicas", "Reparo de vazamentos", "Leitura de projetos", "Manutenção", "Normas de segurança"], ["encanador", "bombeiro hidráulico", "hidráulica"]],
    ["Azulejista / Gesseiro(a)", "classic", ["Assentamento de revestimentos", "Gesso e forro", "Acabamento", "Leitura de projetos", "Capricho"], ["azulejista", "gesseiro", "ladrilheiro", "pisos"]],
    ["Serralheiro(a) / Vidraceiro(a)", "classic", ["Soldagem", "Esquadrias e portões", "Instalação de vidros", "Leitura de desenho técnico", "Acabamento"], ["serralheiro", "vidraceiro", "serralheria"]],
    ["Técnico(a) de ar-condicionado e refrigeração", "classic", ["Instalação de ar-condicionado", "Manutenção preventiva", "Carga de gás", "Leitura de diagramas", "Atendimento ao cliente"], ["refrigeração", "ar condicionado", "geladeira", "split"]],
    ["Mecânico(a) de automóveis", "classic", ["Manutenção preventiva e corretiva", "Diagnóstico de falhas", "Scanner automotivo", "Suspensão e freios", "Motor e câmbio"], ["mecânico", "mecanico", "oficina", "carro"]],
    ["Funileiro(a) / Pintor(a) automotivo", "classic", ["Reparo de lataria", "Pintura automotiva", "Polimento", "Preparação de superfícies", "Acabamento"], ["funileiro", "lanterneiro", "pintor de carros"]],
    ["Borracheiro(a)", "classic", ["Reparo de pneus", "Balanceamento e alinhamento", "Troca de pneus", "Atendimento ao cliente", "Agilidade"], ["borracharia", "pneus"]],
    ["Técnico(a) em eletrônica / Celulares", "classic", ["Reparo de celulares", "Solda em placas", "Diagnóstico de falhas", "Atendimento ao cliente", "Troca de componentes"], ["assistência técnica", "celular", "eletrônica"]],
  ]},
  { name: "Transporte e entregas", rows: [
    ["Motorista de aplicativo / Taxista", "classic", ["CNH B com EAR", "Direção defensiva", "Conhecimento de rotas", "Atendimento ao passageiro", "Pontualidade"], ["uber", "99", "taxi", "taxista", "motorista particular"]],
    ["Motorista de caminhão / Carreteiro", "classic", ["CNH C/D/E", "Direção defensiva", "Cargas e documentação", "Conhecimento de rotas", "Manutenção básica"], ["caminhoneiro", "carreteiro", "caminhão", "truck"]],
    ["Motorista de ônibus / Van", "classic", ["CNH D", "Direção defensiva", "Atendimento a passageiros", "Cumprimento de horários", "Primeiros socorros"], ["ônibus", "onibus", "van", "escolar", "transporte escolar"]],
    ["Ajudante de caminhão / Chapa", "classic", ["Carga e descarga", "Organização de mercadorias", "Conferência de notas", "Disposição física", "Trabalho em equipe"], ["chapa", "ajudante de entrega", "ajudante de motorista"]],
    ["Mototaxista / Motofretista", "classic", ["CNH A", "Condução segura", "Conhecimento de rotas", "Atendimento ao cliente", "Pontualidade"], ["mototaxi", "motofrete", "motoboy"]],
    ["Separador(a) / Auxiliar de expedição", "classic", ["Separação de pedidos", "Conferência de mercadorias", "Embalagem e etiquetagem", "Coletor de dados", "Organização"], ["expedição", "separador", "picking", "embalador de pedidos"]],
  ]},
  { name: "Indústria e produção", rows: [
    ["Auxiliar de produção / Embalador(a)", "classic", ["Linha de produção", "Embalagem e conferência", "Normas de segurança", "Trabalho em equipe", "Agilidade"], ["auxiliar de produção", "embalador", "linha de produção", "fábrica", "fabrica"]],
    ["Operador(a) de máquinas / CNC", "classic", ["Operação de máquinas", "Leitura de desenho técnico", "Instrumentos de medição", "Controle de qualidade", "Normas de segurança"], ["cnc", "torneiro", "fresador", "ferramenteiro", "operador de máquina"]],
    ["Costureira industrial", "classic", ["Máquinas de costura industriais", "Montagem de peças", "Controle de qualidade", "Agilidade", "Trabalho em equipe"], ["confecção", "overloque", "costura industrial"]],
    ["Pintor(a) industrial", "classic", ["Pintura industrial", "Jateamento", "Preparação de superfícies", "Normas de segurança", "Acabamento"], ["jato de areia", "jateador"]],
  ]},
  { name: "Eventos e entretenimento", rows: [
    ["Bartender / Barman", "modern", ["Preparo de drinks", "Atendimento ao cliente", "Coquetelaria", "Controle de estoque", "Agilidade"], ["barman", "bartender", "barista", "drinks"]],
    ["Recreador(a) / Animador(a) de festas", "modern", ["Recreação infantil", "Comunicação e carisma", "Organização de brincadeiras", "Primeiros socorros", "Criatividade"], ["recreador", "animador", "festas", "buffet infantil"]],
    ["Cerimonialista / Organizador(a) de eventos", "modern", ["Planejamento de eventos", "Fornecedores", "Cronogramas", "Atendimento a clientes", "Gestão de equipe"], ["eventos", "cerimonial", "casamentos"]],
    ["Churrasqueiro(a) / Pizzaiolo(a)", "classic", ["Preparo de carnes", "Pizzas e massas", "Forno e brasa", "Higiene", "Controle de estoque"], ["churrasqueiro", "pizzaiolo", "assador"]],
    ["Salva-vidas / Instrutor(a) de natação", "modern", ["Primeiros socorros", "Resgate aquático", "Ensino de natação", "Atenção e responsabilidade", "Atendimento"], ["salva vidas", "natação", "instrutor de academia"]],
  ]},
  { name: "Saúde e cuidado (apoio)", rows: [
    ["Recepcionista de clínica / Atendente médico", "modern", ["Atendimento a pacientes", "Agendamento de consultas", "Prontuário e sistemas", "Convênios", "Cordialidade"], ["recepcionista médica", "clínica", "consultório", "hospital"]],
    ["Agente comunitário de saúde", "classic", ["Visitas domiciliares", "Cadastro de famílias", "Orientação em saúde", "Comunicação", "Registro de informações"], ["acs", "agente de saúde"]],
    ["Técnico(a) em radiologia / Laboratório", "classic", ["Exames de imagem", "Biossegurança", "Coleta e análise", "Equipamentos", "Registro de resultados"], ["radiologia", "raio x", "laboratório", "coleta"]],
    ["Maqueiro(a) / Auxiliar hospitalar", "classic", ["Transporte de pacientes", "Biossegurança", "Apoio à equipe de saúde", "Organização", "Atenção e cuidado"], ["maqueiro", "hospital", "auxiliar hospitalar"]],
  ]},
  { name: "Segurança", rows: [
    ["Segurança / Vigia", "classic", ["Vigilância patrimonial", "Rondas", "Controle de acesso", "Registro de ocorrências", "Atenção"], ["vigia", "segurança patrimonial", "segurança privada", "vigilante noturno"]],
    ["Bombeiro civil / Brigadista", "classic", ["Prevenção e combate a incêndio", "Primeiros socorros", "Evacuação", "Inspeção de equipamentos", "Normas de segurança"], ["brigadista", "bombeiro"]],
  ]},
  { name: "Primeiro emprego e estágio", rows: [
    ["Primeiro emprego (sem experiência)", "first-job", ["Comunicação", "Organização", "Proatividade", "Vontade de aprender", "Pacote Office"]],
    ["Jovem aprendiz", "first-job", ["Disposição para aprender", "Responsabilidade", "Pacote Office", "Trabalho em equipe", "Pontualidade"]],
    ["Estagiário(a) administrativo", "first-job", ["Pacote Office", "Organização", "Comunicação", "Proatividade", "Atenção a detalhes"]],
    ["Estagiário(a) de tecnologia", "first-job", ["Lógica de programação", "Git", "Trabalho em equipe", "Aprendizado rápido", "Inglês técnico"]],
    ["Estagiário(a) de marketing / comunicação", "first-job", ["Redes sociais", "Canva", "Redação", "Criatividade", "Pacote Office"]],
    ["Estagiário(a) de direito / RH / contabilidade", "first-job", ["Pacote Office", "Rotinas administrativas", "Organização", "Pesquisa", "Atenção a detalhes"], ["estágio direito", "estágio rh", "estágio contabilidade"]],
    ["Estagiário(a) de engenharia", "first-job", ["AutoCAD", "Excel", "Normas técnicas", "Proatividade", "Trabalho em equipe"]],
    ["Recém-formado(a) (trainee)", "first-job", ["Análise e resolução de problemas", "Comunicação", "Liderança", "Inglês", "Excel"]],
  ]},
];

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const PROFESSIONS: Profession[] = CATEGORIES.flatMap((c) =>
  c.rows.map(([name, template, keywords, aliases = []]): Profession => ({ id: slug(name), name, category: c.name, template, alt: ALT[template], keywords, aliases })),
);

export const PROFESSION_CATEGORIES = CATEGORIES.map((c) => c.name);

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\((a|o|as|os)\)/g, "").replace(/\s+/g, " ").trim();

export function getProfession(id: string | undefined | null): Profession | undefined {
  return id ? PROFESSIONS.find((p) => p.id === id) : undefined;
}

/** Associa o "cargo desejado" digitado à profissão da lista (comparação sem acentos). */
export function findProfessionByRole(role: string): Profession | undefined {
  const r = normalize(role);
  if (!r) return undefined;
  return PROFESSIONS.find((p) => normalize(p.name) === r);
}

/**
 * Busca tolerante: ignora acentos, maiúsculas e "(a)". Cada palavra digitada precisa aparecer
 * no nome, nos nomes alternativos ou na área (ex.: "faxineira" encontra "Faxineira / Diarista",
 * "servente" encontra "Faxineira / Diarista" e "Servente de obras"). Resultados do nome vêm primeiro.
 */
export function searchProfessions(query: string, category?: string): Profession[] {
  const tokens = normalize(query).split(" ").filter(Boolean);
  const pool = PROFESSIONS.filter((p) => !category || p.category === category);
  if (!tokens.length) return pool;
  const scored = pool.flatMap((p) => {
    const name = normalize(p.name);
    const hay = `${name} ${p.aliases.map(normalize).join(" ")} ${normalize(p.category)}`;
    if (!tokens.every((t) => hay.includes(t))) return [];
    const score = tokens.every((t) => name.includes(t)) ? (name.startsWith(tokens[0]) ? 0 : 1) : 2;
    return [{ p, score }];
  });
  return scored.sort((a, b) => a.score - b.score).map((x) => x.p);
}
