// CriarParceiroModal.tsx

import {
  useEffect,
  useState,
  type FormEvent,
  useRef,
} from "react";

import {
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  Building2,
  Factory,
  GraduationCap,
  Hotel,
  Utensils,
  Home,
  Store,
  HeartHandshake,
  Users,
  Landmark,
} from "lucide-react";

import Button from "../ui/Button";
import AddressMapPicker, { type AddressMapValue } from "../ui/AddressMapPicker";

import {
  type StatusAprovacao,
} from "../../services/adminParceiroService";

import {
  type ParceiroIndicador,
  type RegisterCredentials,
} from "../../services/authService";

import { CATEGORIA_OPTIONS } from "../../constants/categorias";

// ============================================================
// TIPOS
// ============================================================

export interface NovoParceiroPayload
  extends RegisterCredentials {
  statusAprovacaoParceiro: StatusAprovacao;
  latitude: number;
  longitude: number;
}

interface CriarParceiroModalProps {
  isOpen: boolean;
  onClose: () => void;

  onSubmit: (
    payload: NovoParceiroPayload
  ) => Promise<void>;

  indicadores: ParceiroIndicador[];
  loading?: boolean;
}

// ============================================================
// ESTADO INICIAL COMPLETO
// ============================================================

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
  responsavelLegalCpf: "",
  
  cep: "",
  logradouro: "",
  numero: "",
  cidade: "",
  bairro: "",
  estado: "",
  complemento: "",

  categoria: 1,
  expectativaGeracao: 0,

  redesSociais: [],
  site: "",

  aceiteDivulgacao: false,

  parceiroIndicadorId: null,
  outroParceiro: "",
  comoConheceu: "Criado pelo Administrador",
  observacao: "",

  longitude: 0,
  latitude: 0,

  statusAprovacaoParceiro: "APROVADO",
};

// ============================================================
// MAPEAMENTO DE CATEGORIAS POR TIPO DE PARCEIRO
// ============================================================

const CATEGORIAS_POR_TIPO_PARCEIRO: Record<string, number[]> = {
  SOLIDARIO: [8], // Doador Avulso
  COMUNITARIO: [6, 7], // Condomínio, Feira Livre/Eventos
  INSTITUCIONAL: [1, 2, 3, 4, 5], // Cozinha Industrial, Empresa/Indústria, Escola/Universidade, Hotel/Pousada, Restaurante/Bar
};

const CATEGORIA_ICON_MAP: Record<number, React.ReactNode> = {
  1: <Building2 className="w-6 h-6 text-green-primary" />,
  2: <Factory className="w-6 h-6 text-green-primary" />,
  3: <GraduationCap className="w-6 h-6 text-green-primary" />,
  4: <Hotel className="w-6 h-6 text-green-primary" />,
  5: <Utensils className="w-6 h-6 text-green-primary" />,
  6: <Home className="w-6 h-6 text-green-primary" />,
  7: <Store className="w-6 h-6 text-green-primary" />,
  8: <HeartHandshake className="w-6 h-6 text-green-primary" />,
};

const TIPO_PARCEIRO_ICON_MAP: Record<string, React.ReactNode> = {
  SOLIDARIO: <HeartHandshake className="w-5 h-5 text-green-primary" />,
  COMUNITARIO: <Users className="w-5 h-5 text-green-primary" />,
  INSTITUCIONAL: <Landmark className="w-5 h-5 text-green-primary" />,
};

// ============================================================
// COMPONENTE
// ============================================================

