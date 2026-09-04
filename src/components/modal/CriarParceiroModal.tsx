// CriarParceiroModal.tsx - Versão Completa
import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import { type StatusAprovacao } from "../../services/adminParceiroService";
import { type ParceiroIndicador } from "../../services/authService";
import { type RegisterCredentials } from "../../services/authService";

export interface NovoParceiroPayload extends RegisterCredentials {
  statusAprovacaoParceiro: StatusAprovacao;
}

const NOVO_PARCEIRO_INICIAL: NovoParceiroPayload = {
  tipoPessoa: "",
  tipoParceiro: "",
  razaoSocial: "",
  nome: "",
  email: "",
  senha: "",
  documento: "",
  telefone: "",
  aceiteMarketing: false,
  responsavelLegal: "",
  cep: "",
  logradouro: "",
  numero: "",
  cidade: "",
  bairro: "",
  estado: "",
  complemento: "",
  categoria: 0,
  expectativaGeracao: 0,
  capacidadeBombona: 0,
  nivelAtualPct: 0,
  statusBombona: "",
  redesSociais: [],
  site: "",
  aceiteDivulgacao: false,
  parceiroIndicadorId: null,
  outroParceiro: "",
  comoConheceu: "",
  observacao: "",
  longitude: 0,
  latitude: 0,
  statusAprovacaoParceiro: "PENDENTE",
};

interface CriarParceiroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NovoParceiroPayload) => Promise<void>;
  indicadores: ParceiroIndicador[];
  loading?: boolean;
}

