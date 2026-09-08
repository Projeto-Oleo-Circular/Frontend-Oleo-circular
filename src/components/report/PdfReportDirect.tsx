import jsPDF from "jspdf";

// ============================================================
// TIPOS
// ============================================================

export interface RelatorioData {
  volumeSemana: number;
  volumeSemanaPct: number;
  volumeMes: number;
  volumeMesPct: number;
  volumeAno: number;
  volumeAnoPct: number;
  parceirosAtivos: number;
  pontosColeta: number;
  contagemStatus: {
    AGUARDANDO: number;
    AGENDADA: number;
    EM_ROTA: number;
    CONCLUIDA: number;
  };
  previsao: {
    total: number;
    detalhes: { status: string; volume: number; count: number }[];
  };
  historicoMensal: { mes: string; volume: number }[];
  topParceiros: { nome: string; volume: number }[];
}

type RGB = [number, number, number];

// ============================================================
// PALETA
// ============================================================

const PALETTE = {
  primary: [26, 110, 60] as RGB,
  primaryDark: [16, 82, 44] as RGB,
  primaryLight: [60, 160, 100] as RGB,
  primaryBg: [236, 253, 245] as RGB,
  primaryBorder: [167, 243, 208] as RGB,

  blue: [28, 96, 175] as RGB,
  blueBg: [239, 246, 255] as RGB,
  blueBorder: [191, 219, 254] as RGB,

  orange: [217, 128, 34] as RGB,
  orangeBg: [255, 247, 237] as RGB,
  orangeBorder: [254, 215, 170] as RGB,

  violet: [109, 40, 217] as RGB,
  violetBg: [245, 243, 255] as RGB,
  violetBorder: [221, 214, 254] as RGB,

  teal: [13, 148, 129] as RGB,
  tealBg: [240, 253, 250] as RGB,
  tealBorder: [204, 251, 241] as RGB,

  red: [220, 38, 38] as RGB,
  redBg: [254, 242, 242] as RGB,

  statusOrange: [234, 106, 15] as RGB,
  statusOrangeBg: [255, 247, 237] as RGB,

  statusBlue: [37, 99, 235] as RGB,
  statusBlueBg: [239, 246, 255] as RGB,

  statusGreen: [22, 163, 74] as RGB,
  statusGreenBg: [240, 253, 244] as RGB,

  ink: [24, 24, 27] as RGB,
  textMuted: [107, 107, 114] as RGB,
  textFaint: [156, 156, 163] as RGB,
  border: [231, 231, 235] as RGB,
  shadow: [15, 23, 42] as RGB,
  white: [255, 255, 255] as RGB,
  bgSoft: [249, 250, 251] as RGB,
};

// ============================================================
// LOGO — carregada de public/assets/logo-horizontal.svg
// ============================================================
// Arquivos dentro de "public/" são servidos a partir da raiz do
// site (Vite, CRA, Next.js etc.), então o caminho de fetch é
// "/assets/logo-horizontal.svg". Ajuste aqui se o seu projeto
// servir os assets estáticos de outra forma.
const LOGO_PATH = "/assets/logo-horizontal.svg";

// ============================================================
// FORMATAÇÃO / UTILITÁRIOS DE COR
// ============================================================

function formatLitros(v: number): string {
  return `${v.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} L`;
}

function formatNumero(v: number): string {
  return v.toLocaleString("pt-BR");
}

function lighten(color: RGB, amount: number): RGB {
  return [
    Math.round(color[0] + (255 - color[0]) * amount),
    Math.round(color[1] + (255 - color[1]) * amount),
    Math.round(color[2] + (255 - color[2]) * amount),
  ];
}