export function CriarParceiroModal({
  isOpen,
  onClose,
  onSubmit,
  indicadores,
  loading = false,
}: CriarParceiroModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [novoParceiro, setNovoParceiro] =
    useState<NovoParceiroPayload>(NOVO_PARCEIRO_INICIAL);

  const [redeSocialInput, setRedeSocialInput] = useState("");
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const atualizandoDoMapa = useRef(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (!isOpen) {
      setNovoParceiro(NOVO_PARCEIRO_INICIAL);
      setRedeSocialInput("");
      setErroFormulario(null);
      setCurrentStep(1);
      atualizandoDoMapa.current = false;

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
    }
  }, [isOpen]);

  const buscarCoordenadasPorTexto = async () => {
    const temDadosParaBuscar =
      novoParceiro.cep ||
      (novoParceiro.cidade && novoParceiro.estado) ||
      (novoParceiro.logradouro && novoParceiro.cidade);

    if (!temDadosParaBuscar) return;

    try {
      const queryParts = [
        novoParceiro.logradouro,
        novoParceiro.numero,
        novoParceiro.bairro,
        novoParceiro.cidade,
        novoParceiro.estado,
        novoParceiro.cep,
        "Brasil",
      ]
        .filter(Boolean)
        .join(", ");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          queryParts
        )}&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (!data || data.length === 0) return;

      const latitude = Number(data[0].lat);
      const longitude = Number(data[0].lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      atualizandoDoMapa.current = true;
      setNovoParceiro((atual) => ({
        ...atual,
        latitude: Number(latitude.toFixed(7)),
        longitude: Number(longitude.toFixed(7)),
      }));

      setTimeout(() => {
        atualizandoDoMapa.current = false;
      }, 100);
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
    }
  };

  useEffect(() => {
    if (atualizandoDoMapa.current) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    const temDadosMinimos = novoParceiro.cep || (novoParceiro.cidade && novoParceiro.estado);
    if (!temDadosMinimos) return;

    debounceTimeout.current = setTimeout(() => {
      buscarCoordenadasPorTexto();
    }, 1000);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [
    novoParceiro.cep,
    novoParceiro.logradouro,
    novoParceiro.numero,
    novoParceiro.bairro,
    novoParceiro.cidade,
    novoParceiro.estado,
  ]);

  if (!isOpen) return null;

  const atualizarCampo = async <K extends keyof NovoParceiroPayload>(
    campo: K,
    valor: NovoParceiroPayload[K]
  ) => {
    setNovoParceiro((atual) => ({
      ...atual,
      [campo]: valor,
    }));

    if (erroFormulario) setErroFormulario(null);

    if (campo === "tipoParceiro") {
      const tipo = String(valor);
      const categoriasPermitidas = CATEGORIAS_POR_TIPO_PARCEIRO[tipo] || [];
      
      if (categoriasPermitidas.length > 0) {
        const categoriaAtual = Number(novoParceiro.categoria);
        if (!categoriasPermitidas.includes(categoriaAtual)) {
          setNovoParceiro((atual) => ({
            ...atual,
            categoria: categoriasPermitidas[0],
          }));
        }
      }
    }

    if (campo === "cep") {
      const cepLimpo = String(valor).replace(/\D/g, "");
      if (cepLimpo.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
          const dadosCep = await res.json();

          if (!dadosCep.erro) {
            setNovoParceiro((atual) => ({
              ...atual,
              cep: String(valor),
              logradouro: dadosCep.logradouro || atual.logradouro,
              bairro: dadosCep.bairro || atual.bairro,
              cidade: dadosCep.localidade || atual.cidade,
              estado: dadosCep.uf || atual.estado,
            }));
          }
        } catch (e) {
          console.error("Erro ao buscar CEP:", e);
        }
      }
    }
  };

  const getCategoriasPermitidas = () => {
    const tipo = novoParceiro.tipoParceiro;
    if (!tipo) return CATEGORIA_OPTIONS;
    
    const idsPermitidos = CATEGORIAS_POR_TIPO_PARCEIRO[tipo] || [];
    return CATEGORIA_OPTIONS.filter(({ value }) => 
      idsPermitidos.includes(Number(value))
    );
  };

  const selecionarCategoria = (categoriaId: number) => {
    atualizarCampo("categoria", categoriaId);
  };

  const validarPasso1 = (): boolean => {
    if (!novoParceiro.email || !novoParceiro.senha || !novoParceiro.documento) {
      setErroFormulario("Preencha todos os campos obrigatórios (*).");
      return false;
    }
    if (!novoParceiro.tipoPessoa) {
      setErroFormulario("Selecione o tipo de pessoa.");
      return false;
    }
    if (!novoParceiro.tipoParceiro) {
      setErroFormulario("Selecione o tipo de parceiro.");
      return false;
    }
    if (novoParceiro.tipoPessoa === "JURIDICA" && !novoParceiro.razaoSocial) {
      setErroFormulario("Informe a razão social.");
      return false;
    }
    if (novoParceiro.tipoPessoa === "FISICA" && !novoParceiro.nome) {
      setErroFormulario("Informe o nome completo.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(novoParceiro.email)) {
      setErroFormulario("E-mail inválido.");
      return false;
    }
    if (novoParceiro.senha.length < 6) {
      setErroFormulario("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }

    const categoriasPermitidas = getCategoriasPermitidas();
    if (categoriasPermitidas.length === 0) {
      setErroFormulario("Nenhuma categoria disponível para o tipo de parceiro selecionado.");
      return false;
    }

    setErroFormulario(null);
    return true;
  };

  const validarPasso2 = (): boolean => {
    if (!novoParceiro.numero || novoParceiro.numero.trim() === "") {
      setErroFormulario("Informe o número do endereço.");
      return false;
    }
    if (
      !Number.isFinite(novoParceiro.latitude) ||
      !Number.isFinite(novoParceiro.longitude) ||
      (novoParceiro.latitude === 0 && novoParceiro.longitude === 0)
    ) {
      setErroFormulario("Selecione a localização do ponto de coleta no mapa ou preencha o endereço.");
      return false;
    }

    setErroFormulario(null);
    return true;
  };

  const proximoPasso = () => {
    if (validarPasso1()) setCurrentStep(2);
  };

  const passoAnterior = () => {
    setCurrentStep(1);
    setErroFormulario(null);
  };

  const atualizarEnderecoDoMapa = (data: Partial<AddressMapValue>) => {
    atualizandoDoMapa.current = true;
    setNovoParceiro((atual) => ({
      ...atual,
      cep: data.cep ?? atual.cep,
      logradouro: data.logradouro ?? atual.logradouro,
      bairro: data.bairro ?? atual.bairro,
      cidade: data.cidade ?? atual.cidade,
      estado: data.estado ?? atual.estado,
      numero: data.numero ?? atual.numero,
      complemento: data.complemento ?? atual.complemento,
      latitude: data.latitude ?? atual.latitude,
      longitude: data.longitude ?? atual.longitude,
    }));
    setTimeout(() => {
      atualizandoDoMapa.current = false;
    }, 100);
  };

  const adicionarRedeSocial = () => {
    const valor = redeSocialInput.trim();
    if (!valor) return;
    const redes = novoParceiro.redesSociais || [];
    if (redes.includes(valor)) {
      setRedeSocialInput("");
      return;
    }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarPasso2()) return;

    setErroFormulario(null);

    try {
      const temIndicador = Boolean(novoParceiro.parceiroIndicadorId);

      const payloadFinal: NovoParceiroPayload = {
        tipoPessoa: novoParceiro.tipoPessoa,
        tipoParceiro: novoParceiro.tipoParceiro,
        razaoSocial: novoParceiro.razaoSocial ? novoParceiro.razaoSocial.trim() : (novoParceiro.nome ? novoParceiro.nome.trim() : ""),
        nome: novoParceiro.nome ? novoParceiro.nome.trim() : null,
        email: novoParceiro.email.trim(),
        senha: novoParceiro.senha,
        documento: novoParceiro.documento.trim(),
        telefone: novoParceiro.telefone ? novoParceiro.telefone.trim().slice(0, 20) : "",
        aceiteMarketing: Boolean(novoParceiro.aceiteMarketing),
        responsavelLegal: novoParceiro.responsavelLegal ? novoParceiro.responsavelLegal.trim() : null,
        responsavelLegalCpf: novoParceiro.responsavelLegalCpf ? novoParceiro.responsavelLegalCpf.trim() : null,
        
        cep: novoParceiro.cep.trim(),
        logradouro: novoParceiro.logradouro.trim(),
        numero: novoParceiro.numero.trim(),
        cidade: novoParceiro.cidade.trim(),
        bairro: novoParceiro.bairro.trim(),
        estado: novoParceiro.estado || "",
        complemento: novoParceiro.complemento ? novoParceiro.complemento.trim() : null,
        
        categoria: Number(novoParceiro.categoria) || 1,
        expectativaGeracao: Number(novoParceiro.expectativaGeracao) || 0,
        
        redesSociais: novoParceiro.redesSociais || [],
        site: novoParceiro.site ? novoParceiro.site.trim() : null,
        aceiteDivulgacao: Boolean(novoParceiro.aceiteDivulgacao),
        
        parceiroIndicadorId: temIndicador ? Number(novoParceiro.parceiroIndicadorId) : null,
        outroParceiro: novoParceiro.outroParceiro ? novoParceiro.outroParceiro.trim() : null,
        comoConheceu: temIndicador ? "Parceiro Indicador" : "Criado pelo Administrador",
        
        observacao: novoParceiro.observacao ? novoParceiro.observacao.trim() : "",
        longitude: Number(novoParceiro.longitude) || 0,
        latitude: Number(novoParceiro.latitude) || 0,
        
        statusAprovacaoParceiro: "APROVADO",
      };

      await onSubmit(payloadFinal);

      setNovoParceiro(NOVO_PARCEIRO_INICIAL);
      setRedeSocialInput("");
      setCurrentStep(1);
      onClose();
    } catch (error: any) {
      console.error("Erro detalhado da API ao salvar parceiro:", error.response?.data || error);
      
      const serverMessage = error.response?.data?.message;
      let errorMessage = "Erro ao salvar parceiro.";

      if (Array.isArray(serverMessage)) {
        errorMessage = serverMessage.join(", ");
      } else if (typeof serverMessage === "string") {
        errorMessage = serverMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setErroFormulario(errorMessage);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setNovoParceiro(NOVO_PARCEIRO_INICIAL);
    setErroFormulario(null);
    setRedeSocialInput("");
    setCurrentStep(1);
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 1 ? "bg-green-primary text-white" : "bg-green-100 text-green-primary"}`}>
          1
        </div>
        <span className={`text-xs font-medium ${currentStep === 1 ? "text-green-primary font-semibold" : "text-white-400"}`}>
          Perfil & Categoria
        </span>
      </div>

      <div className="w-10 h-0.5 bg-white-200">
        <div className={`h-full bg-green-primary transition-all duration-300 ${currentStep === 2 ? "w-full" : "w-0"}`} />
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 2 ? "bg-green-primary text-white" : "bg-white-100 text-white-400"}`}>
          2
        </div>
        <span className={`text-xs font-medium ${currentStep === 2 ? "text-green-primary font-semibold" : "text-white-400"}`}>
          Endereço & Contato
        </span>
      </div>
    </div>
  );

  const renderPasso1 = () => {
    const categoriasPermitidas = getCategoriasPermitidas();
    const tipoSelecionado = novoParceiro.tipoParceiro;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
          <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Credenciais & Identificação</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-white-600 font-medium">E-mail de Acesso *</span>
              <input
                type="email"
                value={novoParceiro.email}
                onChange={(e) => atualizarCampo("email", e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
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
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
                required
                minLength={6}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="block">
              <span className="text-xs text-white-600 font-medium">Tipo de Pessoa *</span>
              <select
                value={novoParceiro.tipoPessoa}
                onChange={(e) => atualizarCampo("tipoPessoa", e.target.value)}
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
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
                placeholder="000.000.000-00 ou 00.000..."
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
                required
              />
            </label>
          </div>

          {novoParceiro.tipoPessoa === "JURIDICA" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="block sm:col-span-2">
                <span className="text-xs text-white-600 font-medium">Razão Social *</span>
                <input
                  type="text"
                  value={novoParceiro.razaoSocial}
                  onChange={(e) => atualizarCampo("razaoSocial", e.target.value)}
                  placeholder="Razão Social"
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
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
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
            </div>
          ) : (
            <div className="pt-1">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">Nome Completo *</span>
                <input
                  type="text"
                  value={novoParceiro.nome || ""}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Nome completo"
                  className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                  required
                />
              </label>
            </div>
          )}
        </div>

        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-2">
          <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Tipo de Parceiro *</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {["SOLIDARIO", "COMUNITARIO", "INSTITUCIONAL"].map((tipo) => {
              const selecionado = novoParceiro.tipoParceiro === tipo;
              const labelMap: Record<string, string> = {
                SOLIDARIO: "Solidário",
                COMUNITARIO: "Comunitário",
                INSTITUCIONAL: "Institucional",
              };

              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => atualizarCampo("tipoParceiro", tipo)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    selecionado
                      ? "border-green-primary bg-green-50/80 shadow-xs"
                      : "border-white-200 bg-white hover:border-green-200"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                    {TIPO_PARCEIRO_ICON_MAP[tipo]}
                  </div>
                  <div>
                    <span className="text-xs font-semibold block text-black-primary">{labelMap[tipo]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-2">
          <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Categoria do Estabelecimento *</h3>
          
          {!tipoSelecionado ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              ⚠️ Selecione o tipo de parceiro acima para habilitar as categorias correspondentes.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {categoriasPermitidas.map(({ value, label }) => {
                const categoriaId = Number(value);
                const selecionada = Number(novoParceiro.categoria) === categoriaId;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selecionarCategoria(categoriaId)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                      selecionada
                        ? "border-green-primary bg-green-50/80 shadow-xs"
                        : "border-white-200 bg-white hover:border-green-200"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                      {CATEGORIA_ICON_MAP[categoriaId] || <Building2 className="w-5 h-5 text-white-400" />}
                    </div>
                    <span className="text-xs font-medium text-black-primary leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
          <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Responsável & Operação</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-white-600 font-medium">Nome do Responsável Legal</span>
              <input
                type="text"
                value={novoParceiro.responsavelLegal || ""}
                onChange={(e) => atualizarCampo("responsavelLegal", e.target.value)}
                placeholder="Nome completo"
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>

            <label className="block">
              <span className="text-xs text-white-600 font-medium">Expectativa de Geração (Litros/Mês)</span>
              <input
                type="number"
                value={novoParceiro.expectativaGeracao}
                onChange={(e) => atualizarCampo("expectativaGeracao", Number(e.target.value))}
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>
          </div>

          <div className="pt-1">
            <label className="block">
              <span className="text-xs text-white-600 font-medium">Parceiro Indicador (Opcional)</span>
              <select
                value={novoParceiro.parceiroIndicadorId?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  atualizarCampo("parceiroIndicadorId", val ? Number(val) : null);
                }}
                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              >
                <option value="">Nenhum (Criado pelo Administrador)</option>
                {indicadores && indicadores.map((ind) => (
                  <option key={ind.id} value={String(ind.id)}>{ind.nome}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderPasso2 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
        <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Endereço do Ponto de Coleta</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-white-600 font-medium">CEP</span>
            <input
              type="text"
              value={novoParceiro.cep}
              onChange={(e) => atualizarCampo("cep", e.target.value)}
              placeholder="00000-000"
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs text-white-600 font-medium">Logradouro</span>
            <input
              type="text"
              value={novoParceiro.logradouro}
              onChange={(e) => atualizarCampo("logradouro", e.target.value)}
              placeholder="Rua, Avenida..."
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs text-white-600 font-medium">Número *</span>
            <input
              type="text"
              value={novoParceiro.numero}
              onChange={(e) => atualizarCampo("numero", e.target.value)}
              placeholder="123"
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
              required
            />
          </label>

          <label className="block sm:col-span-3">
            <span className="text-xs text-white-600 font-medium">Complemento</span>
            <input
              type="text"
              value={novoParceiro.complemento || ""}
              onChange={(e) => atualizarCampo("complemento", e.target.value)}
              placeholder="Apto, Sala, Bloco..."
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-white-600 font-medium">Bairro</span>
            <input
              type="text"
              value={novoParceiro.bairro}
              onChange={(e) => atualizarCampo("bairro", e.target.value)}
              placeholder="Bairro"
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
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
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="text-xs text-white-600 font-medium">Estado</span>
            <select
              value={novoParceiro.estado || ""}
              onChange={(e) => atualizarCampo("estado", e.target.value)}
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            >
              <option value="">Selecionar</option>
              <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option><option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option><option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option><option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option><option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option><option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
            </select>
          </label>
        </div>

        {/* MAPA */}
        <div className="pt-2">
          <span className="text-xs text-white-600 font-medium block mb-1">Localização no Mapa (Ajuste o pin se necessário)</span>
          <AddressMapPicker
            value={{
              cep: novoParceiro.cep,
              logradouro: novoParceiro.logradouro,
              bairro: novoParceiro.bairro,
              cidade: novoParceiro.cidade,
              estado: novoParceiro.estado || "",
              numero: novoParceiro.numero,
              complemento: novoParceiro.complemento || "",
              latitude: novoParceiro.latitude || null,
              longitude: novoParceiro.longitude || null,
            }}
            onChange={atualizarEnderecoDoMapa}
            height={260}
          />
        </div>
      </div>

      <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
        <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Contato & Redes</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-white-600 font-medium">Telefone</span>
            <input
              type="text"
              value={novoParceiro.telefone || ""}
              onChange={(e) => atualizarCampo("telefone", e.target.value)}
              placeholder="(31) 99999-9999"
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
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
              className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>
        </div>

        <label className="block pt-1">
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
              className="flex-1 bg-white border border-white-200 rounded-lg p-2 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
            <button
              type="button"
              onClick={adicionarRedeSocial}
              className="px-3 rounded-lg border border-green-primary text-green-primary text-sm hover:bg-green-100 transition-colors cursor-pointer"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {novoParceiro.redesSociais && novoParceiro.redesSociais.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {novoParceiro.redesSociais.map((rede, i) => (
                <span key={`${rede}-${i}`} className="flex items-center gap-1 rounded-md bg-white border border-white-200 px-2 py-0.5 text-xs text-black-primary">
                  {rede}
                  <button type="button" onClick={() => removerRedeSocial(i)} className="text-white-400 hover:text-red-primary cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </label>

        <div className="space-y-2 pt-2 border-t border-white-200/60">
          <label className="flex items-center gap-2 text-xs text-white-600 cursor-pointer">
            <input
              type="checkbox"
              checked={novoParceiro.aceiteMarketing}
              onChange={(e) => atualizarCampo("aceiteMarketing", e.target.checked)}
              className="w-4 h-4 accent-green-primary"
              disabled={loading}
            />
            Aceita receber comunicações de marketing
          </label>

          <label className="flex items-center gap-2 text-xs text-white-600 cursor-pointer">
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

        <label className="block pt-1">
          <span className="text-xs text-white-600 font-medium">Observação</span>
          <textarea
            value={novoParceiro.observacao || ""}
            onChange={(e) => atualizarCampo("observacao", e.target.value)}
            placeholder="Observações adicionais..."
            rows={2}
            className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary resize-none"
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
          <div>
            <h2 className="font-bold text-xl text-green-primary">Adicionar Parceiro</h2>
            <p className="text-xs text-white-500">Cadastro administrativo - Etapa {currentStep} de 2</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-white-500 hover:text-black-primary cursor-pointer transition-colors"
          >
            <X className="w-5 h-5 text-red-primary" />
          </button>
        </div>

        {renderStepIndicator()}

        {erroFormulario && (
          <div className="mb-4 rounded-lg border border-red-primary/30 bg-red-50 px-3 py-2 text-xs text-red-primary">
            {erroFormulario}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="min-h-[380px]">
            {currentStep === 1 ? renderPasso1() : renderPasso2()}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-white-100">
            {currentStep === 2 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={passoAnterior}
                disabled={loading}
                fullWidth
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}

            {currentStep === 1 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={proximoPasso}
                disabled={loading}
                fullWidth
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                fullWidth
              >
                Salvar Parceiro
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CriarParceiroModal;