export function CriarParceiroModal({
  isOpen,
  onClose,
  onSubmit,
  indicadores,
  loading,
}: CriarParceiroModalProps) {
  const [novoParceiro, setNovoParceiro] = useState<NovoParceiroPayload>(NOVO_PARCEIRO_INICIAL);
  const [redeSocialInput, setRedeSocialInput] = useState("");
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  if (!isOpen) return null;

  const atualizarCampo = <K extends keyof NovoParceiroPayload>(
    campo: K,
    valor: NovoParceiroPayload[K]
  ) => {
    setNovoParceiro((atual) => ({ ...atual, [campo]: valor }));
  };

  const adicionarRedeSocial = () => {
    const valor = redeSocialInput.trim();
    if (!valor) return;
    const redes = novoParceiro.redesSociais || [];
    atualizarCampo("redesSociais", [...redes, valor]);
    setRedeSocialInput("");
  };

  const removerRedeSocial = (index: number) => {
    const redes = novoParceiro.redesSociais || [];
    atualizarCampo(
      "redesSociais",
      redes.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!novoParceiro.email || !novoParceiro.senha || !novoParceiro.documento) {
      setErroFormulario("Preencha todos os campos obrigatórios (*)");
      return;
    }

    if (!novoParceiro.razaoSocial && !novoParceiro.nome) {
      setErroFormulario("Preencha o nome ou razão social");
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(novoParceiro.email)) {
      setErroFormulario("E-mail inválido");
      return;
    }

    if (novoParceiro.senha.length < 6) {
      setErroFormulario("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setErroFormulario(null);
    try {
      await onSubmit(novoParceiro);
      setNovoParceiro(NOVO_PARCEIRO_INICIAL);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar";
      setErroFormulario(errorMessage);
    }
  };

  const handleClose = () => {
    setNovoParceiro(NOVO_PARCEIRO_INICIAL);
    setErroFormulario(null);
    setRedeSocialInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
          <div>
            <h2 className="font-bold text-xl text-green-primary">Adicionar Parceiro</h2>
            <p className="text-xs text-white-500">Cadastro administrativo de parceiro</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white-500 hover:text-black-primary cursor-pointer transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-red-primary" />
          </button>
        </div>

        {erroFormulario && (
          <div className="mb-4 rounded-lg border border-red-primary/30 bg-red-50 px-3 py-2 text-xs text-red-primary">
            {erroFormulario}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados de Acesso */}
          <div>
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2">
              Dados de Acesso
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">E-mail *</span>
                <input
                  type="email"
                  value={novoParceiro.email}
                  onChange={(e) => atualizarCampo("email", e.target.value)}
                  placeholder="nome@exemplo.com"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Senha *</span>
                <input
                  type="password"
                  value={novoParceiro.senha}
                  onChange={(e) => atualizarCampo("senha", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </label>
            </div>
          </div>

          {/* Identificação */}
          <div>
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2">
              Identificação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Tipo de Pessoa *</span>
                <select
                  value={novoParceiro.tipoPessoa}
                  onChange={(e) => atualizarCampo("tipoPessoa", e.target.value)}
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                  disabled={loading}
                  required
                >
                  <option value="">Selecionar</option>
                  <option value="FISICA">Física</option>
                  <option value="JURIDICA">Jurídica</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Documento (CPF/CNPJ) *</span>
                <input
                  type="text"
                  value={novoParceiro.documento}
                  onChange={(e) => atualizarCampo("documento", e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                  required
                />
              </label>
              {novoParceiro.tipoPessoa === "JURIDICA" ? (
                <>
                  <label className="block">
                    <span className="text-xs text-white-600 font-medium">Razão Social *</span>
                    <input
                      type="text"
                      value={novoParceiro.razaoSocial}
                      onChange={(e) => atualizarCampo("razaoSocial", e.target.value)}
                      placeholder="Razão Social"
                      className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      disabled={loading}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-white-600 font-medium">Nome Fantasia</span>
                    <input
                      type="text"
                      value={novoParceiro.nome || ""}
                      onChange={(e) => atualizarCampo("nome", e.target.value)}
                      placeholder="Nome Fantasia"
                      className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                      disabled={loading}
                    />
                  </label>
                </>
              ) : (
                <label className="block sm:col-span-2">
                  <span className="text-xs text-white-600 font-medium">Nome Completo *</span>
                  <input
                    type="text"
                    value={novoParceiro.nome || ""}
                    onChange={(e) => atualizarCampo("nome", e.target.value)}
                    placeholder="Nome completo"
                    className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                    disabled={loading}
                    required
                  />
                </label>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2">
              Endereço (Cadastro do primeiro ponto de coleta)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">CEP</span>
                <input
                  type="text"
                  value={novoParceiro.cep}
                  onChange={(e) => atualizarCampo("cep", e.target.value)}
                  placeholder="00000-000"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Logradouro</span>
                <input
                  type="text"
                  value={novoParceiro.logradouro}
                  onChange={(e) => atualizarCampo("logradouro", e.target.value)}
                  placeholder="Rua, Avenida..."
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Número</span>
                <input
                  type="text"
                  value={novoParceiro.numero}
                  onChange={(e) => atualizarCampo("numero", e.target.value)}
                  placeholder="123"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Complemento</span>
                <input
                  type="text"
                  value={novoParceiro.complemento || ""}
                  onChange={(e) => atualizarCampo("complemento", e.target.value)}
                  placeholder="Apto, Sala..."
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Bairro</span>
                <input
                  type="text"
                  value={novoParceiro.bairro}
                  onChange={(e) => atualizarCampo("bairro", e.target.value)}
                  placeholder="Bairro"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Cidade</span>
                <input
                  type="text"
                  value={novoParceiro.cidade}
                  onChange={(e) => atualizarCampo("cidade", e.target.value)}
                  placeholder="Cidade"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Estado</span>
                <select
                  value={novoParceiro.estado || ""}
                  onChange={(e) => atualizarCampo("estado", e.target.value)}
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                  disabled={loading}
                >
                  <option value="">Selecionar</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </label>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2">
              Contato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Telefone</span>
                <input
                  type="text"
                  value={novoParceiro.telefone || ""}
                  onChange={(e) => atualizarCampo("telefone", e.target.value)}
                  placeholder="(31) 99999-9999"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Site</span>
                <input
                  type="text"
                  value={novoParceiro.site || ""}
                  onChange={(e) => atualizarCampo("site", e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-white-600 font-medium">Redes Sociais</span>
                <div className="flex gap-1.5 mt-1">
                  <input
                    type="text"
                    value={redeSocialInput}
                    onChange={(e) => setRedeSocialInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarRedeSocial();
                      }
                    }}
                    placeholder="instagram.com/..."
                    className="flex-1 border border-white-200 rounded-lg p-2 text-sm focus:outline-none focus:border-green-primary"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={adicionarRedeSocial}
                    className="px-3 rounded-lg border border-green-primary text-green-primary text-sm hover:bg-green-100 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {novoParceiro.redesSociais && novoParceiro.redesSociais.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {novoParceiro.redesSociais.map((rede, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-md bg-white-50 border border-white-100 px-2 py-0.5 text-xs text-black-primary"
                      >
                        {rede}
                        <button
                          type="button"
                          onClick={() => removerRedeSocial(i)}
                          className="text-white-400 hover:text-red-primary transition-colors"
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Classificação e Status */}
          <div>
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2">
              Classificação e Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Tipo de Parceiro *</span>
                <select
                  value={novoParceiro.tipoParceiro}
                  onChange={(e) => atualizarCampo("tipoParceiro", e.target.value)}
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                  disabled={loading}
                  required
                >
                  <option value="">Selecionar</option>
                  <option value="COMUNITARIO">Comunitário</option>
                  <option value="SOLIDARIO">Solidário</option>
                  <option value="INSTITUCIONAL">Institucional</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Status de Aprovação</span>
                <select
                  value={novoParceiro.statusAprovacaoParceiro}
                  onChange={(e) => atualizarCampo("statusAprovacaoParceiro", e.target.value as StatusAprovacao)}
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                  disabled={loading}
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="REJEITADO">Rejeitado</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Parceiro Indicador</span>
                <select
                  value={novoParceiro.parceiroIndicadorId?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    atualizarCampo("parceiroIndicadorId", value ? Number(value) : null);
                  }}
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                  disabled={loading}
                >
                  <option value="">Nenhum</option>
                  {indicadores.map((ind) => (
                    <option key={ind.id} value={String(ind.id)}>
                      {ind.nome}
                    </option>
                  ))}
                </select>
              </label>
            
            </div>
          </div>

          {/* Responsável Legal */}
          <div>
            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider mb-2">
              Responsável Legal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Nome do Responsável</span>
                <input
                  type="text"
                  value={novoParceiro.responsavelLegal || ""}
                  onChange={(e) => atualizarCampo("responsavelLegal", e.target.value)}
                  placeholder="Nome completo"
                  className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
             
            </div>
          </div>

          {/* Preferências */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white-600 cursor-pointer">
              <input
                type="checkbox"
                checked={novoParceiro.aceiteMarketing}
                onChange={(e) => atualizarCampo("aceiteMarketing", e.target.checked)}
                className="w-4 h-4 accent-green-primary"
                disabled={loading}
              />
              Aceita receber comunicações de marketing
            </label>
            <label className="flex items-center gap-2 text-sm text-white-600 cursor-pointer">
              <input
                type="checkbox"
                checked={novoParceiro.aceiteDivulgacao || false}
                onChange={(e) => atualizarCampo("aceiteDivulgacao", e.target.checked)}
                className="w-4 h-4 accent-green-primary"
                disabled={loading}
              />
              Aceita divulgação
            </label>
          </div>

          {/* Observação */}
          <div>
            <label className="block">
              <span className="text-xs text-white-600 font-medium">Observação</span>
              <textarea
                value={novoParceiro.observacao || ""}
                onChange={(e) => atualizarCampo("observacao", e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary resize-none"
                disabled={loading}
              />
            </label>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button variant="danger" size="sm" onClick={handleClose} disabled={loading} fullWidth>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={loading} type="submit" fullWidth>
              Salvar Parceiro
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}