function darken(color: RGB, amount: number): RGB {
  return [
    Math.round(color[0] * (1 - amount)),
    Math.round(color[1] * (1 - amount)),
    Math.round(color[2] * (1 - amount)),
  ];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// ============================================================
// GERADOR DE RELATÓRIO PDF
// ============================================================

export async function gerarRelatorioPdf(
  data: RelatorioData,
  nomeArquivo?: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  pdf.setLineHeightFactor(1.5);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const footerReserve = 16;

  let y = margin;

  // ============================================================
  // LOGO: SVG -> PNG (jsPDF puro não renderiza SVG via addImage,
  // então rasterizamos em um <canvas> antes de inserir no PDF)
  // ============================================================

  // Lê viewBox/width/height do SVG para saber a proporção real,
  // em vez de assumir uma proporção fixa (o que distorcia/estourava
  // a caixa do cabeçalho quando a logo real tinha outra proporção).
  function obterAspectRatioSvg(svgText: string): number | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const svgEl = doc.documentElement;

      const viewBox = svgEl.getAttribute("viewBox");
      if (viewBox) {
        const partes = viewBox.trim().split(/[\s,]+/).map(Number);
        if (partes.length === 4 && partes[2] > 0 && partes[3] > 0) {
          return partes[3] / partes[2]; // altura / largura
        }
      }

      const wAttr = parseFloat(svgEl.getAttribute("width") || "");
      const hAttr = parseFloat(svgEl.getAttribute("height") || "");
      if (wAttr > 0 && hAttr > 0) {
        return hAttr / wAttr;
      }
    } catch {
      // ignora e cai no fallback
    }
    return null;
  }

  // Busca o SVG, converte para PNG via canvas e encaixa (contain)
  // dentro de uma caixa de no máximo larguraMaxMm x alturaMaxMm,
  // preservando a proporção real do arquivo.
  async function carregarLogoComoPng(
    caminho: string,
    larguraMaxMm: number,
    alturaMaxMm: number
  ): Promise<{ dataUrl: string; larguraMm: number; alturaMm: number } | null> {
    try {
      const response = await fetch(caminho);
      if (!response.ok) {
        throw new Error(`Erro ao carregar SVG: ${response.status}`);
      }
      const svgText = await response.text();
      const aspectRatio = obterAspectRatioSvg(svgText) ?? 0.25; // fallback 4:1

      let larguraMm = larguraMaxMm;
      let alturaMm = larguraMm * aspectRatio;
      if (alturaMm > alturaMaxMm) {
        alturaMm = alturaMaxMm;
        larguraMm = alturaMm / aspectRatio;
      }

      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(svgBlob);

      // Renderiza em resolução maior que o tamanho final (mm -> px a ~96dpi, x escala extra) para ficar nítido na impressão
      const pxPorMm = 3.78; // ~96dpi
      const escalaExtra = 3;
      const canvasW = Math.max(1, Math.round(larguraMm * pxPorMm * escalaExtra));
      const canvasH = Math.max(1, Math.round(alturaMm * pxPorMm * escalaExtra));

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Contexto 2D do canvas indisponível"));
            return;
          }
          ctx.clearRect(0, 0, canvasW, canvasH);
          ctx.drawImage(img, 0, 0, canvasW, canvasH);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject(new Error("Falha ao renderizar o SVG no canvas"));
        img.src = blobUrl;
      });

      URL.revokeObjectURL(blobUrl);
      return { dataUrl, larguraMm, alturaMm };
    } catch (error) {
      console.error("Erro ao carregar logo:", error);
      return null;
    }
  }

  // ============================================================
  // FUNÇÃO PARA ADICIONAR LOGO (a partir de public/assets/logo-horizontal.svg)
  // Encaixa dentro de uma caixa fixa (larguraMaxMm x alturaMaxMm) e
  // centraliza verticalmente, para nunca invadir o texto ao lado.
  // ============================================================

  async function adicionarLogo(
    x: number,
    yPos: number,
    larguraMaxMm: number,
    alturaMaxMm: number
  ): Promise<void> {
    const resultado = await carregarLogoComoPng(LOGO_PATH, larguraMaxMm, alturaMaxMm);

    if (resultado) {
      try {
        const yCentralizado = yPos + (alturaMaxMm - resultado.alturaMm) / 2;
        pdf.addImage(resultado.dataUrl, "PNG", x, yCentralizado, resultado.larguraMm, resultado.alturaMm);
        return;
      } catch (error) {
        console.error("Erro ao inserir logo no PDF:", error);
      }
    }

    // Fallback: texto simples, caso a logo não possa ser carregada
    pdf.setFontSize(12);
    pdf.setTextColor(PALETTE.white[0], PALETTE.white[1], PALETTE.white[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text("ÓLEO CIRCULAR", x, yPos + alturaMaxMm / 2 + 3);
  }

  // ============================================================
  // PRIMITIVAS
  // ============================================================

  function withOpacity(opacity: number, draw: () => void) {
    pdf.saveGraphicsState();
    pdf.setGState(new (pdf as any).GState({ opacity }));
    draw();
    pdf.restoreGraphicsState();
  }

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - footerReserve) {
      pdf.addPage();
      y = margin;
    }
  }

  function text(
    txt: string,
    x: number,
    yPos: number,
    opts: {
      size?: number;
      color?: RGB;
      align?: "left" | "center" | "right";
      bold?: boolean;
    } = {}
  ) {
    const { size = 10, color = PALETTE.ink, align = "left", bold = false } = opts;
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.text(txt, x, yPos, { align });
  }

  function rect(x: number, yPos: number, w: number, h: number, color: RGB) {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(x, yPos, w, h, "F");
  }

  function roundedRect(
    x: number,
    yPos: number,
    w: number,
    h: number,
    r: number,
    fillColor?: RGB,
    borderColor?: RGB
  ) {
    if (fillColor) pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    if (borderColor) {
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      pdf.setLineWidth(0.3);
    }
    const style = fillColor && borderColor ? "FD" : fillColor ? "F" : "S";
    pdf.roundedRect(x, yPos, w, h, r, r, style as any);
  }

  function shadow(x: number, yPos: number, w: number, h: number, r: number) {
    withOpacity(0.08, () => {
      pdf.setFillColor(PALETTE.shadow[0], PALETTE.shadow[1], PALETTE.shadow[2]);
      pdf.roundedRect(x - 0.1, yPos + 0.9, w + 0.2, h, r, r, "F");
    });
  }

  function panel(
    x: number,
    yPos: number,
    w: number,
    h: number,
    r = 3,
    fillColor: RGB = PALETTE.white,
    borderColor: RGB = PALETTE.border
  ) {
    shadow(x, yPos, w, h, r);
    roundedRect(x, yPos, w, h, r, fillColor, borderColor);
  }

  function progressBar(x: number, yPos: number, w: number, h: number, pct: number, color: RGB) {
    roundedRect(x, yPos, w, h, h / 2, lighten(color, 0.85));
    const filledW = Math.max(h, (w * Math.min(pct, 100)) / 100);
    roundedRect(x, yPos, filledW, h, h / 2, color);
  }

  function pill(x: number, yPos: number, txt_: string, color: RGB, bg: RGB, align: "left" | "right" = "left") {
    pdf.setFontSize(6.6);
    pdf.setFont("helvetica", "bold");
    const w = pdf.getTextWidth(txt_) + 5;
    const px = align === "left" ? x : x - w;
    roundedRect(px, yPos, w, 4.6, 2.3, bg);
    text(txt_, px + w / 2, yPos + 3.3, { size: 6.6, color, align: "center", bold: true });
    return w;
  }

  // ============================================================
  // ÍCONES VETORIAIS
  // ============================================================

  function iconDroplet(cx: number, cy: number, s: number, color: RGB) {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.triangle(cx, cy - s * 0.75, cx - s * 0.5, cy + s * 0.15, cx + s * 0.5, cy + s * 0.15, "F");
    pdf.circle(cx, cy + s * 0.15, s * 0.5, "F");
  }

  function iconCalendar(cx: number, cy: number, s: number, color: RGB) {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(0.55);
    pdf.roundedRect(cx - s * 0.55, cy - s * 0.45, s * 1.1, s * 0.95, 0.5, 0.5, "S");
    pdf.line(cx - s * 0.55, cy - s * 0.12, cx + s * 0.55, cy - s * 0.12);
    pdf.line(cx - s * 0.25, cy - s * 0.58, cx - s * 0.25, cy - s * 0.32);
    pdf.line(cx + s * 0.25, cy - s * 0.58, cx + s * 0.25, cy - s * 0.32);
  }

  function iconUsers(cx: number, cy: number, s: number, color: RGB) {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.circle(cx - s * 0.32, cy - s * 0.18, s * 0.3, "F");
    pdf.circle(cx + s * 0.32, cy - s * 0.18, s * 0.3, "F");
    pdf.ellipse(cx - s * 0.32, cy + s * 0.38, s * 0.4, s * 0.26, "F");
    pdf.ellipse(cx + s * 0.32, cy + s * 0.38, s * 0.4, s * 0.26, "F");
  }

  function iconPin(cx: number, cy: number, s: number, color: RGB) {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.circle(cx, cy - s * 0.15, s * 0.48, "F");
    pdf.triangle(cx - s * 0.32, cy + s * 0.08, cx + s * 0.32, cy + s * 0.08, cx, cy + s * 0.6, "F");
    pdf.setFillColor(255, 255, 255);
    pdf.circle(cx, cy - s * 0.15, s * 0.17, "F");
  }

  function iconClock(cx: number, cy: number, s: number, color: RGB) {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(0.55);
    pdf.circle(cx, cy, s * 0.52, "S");
    pdf.line(cx, cy, cx, cy - s * 0.3);
    pdf.line(cx, cy, cx + s * 0.26, cy + s * 0.06);
  }

  function iconTruck(cx: number, cy: number, s: number, color: RGB) {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.roundedRect(cx - s * 0.55, cy - s * 0.22, s * 0.72, s * 0.46, 0.35, 0.35, "F");
    pdf.roundedRect(cx + s * 0.18, cy - s * 0.02, s * 0.35, s * 0.26, 0.3, 0.3, "F");
    pdf.circle(cx - s * 0.28, cy + s * 0.32, s * 0.13, "F");
    pdf.circle(cx + s * 0.26, cy + s * 0.32, s * 0.13, "F");
  }

  function iconCheck(cx: number, cy: number, s: number, color: RGB) {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(0.75);
    pdf.line(cx - s * 0.3, cy, cx - s * 0.05, cy + s * 0.26);
    pdf.line(cx - s * 0.05, cy + s * 0.26, cx + s * 0.35, cy - s * 0.28);
  }

  function iconTrend(cx: number, cy: number, s: number, color: RGB) {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.triangle(cx, cy - s * 0.55, cx - s * 0.4, cy + s * 0.1, cx + s * 0.4, cy + s * 0.1, "F");
    pdf.rect(cx - s * 0.1, cy + s * 0.1, s * 0.2, s * 0.4, "F");
  }

  function iconMoney(cx: number, cy: number, s: number, color: RGB) {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(0.55);
    pdf.circle(cx, cy, s * 0.5, "S");
    pdf.setFontSize(s * 1.3);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text("R$", cx, cy + s * 0.32, { align: "center" });
  }

  function iconRank(cx: number, cy: number, s: number, color: RGB) {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.roundedRect(cx - s * 0.55, cy + s * 0.05, s * 0.32, s * 0.5, 0.3, 0.3, "F");
    pdf.roundedRect(cx - s * 0.16, cy - s * 0.2, s * 0.32, s * 0.75, 0.3, 0.3, "F");
    pdf.roundedRect(cx + s * 0.23, cy - s * 0.5, s * 0.32, s * 1.05, 0.3, 0.3, "F");
  }

  function iconBadge(
    x: number,
    yPos: number,
    size: number,
    bg: RGB,
    draw: (cx: number, cy: number, s: number, color: RGB) => void,
    iconColor: RGB = PALETTE.white
  ) {
    roundedRect(x, yPos, size, size, size * 0.28, bg);
    draw(x + size / 2, yPos + size / 2, size * 0.42, iconColor);
  }

  // ============================================================
  // CARTÃO DE MÉTRICA (ícone com mais respiro em relação ao texto)
  // ============================================================

  function metricCard(opts: {
    x: number;
    w: number;
    h: number;
    label: string;
    value: string;
    valueSize?: number;
    sub?: string;
    pctLabel?: string;
    pctPositive?: boolean;
    accent: RGB;
    accentBg: RGB;
    icon: (cx: number, cy: number, s: number, color: RGB) => void;
  }) {
    const { x, w, h, label, value, valueSize = 14.5, sub, pctLabel, pctPositive, accent, accentBg, icon } = opts;

    panel(x, y, w, h, 3.2, PALETTE.white, PALETTE.border);
    roundedRect(x, y, 2, h, 1, accent);

    const padX = 8;
    const iconSize = 8;
    const iconTop = y + 6;
    const iconBottom = iconTop + iconSize;
    const iconX = x + padX;
    const iconTextGap = 6; // distância entre o ícone e o texto do label

    iconBadge(iconX, iconTop, iconSize, accentBg, icon, accent);

    text(label.toUpperCase(), iconX + iconSize + iconTextGap, iconTop + iconSize / 2 + 1.6, {
      size: 6.5,
      color: PALETTE.textMuted,
      bold: true,
    });

    // Folga fixa (não proporcional à altura do card) entre a base do
    // ícone e o valor, para nunca colidir mesmo com fontes grandes.
    const valueBaselineY = iconBottom + 9;
    text(value, x + padX, valueBaselineY, { size: valueSize, color: PALETTE.ink, bold: true });

    const bottomRowY = valueBaselineY + 5.5;

    if (pctLabel) {
      const pillColor: RGB = pctPositive ? PALETTE.statusGreen : PALETTE.red;
      const pillBg: RGB = pctPositive ? PALETTE.statusGreenBg : PALETTE.redBg;
      const sinal = pctPositive ? "+" : "";
      const pw = pill(x + padX, bottomRowY - 3.3, `${sinal}${pctLabel}`, pillColor, pillBg, "left");
      if (sub) {
        text(sub, x + padX + pw + 3, bottomRowY, { size: 6.4, color: PALETTE.textMuted });
      }
    } else if (sub) {
      text(sub, x + padX, bottomRowY, { size: 6.6, color: PALETTE.textMuted });
    }
  }

  // ============================================================
  // TÍTULO DE SEÇÃO
  // ============================================================

  function sectionTitle(titulo: string, icon: (cx: number, cy: number, s: number, color: RGB) => void) {
    checkPageBreak(16);
    iconBadge(margin, y, 7, PALETTE.primaryBg, icon, PALETTE.primary);
    text(titulo, margin + 12.5, y + 5.1, { size: 11, color: PALETTE.ink, bold: true });
    pdf.setDrawColor(PALETTE.border[0], PALETTE.border[1], PALETTE.border[2]);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 9.5, pageWidth - margin, y + 9.5);
    y += 15;
  }

  // ============================================================
  // DATA ATUAL
  // ============================================================

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ============================================================
  // CABEÇALHO COM LOGO
  // ============================================================

  const headerH = 32;
  const gradSteps = 24;
  for (let i = 0; i < gradSteps; i++) {
    const t = i / (gradSteps - 1);
    rect(0, (headerH / gradSteps) * i, pageWidth, headerH / gradSteps + 0.4, mix(PALETTE.primaryDark, PALETTE.primary, t));
  }

  withOpacity(0.08, () => {
    pdf.setFillColor(255, 255, 255);
    pdf.circle(pageWidth - 22, 6, 26, "F");
    pdf.circle(pageWidth - 55, headerH + 4, 14, "F");
  });

  // Adicionar a logo (carregada de public/assets/logo-horizontal.svg).
  // Caixa fixa: a logo é encaixada (contain) dentro dela, então o
  // texto ao lado sempre começa no mesmo lugar, sem risco de sobrepor.
  const logoBoxWidth = 42;
  const logoBoxHeight = 18;
  const logoY = 6;
  await adicionarLogo(margin, logoY, logoBoxWidth, logoBoxHeight);

  // Título ao lado da logo
  const textoX = margin + logoBoxWidth + 8;
  text("RELATÓRIO ADMINISTRATIVO", textoX, 12.5, {
    size: 14.5,
    color: PALETTE.white,
    bold: true,
  });
  text("Óleo Circular  ·  Sistema de Coleta", textoX, 19, {
    size: 8.5,
    color: lighten(PALETTE.primary, 0.82),
  });

  // Data no canto direito
  const dataLabel = `Gerado em ${hoje}`;
  pdf.setFontSize(7.6);
  pdf.setFont("helvetica", "bold");
  const dataLabelWidth = pdf.getTextWidth(dataLabel) + 9;
  withOpacity(0.16, () => {
    roundedRect(pageWidth - margin - dataLabelWidth, 9, dataLabelWidth, 10, 5, PALETTE.white);
  });
  text(dataLabel, pageWidth - margin - dataLabelWidth / 2, 15.3, {
    size: 7.6,
    color: PALETTE.white,
    align: "center",
    bold: true,
  });

  y = headerH + 10;

  // ============================================================
  // SEÇÃO 1 · MÉTRICAS DE COLETA
  // ============================================================

  sectionTitle("MÉTRICAS DE COLETA", iconDroplet);

  const gap = 4;
  const cardH1 = 37;
  const wThirds = (contentWidth - gap * 2) / 3;

  metricCard({
    x: margin,
    w: wThirds,
    h: cardH1,
    label: "Última semana",
    value: formatLitros(data.volumeSemana),
    pctLabel: `${Math.abs(data.volumeSemanaPct)}%`,
    pctPositive: data.volumeSemanaPct >= 0,
    sub: "vs. semana anterior",
    accent: PALETTE.primary,
    accentBg: PALETTE.primaryBg,
    icon: iconDroplet,
  });

  metricCard({
    x: margin + wThirds + gap,
    w: wThirds,
    h: cardH1,
    label: "Último mês",
    value: formatLitros(data.volumeMes),
    pctLabel: `${Math.abs(data.volumeMesPct)}%`,
    pctPositive: data.volumeMesPct >= 0,
    sub: "vs. mês anterior",
    accent: PALETTE.blue,
    accentBg: PALETTE.blueBg,
    icon: iconCalendar,
  });

  metricCard({
    x: margin + (wThirds + gap) * 2,
    w: wThirds,
    h: cardH1,
    label: "Último ano",
    value: formatLitros(data.volumeAno),
    pctLabel: `${Math.abs(data.volumeAnoPct)}%`,
    pctPositive: data.volumeAnoPct >= 0,
    sub: "vs. ano anterior",
    accent: PALETTE.orange,
    accentBg: PALETTE.orangeBg,
    icon: iconTrend,
  });

  y += cardH1 + 10;

  // ============================================================
  // SEÇÃO 2 · PARCEIROS E PONTOS
  // ============================================================

  const cardH2 = 37;
  const wHalves = (contentWidth - gap) / 2;

  metricCard({
    x: margin,
    w: wHalves,
    h: cardH2,
    label: "Parceiros ativos",
    value: formatNumero(data.parceirosAtivos),
    valueSize: 18,
    sub: "Parceiros aprovados",
    accent: PALETTE.violet,
    accentBg: PALETTE.violetBg,
    icon: iconUsers,
  });

  metricCard({
    x: margin + wHalves + gap,
    w: wHalves,
    h: cardH2,
    label: "Pontos de coleta",
    value: formatNumero(data.pontosColeta),
    valueSize: 18,
    sub: "Pontos aprovados",
    accent: PALETTE.teal,
    accentBg: PALETTE.tealBg,
    icon: iconPin,
  });

  y += cardH2 + 12;

  // ============================================================
  // SEÇÃO 3 · SOLICITAÇÕES DE COLETA
  // ============================================================

  sectionTitle("SOLICITAÇÕES DE COLETA", iconCheck);

  const statusItems: {
    label: string;
    value: number;
    color: RGB;
    bg: RGB;
    icon: (cx: number, cy: number, s: number, color: RGB) => void;
  }[] = [
    { label: "Pendentes", value: data.contagemStatus.AGUARDANDO, color: PALETTE.red, bg: PALETTE.redBg, icon: iconClock },
    { label: "Agendadas", value: data.contagemStatus.AGENDADA, color: PALETTE.statusOrange, bg: PALETTE.statusOrangeBg, icon: iconCalendar },
    { label: "Em rota", value: data.contagemStatus.EM_ROTA, color: PALETTE.statusBlue, bg: PALETTE.statusBlueBg, icon: iconTruck },
    { label: "Concluídas", value: data.contagemStatus.CONCLUIDA, color: PALETTE.statusGreen, bg: PALETTE.statusGreenBg, icon: iconCheck },
  ];

  const cardH3 = 28;
  const wQuarters = (contentWidth - gap * 3) / 4;

  statusItems.forEach((item, index) => {
    const x = margin + index * (wQuarters + gap);
    panel(x, y, wQuarters, cardH3, 3, item.bg, lighten(item.color, 0.6));
    // Ícone com mais respiro no topo do card e mais distância até o número
    iconBadge(x + wQuarters / 2 - 4, y + 5.5, 8, PALETTE.white, item.icon, item.color);
    text(String(item.value), x + wQuarters / 2, y + 21.5, { size: 15, color: item.color, align: "center", bold: true });
    text(item.label, x + wQuarters / 2, y + 26, { size: 6.8, color: PALETTE.textMuted, align: "center" });
  });

  y += cardH3 + 11;

  // ============================================================
  // SEÇÃO 4 · PREVISÃO DE COLETA
  // ============================================================

  checkPageBreak(55);
  sectionTitle("PREVISÃO DE COLETA", iconMoney);

  panel(margin, y, contentWidth, 20, 3.2, PALETTE.orangeBg, PALETTE.orangeBorder);
  iconBadge(margin + 6, y + 5, 10, PALETTE.white, iconMoney, PALETTE.orange);
  text("Volume estimado a coletar", margin + 22, y + 8, { size: 7, color: PALETTE.textMuted });
  text(formatLitros(data.previsao.total), margin + 22, y + 15.5, { size: 13.5, color: PALETTE.orange, bold: true });
  text(
    `${data.previsao.detalhes.reduce((acc, d) => acc + d.count, 0)} solicitações`,
    pageWidth - margin - 6,
    y + 12,
    { size: 7.5, color: PALETTE.textMuted, align: "right" }
  );

  y += 26;

  if (data.previsao.detalhes.length > 0) {
    const wPrev = (contentWidth - gap * (data.previsao.detalhes.length - 1)) / data.previsao.detalhes.length;
    const cardH4 = 23;

    data.previsao.detalhes.forEach((item, index) => {
      const x = margin + index * (wPrev + gap);
      panel(x, y, wPrev, cardH4, 3, PALETTE.white, PALETTE.border);
      text(item.status, x + wPrev / 2, y + 6.5, { size: 6.8, color: PALETTE.textMuted, align: "center", bold: true });
      text(formatLitros(item.volume), x + wPrev / 2, y + 15, { size: 10.5, color: PALETTE.ink, align: "center", bold: true });
      text(`${item.count} solicitações`, x + wPrev / 2, y + 20, { size: 5.8, color: PALETTE.textFaint, align: "center" });
    });

    y += cardH4 + 11;
  }

  // ============================================================
  // SEÇÃO 5 · TOP PARCEIROS
  // ============================================================

  if (data.topParceiros.length > 0) {
    const rows = Math.min(5, data.topParceiros.length);
    const rowH = 13;
    const listPad = 6;
    const listH = listPad * 2 + rows * rowH - 4;

    checkPageBreak(16 + listH);
    sectionTitle("TOP PARCEIROS POR VOLUME", iconRank);

    panel(margin, y, contentWidth, listH, 3.5, PALETTE.white, PALETTE.border);

    const maxVolume = data.topParceiros[0]?.volume || 1;
    const medalColors: RGB[] = [PALETTE.orange, [148, 163, 184], [180, 130, 65]];
    let ry = y + listPad;

    data.topParceiros.slice(0, rows).forEach((parceiro, index) => {
      const pct = Math.max(6, (parceiro.volume / maxVolume) * 100);
      const rankColor = medalColors[index] ?? PALETTE.textFaint;

      pdf.setFillColor(rankColor[0], rankColor[1], rankColor[2]);
      pdf.circle(margin + 9, ry + 2.6, 3.6, "F");
      text(String(index + 1), margin + 9, ry + 4, { size: 6.6, color: PALETTE.white, align: "center", bold: true });

      // Mais distância entre o círculo de rank e o texto/barra
      text(parceiro.nome, margin + 19, ry + 3.6, { size: 8.4, color: PALETTE.ink, bold: true });
      text(formatLitros(parceiro.volume), pageWidth - margin - 6, ry + 3.6, {
        size: 8.4,
        color: PALETTE.primary,
        align: "right",
        bold: true,
      });

      progressBar(margin + 19, ry + 6, contentWidth - 25, 3, pct, PALETTE.primary);

      if (index < rows - 1) {
        pdf.setDrawColor(PALETTE.border[0], PALETTE.border[1], PALETTE.border[2]);
        pdf.setLineWidth(0.2);
        pdf.line(margin + 6, ry + rowH - 3, pageWidth - margin - 6, ry + rowH - 3);
      }

      ry += rowH;
    });

    y += listH + 11;
  }

  // ============================================================
  // SEÇÃO 6 · HISTÓRICO MENSAL
  // ============================================================

  checkPageBreak(70);
  sectionTitle("HISTÓRICO MENSAL", iconCalendar);

  const totalHistorico = data.historicoMensal.reduce((acc, item) => acc + item.volume, 0);
  const mediaHistorico = data.historicoMensal.length > 0 ? totalHistorico / data.historicoMensal.length : 0;
  const meses = data.historicoMensal.slice(-6);
  const chartH = 40;
  const summaryH = 15;
  const containerH = summaryH + chartH + 12;

  panel(margin, y, contentWidth, containerH, 3.5, PALETTE.white, PALETTE.border);

  text("TOTAL DO PERÍODO", margin + 6, y + 6, { size: 6.4, color: PALETTE.textMuted, bold: true });
  text(formatLitros(totalHistorico), margin + 6, y + 12, { size: 10.5, color: PALETTE.ink, bold: true });

  text("MÉDIA MENSAL", pageWidth - margin - 6, y + 6, { size: 6.4, color: PALETTE.textMuted, align: "right", bold: true });
  text(formatLitros(mediaHistorico), pageWidth - margin - 6, y + 12, { size: 10.5, color: PALETTE.ink, align: "right", bold: true });

  pdf.setDrawColor(PALETTE.border[0], PALETTE.border[1], PALETTE.border[2]);
  pdf.setLineWidth(0.25);
  pdf.line(margin + 6, y + summaryH, pageWidth - margin - 6, y + summaryH);

  if (meses.length > 0) {
    const chartTop = y + summaryH + 6;
    const chartBottom = chartTop + chartH - 8;
    const maxHistorico = Math.max(...meses.map((item) => item.volume), 1);

    for (let i = 0; i <= 3; i++) {
      const gy = chartTop + ((chartH - 8) / 3) * i;
      pdf.setDrawColor(240, 240, 242);
      pdf.setLineWidth(0.2);
      pdf.line(margin + 6, gy, pageWidth - margin - 6, gy);
    }

    const innerW = contentWidth - 12;
    const barSlot = innerW / meses.length;
    const barW = Math.min(15, barSlot * 0.48);

    meses.forEach((item, index) => {
      const slotX = margin + 6 + index * barSlot + (barSlot - barW) / 2;
      const barH = Math.max(2, (item.volume / maxHistorico) * (chartH - 14));
      const barY = chartBottom - barH;

      roundedRect(slotX, barY, barW, barH, 1.6, PALETTE.primary);
      withOpacity(0.35, () => {
        roundedRect(slotX, barY, barW, Math.min(3, barH), 1.6, PALETTE.white);
      });

      text(item.mes, margin + 6 + index * barSlot + barSlot / 2, chartBottom + 6, {
        size: 6.4,
        color: PALETTE.textMuted,
        align: "center",
      });
      text(formatLitros(item.volume), margin + 6 + index * barSlot + barSlot / 2, barY - 2, {
        size: 5.6,
        color: PALETTE.textFaint,
        align: "center",
      });
    });
  }

  y += containerH + 6;

  // ============================================================
  // RODAPÉ
  // ============================================================

  const totalPaginas = pdf.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i++) {
    pdf.setPage(i);

    pdf.setDrawColor(PALETTE.border[0], PALETTE.border[1], PALETTE.border[2]);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.setFillColor(PALETTE.primary[0], PALETTE.primary[1], PALETTE.primary[2]);
    pdf.circle(margin + 1.2, pageHeight - 7.3, 1.2, "F");
    text("Óleo Circular — Relatório Administrativo", margin + 4.5, pageHeight - 6.3, {
      size: 7,
      color: PALETTE.textFaint,
    });
    text(`Página ${i} de ${totalPaginas}`, pageWidth - margin, pageHeight - 6.3, {
      size: 7,
      color: PALETTE.textFaint,
      align: "right",
    });
  }

  // ============================================================
  // SALVAR PDF
  // ============================================================

  const nomeFinal = nomeArquivo
    ? nomeArquivo.toLowerCase().endsWith(".pdf")
      ? nomeArquivo
      : `${nomeArquivo}.pdf`
    : `relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;

  pdf.save(nomeFinal);
}