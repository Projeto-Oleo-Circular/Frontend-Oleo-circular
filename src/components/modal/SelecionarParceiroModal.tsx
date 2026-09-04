// components/modal/SelecionarParceiroModal.tsx
import { useState, useEffect } from "react";
import { X, Search, User, MapPin } from "lucide-react";
import Button from "../ui/Button";
import { adminParceiroService, type Parceiro } from "../../services/adminParceiroService";

interface SelecionarParceiroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelecionar: (parceiro: Parceiro) => void;
  loading?: boolean;
}

export function SelecionarParceiroModal({
  isOpen,
  onClose,
  onSelecionar,
  loading,
}: SelecionarParceiroModalProps) {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      carregarParceiros();
    }
  }, [isOpen]);

  const carregarParceiros = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await adminParceiroService.listarParceiros({
        limit: 100,
        statusAprovacao: "APROVADO", // Mostrar apenas parceiros aprovados
      });
      
      const itens = Array.isArray(resposta) ? resposta : resposta.items || [];
      setParceiros(itens);
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error);
      setErro("Não foi possível carregar a lista de parceiros.");
    } finally {
      setCarregando(false);
    }
  };

  const parceirosFiltrados = parceiros.filter((parceiro) => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return true;
    
    const nome = parceiro.nome?.toLowerCase() || "";
    const razao = parceiro.razaoSocial?.toLowerCase() || "";
    const email = parceiro.email?.toLowerCase() || "";
    const documento = parceiro.documento || "";
    
    return nome.includes(termo) || razao.includes(termo) || email.includes(termo) || documento.includes(termo);
  });

  function obterNomeExibicao(parceiro: Parceiro): string {
    if (parceiro.tipoParceiro === "SOLIDARIO") {
      return parceiro.nome || "—";
    }
    return parceiro.razaoSocial || parceiro.nome || "—";
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
          <div>
            <h2 className="font-bold text-xl text-green-primary">Selecionar Parceiro</h2>
            <p className="text-xs text-white-500">Escolha o parceiro responsável pelo ponto de coleta</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-primary hover:text-red-hover cursor-pointer"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Buscar por nome, razão social, e-mail ou documento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-white-200 rounded-lg text-black-primary focus:outline-none focus:border-green-primary"
          />
          <Search className="w-4 h-4 text-white-400 absolute left-3 top-2.5" />
        </div>

        {/* Lista de Parceiros */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px]">
          {carregando ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white-500">Carregando parceiros...</p>
            </div>
          ) : erro ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-primary text-sm">{erro}</p>
            </div>
          ) : parceirosFiltrados.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white-500 text-sm">
                {busca ? "Nenhum parceiro encontrado com este filtro." : "Nenhum parceiro aprovado disponível."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {parceirosFiltrados.map((parceiro) => (
                <button
                  key={parceiro.id}
                  onClick={() => onSelecionar(parceiro)}
                  className="w-full text-left p-3 rounded-lg border border-white-100 hover:border-green-primary hover:bg-green-50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-black-primary truncate">
                        {obterNomeExibicao(parceiro)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-white-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {parceiro.tipoParceiro} ({parceiro.tipoPessoa})
                        </span>
                        {/* <span className="text-xs text-white-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {parceiro.cidade || "Cidade não informada"}
                        </span> */}
                      </div>
                      <p className="text-xs text-white-400 mt-1 truncate">
                        {parceiro.email} • {parceiro.documento || "—"}
                      </p>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <span className="text-xs font-medium text-green-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Selecionar →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white-100 mt-4">
          <Button variant="danger" size="sm" onClick={onClose} disabled={loading} fullWidth>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}