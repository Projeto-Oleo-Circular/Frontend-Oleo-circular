// components/modal/CriarSolicitacaoModal.tsx
import { useState, useEffect } from "react";
import { X, User, MapPin, Search } from "lucide-react";
import Button from "../ui/Button";
import { adminPontosService, type PontoColetaAdmin } from "../../services/adminPontosService";
import { adminParceiroService, type Parceiro } from "../../services/adminParceiroService";

type StepCriar = "selecionar_parceiro" | "selecionar_ponto" | "dados_solicitacao";

interface CriarSolicitacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { pontoColetaId: number; tamanhoBombona: number; observacoes?: string }) => Promise<void>;
  loading?: boolean;
}

function obterNomeExibicaoParceiro(parceiro: Parceiro): string {
  if (parceiro.tipoParceiro === "SOLIDARIO") {
    return parceiro.nome || "—";
  }
  return parceiro.razaoSocial || parceiro.nome || "—";
}

function formatarEnderecoPonto(ponto: PontoColetaAdmin): string {
  const base = `${ponto.logradouro}, ${ponto.numero} - ${ponto.bairro}, ${ponto.cidade}`;
  return ponto.estado ? `${base}/${ponto.estado}` : base;
}

export function CriarSolicitacaoModal({ isOpen, onClose, onSubmit, loading }: CriarSolicitacaoModalProps) {
  const [step, setStep] = useState<StepCriar>("selecionar_parceiro");
  const [parceiroSelecionado, setParceiroSelecionado] = useState<Parceiro | null>(null);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoColetaAdmin | null>(null);
  const [pontosDisponiveis, setPontosDisponiveis] = useState<PontoColetaAdmin[]>([]);
  const [observacao, setObservacao] = useState("");
  const [tamanhoBombona, setTamanhoBombona] = useState<number>(50);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (isOpen && step === "selecionar_parceiro") {
      carregarParceiros();
    }
  }, [isOpen, step]);

  const carregarParceiros = async () => {
    setCarregando(true);
    try {
      const resposta = await adminParceiroService.listarParceiros({
        limit: 100,
        statusAprovacao: "APROVADO",
      });
      const itens = Array.isArray(resposta) ? resposta : resposta.items || [];
      setParceiros(itens);
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSelecionarParceiro = async (parceiro: Parceiro) => {
    setCarregando(true);
    try {
      setParceiroSelecionado(parceiro);
      
      const resposta = await adminPontosService.listarPontos({
        limit: 100,
        statusAprovacao: "APROVADO",
      });
      
      const pontosFiltrados = (resposta.items || []).filter(
        (p) => p.parceiro?.id === parceiro.id
      );
      
      setPontosDisponiveis(pontosFiltrados);
      
      if (pontosFiltrados.length === 0) {
        setStep("dados_solicitacao");
        setObservacao("Este parceiro não possui pontos de coleta aprovados.");
      } else {
        setStep("selecionar_ponto");
      }
    } catch (error) {
      console.error("Erro ao carregar pontos:", error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSelecionarPonto = (ponto: PontoColetaAdmin) => {
    setPontoSelecionado(ponto);
    setStep("dados_solicitacao");
  };

  const handleSubmit = async () => {
    if (!pontoSelecionado) return;
    
    await onSubmit({
      pontoColetaId: pontoSelecionado.id,
      tamanhoBombona: tamanhoBombona,
      observacoes: observacao || undefined,
    });
  };

  const handleClose = () => {
    setStep("selecionar_parceiro");
    setParceiroSelecionado(null);
    setPontoSelecionado(null);
    setPontosDisponiveis([]);
    setObservacao("");
    setTamanhoBombona(50);
    setBusca("");
    onClose();
  };

  if (!isOpen) return null;

  const parceirosFiltrados = parceiros.filter((p) => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return true;
    const nome = p.nome?.toLowerCase() || "";
    const razao = p.razaoSocial?.toLowerCase() || "";
    const email = p.email?.toLowerCase() || "";
    const documento = p.documento || "";
    return nome.includes(termo) || razao.includes(termo) || email.includes(termo) || documento.includes(termo);
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
          <div>
            <h2 className="font-bold text-xl text-green-primary">
              {step === "selecionar_parceiro" && "Selecionar Parceiro"}
              {step === "selecionar_ponto" && "Selecionar Ponto de Coleta"}
              {step === "dados_solicitacao" && "Nova Solicitação de Coleta"}
            </h2>
            <p className="text-xs text-white-500">
              {step === "selecionar_parceiro" && "Escolha o parceiro que fará a solicitação"}
              {step === "selecionar_ponto" && "Escolha um dos pontos de coleta do parceiro"}
              {step === "dados_solicitacao" && "Preencha os dados da solicitação"}
            </p>
          </div>
          <button onClick={handleClose} className="text-red-primary hover:text-red-hover cursor-pointer" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Selecionar Parceiro */}
        {step === "selecionar_parceiro" && (
          <div>
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

            <div className="max-h-[400px] overflow-y-auto">
              {carregando ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-white-500">Carregando parceiros...</p>
                </div>
              ) : parceirosFiltrados.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-white-500 text-sm">
                    {busca ? "Nenhum parceiro encontrado." : "Nenhum parceiro aprovado disponível."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {parceirosFiltrados.map((parceiro) => (
                    <button
                      key={parceiro.id}
                      onClick={() => handleSelecionarParceiro(parceiro)}
                      disabled={carregando || loading}
                      className="w-full text-left p-3 rounded-lg border border-white-100 hover:border-green-primary hover:bg-green-50 transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-black-primary truncate">
                            {obterNomeExibicaoParceiro(parceiro)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-white-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {parceiro.tipoParceiro} ({parceiro.tipoPessoa})
                            </span>
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
          </div>
        )}

        {/* STEP 2: Selecionar Ponto */}
        {step === "selecionar_ponto" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-primary/20">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-primary" />
                <span className="text-sm text-black-primary">
                  Parceiro: <strong>{parceiroSelecionado && obterNomeExibicaoParceiro(parceiroSelecionado)}</strong>
                </span>
              </div>
              <button onClick={() => { setStep("selecionar_parceiro"); setPontoSelecionado(null); }} className="text-xs text-green-primary hover:underline" disabled={loading}>
                Trocar
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {pontosDisponiveis.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white-500">Este parceiro não possui pontos de coleta aprovados.</p>
                </div>
              ) : (
                pontosDisponiveis.map((ponto) => (
                  <button
                    key={ponto.id}
                    onClick={() => handleSelecionarPonto(ponto)}
                    className="w-full text-left p-3 rounded-lg border border-white-100 hover:border-green-primary hover:bg-green-50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-black-primary">{ponto.nomePontoColeta}</p>
                        <p className="text-xs text-white-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {formatarEnderecoPonto(ponto)}
                        </p>
                        <p className="text-xs text-white-400 mt-1">Capacidade: {ponto.capacidadeBombona} L</p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <span className="text-xs font-medium text-green-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Selecionar →
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Dados da Solicitação */}
        {step === "dados_solicitacao" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white-50 rounded-lg border border-white-100">
                <span className="text-xs text-white-500 block">Parceiro</span>
                <p className="text-sm font-semibold text-black-primary">
                  {parceiroSelecionado && obterNomeExibicaoParceiro(parceiroSelecionado)}
                </p>
                <button onClick={() => setStep("selecionar_parceiro")} className="text-xs text-green-primary hover:underline mt-1" disabled={loading}>
                  Trocar parceiro
                </button>
              </div>
              <div className="p-3 bg-white-50 rounded-lg border border-white-100">
                <span className="text-xs text-white-500 block">Ponto de Coleta</span>
                <p className="text-sm font-semibold text-black-primary">
                  {pontoSelecionado ? pontoSelecionado.nomePontoColeta : "Nenhum ponto selecionado"}
                </p>
                {pontoSelecionado && (
                  <button onClick={() => setStep("selecionar_ponto")} className="text-xs text-green-primary hover:underline mt-1" disabled={loading}>
                    Trocar ponto
                  </button>
                )}
              </div>
            </div>

            {pontoSelecionado ? (
              <>
                <label className="block">
                  <span className="text-xs text-white-600 font-medium">Tamanho da Bombona (Litros) *</span>
                  <select
                    value={tamanhoBombona}
                    onChange={(e) => setTamanhoBombona(Number(e.target.value))}
                    className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                    disabled={loading}
                  >
                    <option value={20}>20 Litros</option>
                    <option value={50}>50 Litros</option>
                    <option value={100}>100 Litros</option>
                    <option value={200}>200 Litros</option>
                    <option value={500}>500 Litros</option>
                    <option value={1000}>1000 Litros</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-white-600 font-medium">Observações (opcional)</span>
                  <textarea
                    rows={3}
                    placeholder="Observações sobre a solicitação..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary resize-none"
                    disabled={loading}
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <Button variant="danger" size="sm" onClick={handleClose} disabled={loading} fullWidth>
                    Cancelar
                  </Button>
                  <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit} fullWidth disabled={loading}>
                    Criar Solicitação
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-white-500">Selecione um ponto de coleta para continuar.</p>
                <Button variant="primary" size="sm" onClick={() => setStep("selecionar_ponto")} className="mt-4">
                  Voltar para seleção de pontos
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}