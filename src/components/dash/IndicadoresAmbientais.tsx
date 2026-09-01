import { useEffect, useState, useCallback } from "react";
import { 
  Droplet, 
  FlaskConical, 
  Fuel, 
  Cloud, 
  Recycle 
} from "lucide-react";

interface ImpactoData {
  ogrColetado: number;
  ogrLiquido: number;
  biodieselAtribuido: number;
  co2Evitado: number;
  residuoDesviado: number;
}

export function IndicadoresAmbientais() {
  const [dados, setDados] = useState<ImpactoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const fetchImpacto = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const url =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYaa6rUKXrl1F6hAiG7w8j9CTWFdOL9aLHiaf70hfmTtvDxdUZL4M3-ACi4WqndA/pub?gid=415532843&output=csv";

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const csvText = await response.text();
      const lines = csvText.split("\n")
        .map(line => line.trim())
        .filter(line => line !== "");

      if (lines.length === 0) throw new Error("Planilha vazia");

      const separator = lines[0].includes(";") ? ";" : ",";

      const extractNumber = (line: string): number | null => {
        const parts = line.split(separator).map(p => p.trim());
        for (const part of parts) {
          const clean = part.replace(/"/g, "").replace(/\./g, "").replace(",", ".").trim();
          if (clean === "") continue;
          const num = parseFloat(clean);
          if (!isNaN(num) && num > 0) return num;
        }
        return null;
      };

      const findValue = (keyword: string): number => {
        for (const line of lines) {
          if (line.toLowerCase().includes(keyword.toLowerCase())) {
            const num = extractNumber(line);
            if (num !== null) return num;
          }
        }
        return 0;
      };

      const ogrColetado = findValue("OGR coletado");
      const ogrLiquido = findValue("OGR líquido entregue");
      const biodieselAtribuido = findValue("Biodiesel atribuído");
      const co2Evitado = findValue("CO₂ evitado líquido");
      const residuoDesviado = findValue("Resíduo desviado");

      setDados({
        ogrColetado,
        ogrLiquido,
        biodieselAtribuido,
        co2Evitado,
        residuoDesviado,
      });
    } catch (error) {
      console.error(" Erro ao carregar impacto:", error);
      setErro(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImpacto();
  }, [fetchImpacto]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-white-200 p-6 text-center">
        <div className="w-8 h-8 border-4 border-green-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-white-500 text-sm">Carregando impacto gerado...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-50 rounded-xl p-4 text-center text-red-600 text-sm border border-red-200">
        {erro}
        <button
          onClick={fetchImpacto}
          className="ml-2 text-green-primary underline font-medium hover:text-green-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-white-200 p-6 text-center text-white-500">
        Nenhum dado disponível.
      </div>
    );
  }

  // Verifica se pelo menos um valor > 0
  const temDados =
    dados.ogrColetado > 0 ||
    dados.ogrLiquido > 0 ||
    dados.biodieselAtribuido > 0 ||
    dados.co2Evitado > 0 ||
    dados.residuoDesviado > 0;

  if (!temDados) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-white-200 p-6 text-center text-white-500">
        Nenhum dado encontrado na planilha.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-white-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-black-primary">Impacto Gerado</h2>
        <span className="text-xs text-white-400">
          Valores calculados a partir da planilha
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* OGR Coletado */}
        <div className="flex flex-col items-center text-center p-3 bg-white-50 rounded-lg border border-white-100">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <Droplet className="w-6 h-6 text-green-700" />
          </div>
          <p className="text-xl font-bold text-black-primary">
            {dados.ogrColetado.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-white-600 font-medium">OGR coletado (L)</p>
        </div>

        {/* OGR Líquido Entregue */}
        <div className="flex flex-col items-center text-center p-3 bg-white-50 rounded-lg border border-white-100">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <FlaskConical className="w-6 h-6 text-blue-700" />
          </div>
          <p className="text-xl font-bold text-black-primary">
            {dados.ogrLiquido.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-white-600 font-medium">OGR líquido entregue (L)</p>
        </div>

        {/* Biodiesel Atribuído */}
        <div className="flex flex-col items-center text-center p-3 bg-white-50 rounded-lg border border-white-100">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
            <Fuel className="w-6 h-6 text-yellow-700" />
          </div>
          <p className="text-xl font-bold text-black-primary">
            {dados.biodieselAtribuido.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-white-600 font-medium">Biodiesel atribuído (L)</p>
        </div>

        {/* CO₂ Evitado */}
        <div className="flex flex-col items-center text-center p-3 bg-white-50 rounded-lg border border-white-100">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
            <Cloud className="w-6 h-6 text-gray-700" />
          </div>
          <p className="text-xl font-bold text-black-primary">
            {dados.co2Evitado.toFixed(2)}
          </p>
          <p className="text-xs text-white-600 font-medium">CO₂ evitado líquido (t)</p>
        </div>

        {/* Resíduo Desviado */}
        <div className="flex flex-col items-center text-center p-3 bg-white-50 rounded-lg border border-white-100">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
            <Recycle className="w-6 h-6 text-purple-700" />
          </div>
          <p className="text-xl font-bold text-black-primary">
            {dados.residuoDesviado.toFixed(2)}
          </p>
          <p className="text-xs text-white-600 font-medium">Resíduo desviado (t)</p>
        </div>
      </div>

    
    </div>
  );
}