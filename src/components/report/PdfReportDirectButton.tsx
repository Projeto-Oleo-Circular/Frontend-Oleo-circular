// src/components/report/PdfReportButtonDirect.tsx

import React, { useState } from "react";
import { Download } from "lucide-react";
import { gerarRelatorioPdf, RelatorioData } from "./PdfReportDirect";
import useToast from "../../hooks/useToast";

interface PdfReportButtonDirectProps {
  dados: RelatorioData;
  nomeArquivo?: string;
  className?: string;
  label?: string;
}

const PdfReportButtonDirect: React.FC<PdfReportButtonDirectProps> = ({
  dados,
  nomeArquivo = "relatorio-oleo-circular",
  className = "",
  label = "Baixar Relatório PDF",
}) => {
  const [carregando, setCarregando] = useState(false);
  const { addToast } = useToast();

  const handleGerarPdf = async () => {
    setCarregando(true);

    try {
      await gerarRelatorioPdf(dados, nomeArquivo);
      addToast("Relatório gerado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      addToast("Erro ao gerar relatório. Tente novamente.", "error");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <button
      onClick={handleGerarPdf}
      disabled={carregando}
      className={`
        flex items-center gap-2.5
        px-6 py-3
        bg-white hover:bg-[#1a6e3a]
        text-[#1a6e3a] hover:text-white
        font-medium text-sm
        rounded-lg
        border border-[#1a6e3a]
        transition-all duration-200
        shadow-sm hover:shadow-md
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {carregando ? (
        <div className="w-5 h-5 border-2 border-[#1a6e3a] border-t-transparent rounded-full animate-spin hover:border-white" />
      ) : (
        <Download className="w-5 h-5" strokeWidth={2} />
      )}
      <span>{label}</span>
    </button>
  );
};

export default PdfReportButtonDirect;