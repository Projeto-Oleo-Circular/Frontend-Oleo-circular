interface SparklineProps {
  data: number[]
  color?: string
}

export function Sparkline({ data, color = "#15803d" }: SparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const width = 200
  const height = 40

  // Mapeia os dados para pontos (X, Y) do SVG
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 12) - 6
    return { x, y }
  });

  // Cria uma curva suave de Bézier entre os pontos
  const d = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`
    const prev = arr[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`
  }, "")

  // Fecha o caminho na base para o efeito de gradiente/sombra por baixo
  const areaD = `${d} L ${width},${height} L 0,${height} Z`

  const firstPoint = points[0]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-10 block">
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Preenchimento sob a linha */}
      <path d={areaD} fill="url(#sparkline-gradient)" />

      {/* Linha do gráfico */}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* Ponto (indicador na ponta/início) */}
      <circle cx={firstPoint.x} cy={firstPoint.y} r="3" fill={color} />
    </svg>
  )
}