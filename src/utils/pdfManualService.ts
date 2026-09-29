import { jsPDF } from 'jspdf';

/**
 * Desenha o emblema vetorial da República Portuguesa (Escudo + Esfera Armilar)
 */
function drawRepublicaEmblem(doc: jsPDF, x: number, y: number, scale = 1) {
  const r = 5.5 * scale;
  doc.setFillColor(0, 102, 51);
  doc.circle(x, y, r, 'F');

  doc.setFillColor(204, 0, 0);
  doc.rect(x, y - r, r, r * 2, 'F');

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6 * scale);
  doc.circle(x, y, r * 0.65, 'S');
  doc.line(x - r * 0.65, y, x + r * 0.65, y);
  doc.line(x, y - r * 0.65, x, y + r * 0.65);

  doc.setFillColor(204, 0, 0);
  doc.roundedRect(
    x - 1.6 * scale,
    y - 1.8 * scale,
    3.2 * scale,
    3.6 * scale,
    0.5 * scale,
    0.5 * scale,
    'F'
  );
  doc.setFillColor(255, 255, 255);
  doc.rect(
    x - 0.9 * scale,
    y - 1.1 * scale,
    1.8 * scale,
    2.2 * scale,
    'F'
  );
}

/**
 * Desenha o badge TLP:GREEN (fundo preto, texto verde néon)
 */
function drawTlpGreenBadge(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(18, 18, 18);
  doc.rect(x, y - 3.8, 22.5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(46, 213, 115);
  doc.text('TLP:GREEN', x + 1.5, y - 0.3);
}

/**
 * Desenha o cabeçalho institucional das páginas interiores (Pág. 3+)
 */
function drawContentPageHeader(
  doc: jsPDF,
  pageWidth: number,
  docTitleShort: string
) {
  doc.setFillColor(247, 241, 236);
  doc.rect(0, 0, pageWidth, 29, 'F');

  drawTlpGreenBadge(doc, pageWidth - 44.5, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(docTitleShort, 24, 21.5);

  doc.setDrawColor(45, 45, 45);
  doc.setLineWidth(0.5);
  doc.line(24, 26, pageWidth - 22, 26);
}

/**
 * Desenha o rodapé institucional DGLAB + República Portuguesa + Paginação
 */
function drawPageFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  pageNum: number,
  totalPages: number,
  isIndexPage = false
) {
  if (isIndexPage) {
    const centerX = pageWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('DGLAB', centerX - 34, pageHeight - 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    doc.setTextColor(70, 70, 70);
    doc.text('DIREÇÃO-GERAL DO LIVRO,', centerX - 34, pageHeight - 17.5);
    doc.text('DOS ARQUIVOS E DAS BIBLIOTECAS', centerX - 34, pageHeight - 15.5);

    drawRepublicaEmblem(doc, centerX + 2, pageHeight - 19, 0.85);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text('REPÚBLICA', centerX + 9, pageHeight - 19.5);
    doc.text('PORTUGUESA', centerX + 9, pageHeight - 16);
    return;
  }

  doc.setDrawColor(45, 45, 45);
  doc.setLineWidth(0.4);
  doc.line(22, pageHeight - 18, pageWidth - 22, pageHeight - 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('DGLAB', 22, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(80, 80, 80);
  doc.text('DIREÇÃO-GERAL DO LIVRO,', 22, pageHeight - 10);
  doc.text('DOS ARQUIVOS E DAS BIBLIOTECAS', 22, pageHeight - 8.3);

  drawRepublicaEmblem(doc, 46, pageHeight - 11.5, 0.65);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(40, 40, 40);
  doc.text('REPÚBLICA', 51, pageHeight - 12);
  doc.text('PORTUGUESA', 51, pageHeight - 9.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Página ${pageNum} de ${totalPages}`,
    pageWidth - 22,
    pageHeight - 11,
    { align: 'right' }
  );
}

/**
 * Desenha uma linha pontilhada horizontal
 */
function drawDottedLine(
  doc: jsPDF,
  x1: number,
  y: number,
  x2: number,
  step = 1.2
) {
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.25);
  for (let x = x1; x < x2; x += step * 2) {
    doc.line(x, y, Math.min(x + step, x2), y);
  }
}

export function descarregarManualInstalacaoPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 24;
  const maxWidth = pageWidth - marginX - 22; // 164 mm
  const docTitleShort = 'MANUAL TÉCNICO E DE SEGURANÇA - INTRANET DDPCD (NR)';

  // ==========================================================================
  // PÁGINA 1: CAPA OFICIAL DGLAB / REPÚBLICA PORTUGUESA
  // ==========================================================================
  doc.setFillColor(247, 241, 236);
  doc.rect(0, 162, pageWidth, pageHeight - 162, 'F');

  drawRepublicaEmblem(doc, 34, 38, 1.35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(45, 45, 45);
  doc.text('REPÚBLICA', 44, 36.5);
  doc.text('PORTUGUESA', 44, 42.2);

  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.line(87, 29, 87, 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 75, 75);
  doc.text('CULTURA, JUVENTUDE', 92, 37.5);
  doc.text('E DESPORTO', 92, 41.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(45, 45, 45);
  doc.text('DIREÇÃO-GERAL DO LIVRO, DOS ARQUIVOS E', 28, 53);
  doc.text('DAS BIBLIOTECAS', 28, 58.2);

  // Título e Subtítulo do Documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(68, 68, 68);
  doc.text('MANUAL TÉCNICO E DE', 24, 86);
  doc.text('INSTALAÇÃO - INTRANET DDPCD', 24, 96);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13.5);
  doc.setTextColor(85, 85, 85);
  doc.text(
    'Núcleo de Reprodução (NR) - Arquitetura, Base de Dados',
    24,
    107
  );
  doc.text(
    'e Conformidade ISO/IEC 27001:2022 / Diretiva NIS2',
    24,
    114
  );

  // Tabela de Controlo Documental na Capa
  const metaRows: [string, string, boolean?][] = [
    ['Identificador:', 'I-2026-DDPCD-NR-001'],
    ['Versão:', '1'],
    ['Data da versão:', '29-09-2026'],
    ['Autor:', 'José Miguel Magalhães - DDPCD'],
    ['Aprovado por:', ''],
    ['Estado', 'Pendente validação'],
    ['Nível de confidencialidade:', 'TLP:GREEN', true],
  ];

  let metaY = 171;
  drawDottedLine(doc, 24, metaY, pageWidth - 24);
  for (const [label, val, isTlp] of metaRows) {
    metaY += 5.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(20, 20, 20);
    doc.text(label, 26, metaY);

    if (isTlp) {
      drawTlpGreenBadge(doc, 85, metaY + 0.5);
    } else if (val) {
      doc.setFont('helvetica', 'normal');
      doc.text(val, 85, metaY);
    }
    metaY += 2;
    drawDottedLine(doc, 24, metaY, pageWidth - 24);
  }

  // ==========================================================================
  // PÁGINA 2: ÍNDICE E TABELA DE REVISÕES
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(247, 241, 236);
  doc.rect(0, 0, pageWidth, 215, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(190, 148, 45);
  doc.text('ÍNDICE', 24, 31);

  const tocItems: [string, string, string][] = [
    ['1', 'PACOTES DE SOFTWARE NECESSÁRIOS INSTALAR', '3'],
    ['2', 'BASE DE DADOS A INSTALAR E SCRIPT PARA CRIAR A BD', '4'],
    ['3', 'WEB SERVER A INSTALAR E SERVIÇO SYSTEMD', '5'],
    ['4', 'CONJUNTO DE FICHEIROS DA APLICAÇÃO (/opt/app_nr)', '6'],
    ['5', 'CONFIGURAÇÕES A APLICAR E CONTROLOS ISO 27001 / NIS2', '7'],
  ];

  let tocY = 40;
  for (const [num, title, pg] of tocItems) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(20, 20, 20);
    doc.text(num, 24, tocY);
    doc.text(title, 32, tocY);
    doc.text(pg, pageWidth - 24, tocY, { align: 'right' });

    const titleWidth = doc.getTextWidth(title);
    const dotsStart = 32 + titleWidth + 2;
    const dotsEnd = pageWidth - 28;
    drawDottedLine(doc, dotsStart, tocY - 0.8, dotsEnd, 0.8);

    tocY += 6.5;
  }

  // Secção REVISÕES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(190, 148, 45);
  doc.text('REVISÕES', 24, 83);

  let revY = 89;
  drawDottedLine(doc, 24, revY, pageWidth - 24);
  revY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(20, 20, 20);
  doc.text('#', 26, revY);
  doc.text('Data', 36, revY);
  doc.text('Autor', 68, revY);
  doc.text('Alterações', 108, revY);
  revY += 2;
  drawDottedLine(doc, 24, revY, pageWidth - 24);

  // Linha única de revisão solicitada (29-09-2026 | José Magalhães)
  revY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('1', 26, revY);
  doc.text('29-09-2026', 36, revY);
  doc.text('José Magalhães', 68, revY);
  doc.text(
    'Criação do documento (Arquitetura SQLite e ISO 27001 / NIS2)',
    108,
    revY
  );
  revY += 2;
  drawDottedLine(doc, 24, revY, pageWidth - 24);

  // Linha vazia de template
  revY += 5;
  doc.text('2', 26, revY);
  revY += 2;
  drawDottedLine(doc, 24, revY, pageWidth - 24);

  // ==========================================================================
  // HELPERS PARA AS PÁGINAS DE CONTEÚDO (PÁG. 3 EM DIANTE)
  // ==========================================================================
  let y = 38;

  const startNewContentPage = () => {
    doc.addPage();
    drawContentPageHeader(doc, pageWidth, docTitleShort);
    y = 38;
  };

  const checkSpace = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      startNewContentPage();
    }
  };

  const addMainSectionHeading = (num: string, title: string) => {
    checkSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(190, 148, 45);
    doc.text(`${num}  ${title}`, marginX, y);
    y += 7;
  };

  const addSubHeading = (title: string) => {
    checkSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(title, marginX, y);
    y += 5;
  };

  const addBodyText = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(45, 55, 72);
    const lines = doc.splitTextToSize(text, maxWidth);
    checkSpace(lines.length * 4.4 + 2);
    doc.text(lines, marginX, y);
    y += lines.length * 4.4 + 2.5;
  };

  const addBulletPoint = (label: string, desc: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(35, 45, 60);
    const text = `-  ${label}: ${desc}`;
    const lines = doc.splitTextToSize(text, maxWidth - 3);
    checkSpace(lines.length * 4.3 + 1.5);
    doc.text(lines, marginX + 2, y);
    y += lines.length * 4.3 + 1.5;
  };

  const addCodeBlock = (lines: string[]) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const wrapped: string[] = [];
    for (const l of lines) {
      wrapped.push(...doc.splitTextToSize(l, maxWidth - 8));
    }
    const boxH = wrapped.length * 3.9 + 5;
    checkSpace(boxH + 3);

    doc.setFillColor(244, 244, 246);
    doc.setDrawColor(200, 205, 212);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, y - 3, maxWidth, boxH, 1, 1, 'FD');

    doc.setTextColor(25, 30, 40);
    let cy = y + 0.5;
    for (const wl of wrapped) {
      doc.text(wl, marginX + 3, cy);
      cy += 3.9;
    }
    y += boxH + 3.5;
  };

  // ==========================================================================
  // PÁGINA 3 — SECÇÃO 1: PACOTES DE SOFTWARE NECESSÁRIOS INSTALAR
  // ==========================================================================
  startNewContentPage();

  addMainSectionHeading('1', 'PACOTES DE SOFTWARE NECESSÁRIOS INSTALAR');
  addBodyText(
    'Em conformidade com a norma ISO/IEC 27001:2022 (Controlos A.8.8 Gestão de Vulnerabilidades Técnicas e A.8.19 Instalação de Software em Sistemas Operacionais) e com a Diretiva NIS2 (Segurança da Cadeia de Abastecimento), apenas devem ser instalados no servidor NEW-DDPCD-NR os pacotes estritamente necessários à execução da aplicação.'
  );

  addSubHeading('1.1. Pacotes Base do Sistema Operativo (Linux Ubuntu/Debian LTS)');
  addBulletPoint(
    'git',
    'Sistema de controlo de versões para sincronização segura do código-fonte a partir do repositório oficial GitHub.'
  );
  addBulletPoint(
    'curl & ca-certificates',
    'Transferência segura (HTTPS/TLS) dos repositórios oficiais NodeSource.'
  );
  addBulletPoint(
    'nodejs (v22.x LTS) & npm',
    'Ambiente de execução JavaScript/TypeScript de suporte prolongado (LTS).'
  );
  addBulletPoint(
    'sqlite3 (CLI opcional)',
    'Utilitário de linha de comandos para inspeção administrativa, cópias de segurança e verificação de integridade.'
  );

  addCodeBlock([
    '# Comando de instalacao dos pacotes de sistema no servidor Linux:',
    'sudo apt update && sudo apt install -y git curl ca-certificates sqlite3',
    'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -',
    'sudo apt install -y nodejs',
  ]);

  addSubHeading('1.2. Pacotes e Dependências da Aplicação (package.json)');
  addBodyText(
    'As dependências da aplicação são instaladas localmente em /opt/app_nr/node_modules através do ficheiro package.json com a flag "--legacy-peer-deps":'
  );
  addBulletPoint('express (^4.21.2)', 'Servidor HTTP e API REST interna.');
  addBulletPoint(
    'sql.js (^1.13.0)',
    'Motor relacional SQLite 3 compilado em WebAssembly para persistência transacional em /opt/app_nr/base_dados_nr.db.'
  );
  addBulletPoint(
    'react (^19.0.1) & react-dom (^19.0.1)',
    'Interface gráfica SPA da Intranet DDPCD.'
  );
  addBulletPoint(
    'xlsx (^0.18.5) & jspdf (^4.2.1)',
    'Importação/exportação de relatórios Excel (.xlsx) e emissão de documentação técnica PDF.'
  );
  addBulletPoint(
    'vite (^8.3.0), tsx (^4.21.0), tailwindcss (^4.3.3)',
    'Compilador frontend e executor TypeScript de produção.'
  );

  addCodeBlock([
    '# Instalacao das dependencias da aplicacao em /opt/app_nr:',
    'cd /opt/app_nr',
    'npm install --legacy-peer-deps',
    'npm run build',
  ]);

  // ==========================================================================
  // PÁGINA 4 — SECÇÃO 2: BD A INSTALAR E SCRIPT PARA CRIAR A BD
  // ==========================================================================
  startNewContentPage();

  addMainSectionHeading('2', 'BD A INSTALAR E SCRIPT PARA CRIAR A BD');
  addBodyText(
    'A aplicação utiliza uma base de dados relacional SQLite 3 armazenada no ficheiro local /opt/app_nr/base_dados_nr.db. Esta arquitetura elimina a exposição de portas de base de dados na rede (Controlo ISO 27001 A.8.20 Segurança de Redes), sendo ideal para o universo de 15 a 20 utilizadores do Núcleo de Reprodução.'
  );

  addSubHeading('2.1. Dicionário de Dados e Controlo Criptográfico (ISO 27001 A.8.24)');
  addBulletPoint(
    'Tabela utilizadores',
    'Armazena credenciais e perfis RBAC ("admin" ou "operador"). As palavras-passe nunca são guardadas em texto limpo, utilizando derivação criptográfica PBKDF2-HMAC-SHA256 (600.000 iterações + salt aleatório) compatível com Werkzeug/Python.'
  );
  addBulletPoint(
    'Tabela registos_producao',
    'Armazena os registos diários de captura digital. Inclui restrição UNIQUE no campo "identificador_documento" para garantir a integridade referencial e impedir duplicações.'
  );

  addSubHeading('2.2. Script SQL Oficial de Criação da Base de Dados (DDL)');
  addBodyText(
    'O servidor executa automaticamente a criação das tabelas no arranque se o ficheiro não existir. Caso pretenda criar ou auditar manualmente a base de dados via CLI (sqlite3 /opt/app_nr/base_dados_nr.db), utilize o seguinte script SQL:'
  );

  addCodeBlock([
    '-- =========================================================================',
    '-- SCRIPT DDL DE CRIACAO DA BASE DE DADOS: /opt/app_nr/base_dados_nr.db',
    '-- Norma ISO/IEC 27001:2022 - Integridade e Controlo de Acessos (RBAC)',
    '-- =========================================================================',
    '',
    'PRAGMA encoding = "UTF-8";',
    '',
    '-- 1. Tabela de Utilizadores e Perfis de Acesso',
    'CREATE TABLE IF NOT EXISTS utilizadores (',
    '    id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '    username TEXT NOT NULL UNIQUE,',
    '    password_hash TEXT NOT NULL,',
    '    nome_operador TEXT NOT NULL,',
    '    perfil TEXT NOT NULL DEFAULT \'operador\' CHECK(perfil IN (\'admin\', \'operador\'))',
    ');',
    '',
    '-- 2. Tabela de Registos de Producao de Captura Digital',
    'CREATE TABLE IF NOT EXISTS registos_producao (',
    '    id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '    data_hora_captura TEXT NOT NULL,',
    '    nome_operador TEXT NOT NULL,',
    '    pedido TEXT,',
    '    identificador_documento TEXT NOT NULL UNIQUE,',
    '    tipo_pedido TEXT NOT NULL,',
    '    tipo_trabalho TEXT NOT NULL,',
    '    tipo_fonte TEXT NOT NULL,',
    '    total_imagens INTEGER NOT NULL DEFAULT 0',
    ');',
    '',
    '-- 3. Indices para Otimizacao de Pesquisas e Relatorios Mensais',
    'CREATE INDEX IF NOT EXISTS idx_registos_data ON registos_producao(data_hora_captura);',
    'CREATE INDEX IF NOT EXISTS idx_registos_operador ON registos_producao(nome_operador);',
    'CREATE INDEX IF NOT EXISTS idx_registos_pedido ON registos_producao(pedido);',
  ]);

  // ==========================================================================
  // PÁGINA 5 — SECÇÃO 3: WEB SERVER A INSTALAR
  // ==========================================================================
  startNewContentPage();

  addMainSectionHeading('3', 'WEB SERVER A INSTALAR');
  addBodyText(
    'O serviço web é assegurado diretamente pelo servidor HTTP Express (Node.js) integrado no ficheiro /opt/app_nr/server.ts, escutando exclusivamente na porta TCP 3000 da interface de rede interna (Intranet DGLAB). Não é necessária a instalação de servidores web externos, reduzindo a superfície de ataque.'
  );

  addSubHeading('3.1. Características do Web Server Integrado');
  addBulletPoint(
    'Porto de Escuta',
    'TCP 3000 (0.0.0.0:3000) - Acessível apenas na Intranet (ex: http://NEW-DDPCD-NR:3000).'
  );
  addBulletPoint(
    'Serviços Prestados',
    'Entrega dos ficheiros estáticos compilados (/opt/app_nr/dist) e exposição dos endpoints REST (/api/*) protegidos por tokens de sessão assinados com HMAC-SHA256.'
  );
  addBulletPoint(
    'Isolamento de Processo',
    'Executado como serviço systemd dedicado sob o utilizador sem privilégios de root (www-data).'
  );

  addSubHeading('3.2. Configuração do Serviço Systemd (/etc/systemd/system/intranet-nr.service)');
  addCodeBlock([
    '[Unit]',
    'Description=Intranet DDPCD - Registo de Producao NR (DGLAB)',
    'After=network.target',
    '',
    '[Service]',
    'Type=simple',
    'User=www-data',
    'Group=www-data',
    'WorkingDirectory=/opt/app_nr',
    'Environment=NODE_ENV=production',
    'Environment=SECRET_KEY=d3pcd_nr_secret_key_prod_2026_dglab_secure_token',
    'ExecStart=/usr/bin/npx tsx server.ts',
    'Restart=always',
    'RestartSec=5',
    '# Endurecimento de seguranca Systemd (ISO 27001 A.8.9 / NIS2):',
    'NoNewPrivileges=true',
    'PrivateTmp=true',
    '',
    '[Install]',
    'WantedBy=multi-user.target',
  ]);

  addSubHeading('3.3. Comandos de Ativação e Monitorização do Web Server');
  addCodeBlock([
    'sudo systemctl daemon-reload',
    'sudo systemctl enable intranet-nr',
    'sudo systemctl start intranet-nr',
    'sudo systemctl status intranet-nr',
  ]);

  // ==========================================================================
  // PÁGINA 6 — SECÇÃO 4: CONJUNTO DE FICHEIROS DA APLICAÇÃO
  // ==========================================================================
  startNewContentPage();

  addMainSectionHeading('4', 'CONJUNTO DE FICHEIROS DA APLICAÇÃO');
  addBodyText(
    'Abaixo descreve-se o inventário completo de ficheiros que compõem a aplicação em /opt/app_nr (Controlo ISO/IEC 27001 A.5.9 Inventário de Informação e Outros Ativos Associados):'
  );

  // Tabela estruturada de ficheiros perfeitamente alinhada dentro das margens (164mm)
  const fileInventory: [string, string][] = [
    ['/opt/app_nr/base_dados_nr.db', 'Base de dados SQLite 3 (utilizadores e registos_producao)'],
    ['/opt/app_nr/server.ts', 'Servidor Web Express, API REST, Auth HMAC e motor SQLite'],
    ['/opt/app_nr/package.json', 'Manifesto de dependências NPM e scripts de compilação'],
    ['/opt/app_nr/.npmrc', 'Configuração de resolução de pacotes (legacy-peer-deps=true)'],
    ['/opt/app_nr/vite.config.ts', 'Configuração do bundler Vite e Tailwind CSS'],
    ['/opt/app_nr/index.html', 'Ponto de entrada HTML da aplicação Intranet DDPCD'],
    ['/opt/app_nr/dist/', 'Diretório de ficheiros estáticos compilados para produção'],
    ['/opt/app_nr/src/main.tsx', 'Inicialização da árvore de componentes React'],
    ['/opt/app_nr/src/App.tsx', 'Controlo de sessão, rotas protegidas e notificações'],
    ['/opt/app_nr/src/services/dbService.ts', 'Cliente HTTP seguro (Bearer Token) para os endpoints /api/*'],
    ['/opt/app_nr/src/utils/nrHelpers.ts', 'Regras de negócio, filtros mensais e cálculos estatísticos'],
    ['/opt/app_nr/src/utils/excelService.ts', 'Importação e exportação de folhas de cálculo Excel (.xlsx)'],
    ['/opt/app_nr/src/utils/pdfManualService.ts', 'Gerador deste documento técnico ISO 27001 / NIS2 em PDF'],
    ['/opt/app_nr/src/components/Navbar.tsx', 'Barra de navegação, alteração de password e alternância de tema'],
    ['/opt/app_nr/src/components/LoginView.tsx', 'Ecrã de autenticação de produção da Intranet DDPCD'],
    ['/opt/app_nr/src/components/RegistoView.tsx', 'Formulário de registo de produção e validação de duplicados'],
    ['/opt/app_nr/src/components/MeusRelatoriosView.tsx', 'Relatórios individuais do operador e importação Excel em lote'],
    ['/opt/app_nr/src/components/AdminRelatoriosView.tsx', 'Relatórios gerais de administração e exportação para Excel'],
    ['/opt/app_nr/src/components/EditarRegistoView.tsx', 'Formulário de edição administrativa de registos de captura'],
    ['/opt/app_nr/src/components/AdminUtilizadoresView.tsx', 'Gestão de utilizadores, palavras-passe e perfis (RBAC)'],
    ['/opt/app_nr/src/components/EsquemaBdView.tsx', 'Painel de cópia de segurança e restauro do ficheiro SQLite'],
  ];

  // Cabeçalho da Tabela de Ficheiros
  const col1Width = 68;
  const col2Width = maxWidth - col1Width;

  doc.setFillColor(235, 238, 242);
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.25);
  doc.rect(marginX, y - 3.5, maxWidth, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(20, 30, 45);
  doc.text('Caminho do Ficheiro / Diretório', marginX + 2, y + 0.8);
  doc.text('Função na Aplicação', marginX + col1Width + 2, y + 0.8);
  y += 3;

  for (let i = 0; i < fileInventory.length; i++) {
    const [filePath, fileDesc] = fileInventory[i];
    const rowH = 5.8;
    checkSpace(rowH + 2);

    if (i % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(marginX, y, maxWidth, rowH, 'F');
    }
    doc.setDrawColor(215, 220, 228);
    doc.rect(marginX, y, maxWidth, rowH, 'S');
    doc.line(marginX + col1Width, y, marginX + col1Width, y + rowH);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(30, 41, 59);
    doc.text(filePath, marginX + 1.8, y + 3.9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(55, 65, 81);
    doc.text(fileDesc, marginX + col1Width + 2, y + 3.9);

    y += rowH;
  }

  y += 6;
  addSubHeading('4.1. Matriz de Permissões de Ficheiros no Sistema (Least Privilege)');
  addBulletPoint(
    'Diretório /opt/app_nr',
    'Proprietário: www-data:www-data | Permissões: 750 (rwxr-x---)'
  );
  addBulletPoint(
    'Base de Dados /opt/app_nr/base_dados_nr.db',
    'Proprietário: www-data:www-data | Permissões: 640 (rw-r-----) - Impede leitura por outros utilizadores locais.'
  );

  // ==========================================================================
  // PÁGINA 7 — SECÇÃO 5: CONFIGURAÇÕES A APLICAR (ISO 27001 / NIS2)
  // ==========================================================================
  startNewContentPage();

  addMainSectionHeading('5', 'CONFIGURAÇÕES A APLICAR (ISO 27001 / NIS2)');
  addBodyText(
    'Para cumprir os requisitos de segurança da norma ISO/IEC 27001:2022 e do Artigo 21.º da Diretiva NIS2 (Medidas de Gestão dos Riscos de Cibersegurança), devem ser aplicadas as seguintes configurações obrigatórias na máquina de produção:'
  );

  addSubHeading('5.1. Endurecimento de Permissões e Segredos Criptográficos');
  addBulletPoint(
    'Alteração Imediata da Password Inicial',
    'Após o primeiro login com "admin" / "admin123", alterar imediatamente a palavra-passe no menu "Alterar Palavra-passe" para uma credencial forte (mínimo 12 caracteres).'
  );
  addBulletPoint(
    'Chave de Assinatura de Sessão (SECRET_KEY)',
    'Gerar uma chave aleatória de 256 bits e defini-la na variável Environment=SECRET_KEY do serviço systemd.'
  );
  addCodeBlock([
    '# Aplicar permissoes restritas aos ficheiros e base de dados (ISO 27001 A.8.3):',
    'sudo chown -R www-data:www-data /opt/app_nr',
    'sudo chmod 750 /opt/app_nr',
    'sudo chmod 640 /opt/app_nr/base_dados_nr.db',
  ]);

  addSubHeading('5.2. Restrição de Rede / Firewall Interna (ISO 27001 A.8.20)');
  addBodyText(
    'Garantir através da firewall UFW que a porta 3000 apenas aceita ligações provenientes da rede interna da DGLAB:'
  );
  addCodeBlock([
    'sudo ufw default deny incoming',
    'sudo ufw allow ssh',
    'sudo ufw allow from 10.0.0.0/8 to any port 3000 proto tcp',
    'sudo ufw allow from 192.168.0.0/16 to any port 3000 proto tcp',
    'sudo ufw enable',
  ]);

  addSubHeading('5.3. Política de Cópias de Segurança e Continuidade (ISO 27001 A.8.13 / NIS2)');
  addBodyText(
    'Configurar uma tarefa automática (cron) para realizar backup diário consistente da base de dados SQLite e retenção de 30 dias:'
  );
  addCodeBlock([
    'sudo mkdir -p /var/backups/app_nr && sudo chmod 700 /var/backups/app_nr',
    '# Adicionar ao crontab do root (sudo crontab -e):',
    '0 20 * * * sqlite3 /opt/app_nr/base_dados_nr.db ".backup \'/var/backups/app_nr/base_dados_nr_$(date +\\%F).db\'" && find /var/backups/app_nr/ -mtime +30 -delete',
  ]);

  addSubHeading('5.4. Resumo de Conformidade Normativa (ISO/IEC 27001:2022 & NIS2)');
  addBulletPoint(
    'A.5.15 & A.8.2 (Controlo de Acessos)',
    'Autenticação obrigatória com separação estrita entre perfil "operador" e "admin" validada no servidor.'
  );
  addBulletPoint(
    'A.8.13 (Cópias de Segurança)',
    'Backup diário automático via SQLite .backup + descarga/restauro manual na interface de administração.'
  );
  addBulletPoint(
    'A.8.15 (Registo de Eventos / Logging)',
    'Registo centralizado de eventos e acessos via systemd journald (sudo journalctl -u intranet-nr).'
  );
  addBulletPoint(
    'A.8.24 (Uso de Criptografia)',
    'Passwords protegidas com PBKDF2-HMAC-SHA256 (600.000 iterações) e sessões assinadas com HMAC-SHA256.'
  );

  // ==========================================================================
  // APLICAR RODAPÉS EM TODAS AS PÁGINAS (PÁG. 2 A N)
  // ==========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, pageWidth, pageHeight, p, totalPages, p === 2);
  }

  doc.save('DGLAB_ISO27001_NIS2_Especificacao_Tecnica_Intranet_DDPCD.pdf');
}
