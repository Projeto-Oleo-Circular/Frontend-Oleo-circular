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
import Input from "../ui/Input";
import ProgressBar from "../ui/ProgressBar";
import Checkbox from "../ui/Checkbox";

import AddressMapPicker, {
  type AddressMapValue,
} from "../ui/AddressMapPicker";

import {
  type StatusAprovacao,
} from "../../services/adminParceiroService";

import {
  authService,
  type ParceiroIndicador,
  type RegisterCredentials,
} from "../../services/authService";

import { CATEGORIA_OPTIONS } from "../../constants/categorias";


// ============================================================
// TIPOS
// ============================================================

export interface RedeSocial {
  tipo: string;
  valor: string;
}

export interface NovoParceiroPayload
  extends Omit<RegisterCredentials, "redesSociais"> {
  redesSociais: RedeSocial[];
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
// REDES SOCIAIS — OPÇÕES
// ============================================================

const REDES_OPCOES = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "facebook",  label: "Facebook" },
  { value: "twitter",   label: "X (Twitter)" },
  { value: "tiktok",    label: "TikTok" },
  { value: "youtube",   label: "YouTube" },
  { value: "outra",     label: "Outra Rede Social" },
];


// ============================================================
// ESTADO INICIAL
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

  expectativaGeracao: "",
  capacidadeBombona: "",

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
// MÁSCARAS
// ============================================================

const somenteNumeros = (
  valor: string | null | undefined
): string => {
  return String(valor ?? "").replace(/\D/g, "");
};


const mascaraCPF = (valor: string): string => {
  const numeros = somenteNumeros(valor).slice(0, 11);

  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};


const mascaraCNPJ = (valor: string): string => {
  const numeros = somenteNumeros(valor).slice(0, 14);

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};


const mascaraDocumento = (
  valor: string,
  tipoPessoa: string
): string => {
  if (tipoPessoa === "JURIDICA") {
    return mascaraCNPJ(valor);
  }
  return mascaraCPF(valor);
};


const mascaraTelefone = (valor: string): string => {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};


const mascaraCEP = (valor: string): string => {
  const numeros = somenteNumeros(valor).slice(0, 8);
  return numeros.replace(/^(\d{5})(\d)/, "$1-$2");
};


const mascaraCPFResponsavel = (valor: string): string =>
  mascaraCPF(valor);


// ============================================================
// MAPEAMENTO DE CATEGORIAS
// ============================================================

const CATEGORIAS_POR_TIPO_PARCEIRO: Record<string, number[]> = {
  SOLIDARIO: [8],
  COMUNITARIO: [6, 7],
  INSTITUCIONAL: [1, 2, 3, 4, 5],
};


// ============================================================
// ÍCONES DE CATEGORIA
// ============================================================

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


// ============================================================
// ÍCONES DO TIPO DE PARCEIRO
// ============================================================

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

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [currentStep, setCurrentStep] = useState(1);

  const [novoParceiro, setNovoParceiro] =
    useState<NovoParceiroPayload>(NOVO_PARCEIRO_INICIAL);

  // ----------------------------------------------------------
  // REDES SOCIAIS (seleção + valor)
  // ----------------------------------------------------------

  const [selectedRede, setSelectedRede] = useState<string | null>(null);
  const [redeValue, setRedeValue] = useState("");

  const [erroFormulario, setErroFormulario] =
    useState<string | null>(null);

  // ==========================================================
  // DISPONIBILIDADE
  // ==========================================================

  const [verificandoDisponibilidade, setVerificandoDisponibilidade] =
    useState(false);

  const [emailDisponivel, setEmailDisponivel] =
    useState<boolean | null>(null);

  const [documentoDisponivel, setDocumentoDisponivel] =
    useState<boolean | null>(null);

  // ==========================================================
  // REFS
  // ==========================================================

  const atualizandoDoMapa = useRef(false);

  const debounceTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================================
  // REGRA: REDES SOCIAIS SÓ PARA INSTITUCIONAL
  // ==========================================================

  const isInstitucional =
    novoParceiro.tipoParceiro === "INSTITUCIONAL";

  // ==========================================================
  // RESET AO FECHAR
  // ==========================================================

  useEffect(() => {
    if (!isOpen) {
      setNovoParceiro(NOVO_PARCEIRO_INICIAL);
      setSelectedRede(null);
      setRedeValue("");
      setErroFormulario(null);
      setCurrentStep(1);
      setEmailDisponivel(null);
      setDocumentoDisponivel(null);
      setVerificandoDisponibilidade(false);
      atualizandoDoMapa.current = false;

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
    }
  }, [isOpen]);

  // ==========================================================
  // HELPERS DE REDES SOCIAIS
  // ==========================================================

  const getRedeLabel = (tipo: string) =>
    REDES_OPCOES.find((r) => r.value === tipo)?.label || tipo;

  const getPlaceholderInput = () => {
    switch (selectedRede) {
      case "instagram":
        return "@usuario ou https://instagram.com/usuario";
      case "linkedin":
        return "https://linkedin.com/in/usuario";
      case "facebook":
        return "@usuario ou https://facebook.com/usuario";
      case "twitter":
        return "@usuario ou https://x.com/usuario";
      case "tiktok":
        return "@usuario ou https://tiktok.com/@usuario";
      case "youtube":
        return "@canal ou link do canal";
      case "outra":
        return "@usuario ou link da rede social";
      default:
        return "Digite o @ ou link";
    }
  };

  const handleSelectRede = (value: string) => {
    setSelectedRede(value);
    setRedeValue("");
  };

  // ==========================================================
  // BUSCAR COORDENADAS
  // ==========================================================

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
        {
          headers: { "Accept-Language": "pt-BR" },
        }
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

  // ==========================================================
  // OBSERVA MUDANÇAS NO ENDEREÇO
  // ==========================================================

  useEffect(() => {
    if (atualizandoDoMapa.current) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const temDadosMinimos =
      novoParceiro.cep ||
      (novoParceiro.cidade && novoParceiro.estado);

    if (!temDadosMinimos) return;

    debounceTimeout.current = setTimeout(() => {
      buscarCoordenadasPorTexto();
    }, 1000);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [
    novoParceiro.cep,
    novoParceiro.logradouro,
    novoParceiro.numero,
    novoParceiro.bairro,
    novoParceiro.cidade,
    novoParceiro.estado,
  ]);

  // ==========================================================
  // NÃO RENDERIZA SE FECHADO
  // ==========================================================

  if (!isOpen) {
    return null;
  }

  // ==========================================================
  // ATUALIZAR CAMPO
  // ==========================================================

  const atualizarCampo = async <
    K extends keyof NovoParceiroPayload
  >(
    campo: K,
    valor: NovoParceiroPayload[K]
  ) => {
    setNovoParceiro((atual) => ({
      ...atual,
      [campo]: valor,
    }));

    if (erroFormulario) setErroFormulario(null);

    if (campo === "email") setEmailDisponivel(null);
    if (campo === "documento") setDocumentoDisponivel(null);

    // --------------------------------------------------------
    // Troca de pessoa física / jurídica
    // --------------------------------------------------------
    if (campo === "tipoPessoa") {
      const tipoPessoa = String(valor);
      setDocumentoDisponivel(null);

      setNovoParceiro((atual) => ({
        ...atual,
        documento: atual.documento
          ? mascaraDocumento(atual.documento, tipoPessoa)
          : "",
      }));
    }

    // --------------------------------------------------------
    // Tipo parceiro
    // --------------------------------------------------------
    if (campo === "tipoParceiro") {
      const tipo = String(valor);

      const categoriasPermitidas =
        CATEGORIAS_POR_TIPO_PARCEIRO[tipo] || [];

      if (categoriasPermitidas.length > 0) {
        const categoriaAtual = Number(novoParceiro.categoria);

        if (!categoriasPermitidas.includes(categoriaAtual)) {
          setNovoParceiro((atual) => ({
            ...atual,
            categoria: categoriasPermitidas[0],
          }));
        }
      }

      // ------------------------------------------------------
      // Redes sociais / site / divulgação só fazem sentido
      // para parceiro INSTITUCIONAL.
      // ------------------------------------------------------
      if (tipo !== "INSTITUCIONAL") {
        setSelectedRede(null);
        setRedeValue("");

        setNovoParceiro((atual) => ({
          ...atual,
          redesSociais: [],
          site: "",
          aceiteDivulgacao: false,
        }));
      }
    }

    // --------------------------------------------------------
    // CEP
    // --------------------------------------------------------
    if (campo === "cep") {
      const cepLimpo = somenteNumeros(String(valor));

      if (cepLimpo.length === 8) {
        try {
          const res = await fetch(
            `https://viacep.com.br/ws/${cepLimpo}/json/`
          );

          const dadosCep = await res.json();

          if (!dadosCep.erro) {
            setNovoParceiro((atual) => ({
              ...atual,
              cep: mascaraCEP(String(valor)),
              logradouro: dadosCep.logradouro || atual.logradouro,
              bairro: dadosCep.bairro || atual.bairro,
              cidade: dadosCep.localidade || atual.cidade,
              estado: dadosCep.uf || atual.estado,
            }));
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        }
      }
    }
  };

  // ==========================================================
  // CATEGORIAS PERMITIDAS
  // ==========================================================

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

  // ==========================================================
  // VALIDAÇÃO PASSO 1
  // ==========================================================

  const validarPasso1 = (): boolean => {
    if (
      !novoParceiro.email ||
      !novoParceiro.senha ||
      !novoParceiro.documento
    ) {
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

    if (
      novoParceiro.tipoPessoa === "JURIDICA" &&
      !novoParceiro.razaoSocial
    ) {
      setErroFormulario("Informe a razão social.");
      return false;
    }

    if (
      novoParceiro.tipoPessoa === "FISICA" &&
      !novoParceiro.nome
    ) {
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

    const documento = somenteNumeros(novoParceiro.documento);

    if (novoParceiro.tipoPessoa === "FISICA" && documento.length !== 11) {
      setErroFormulario("Informe um CPF com 11 dígitos.");
      return false;
    }

    if (novoParceiro.tipoPessoa === "JURIDICA" && documento.length !== 14) {
      setErroFormulario("Informe um CNPJ com 14 dígitos.");
      return false;
    }

    const categoriasPermitidas = getCategoriasPermitidas();

    if (categoriasPermitidas.length === 0) {
      setErroFormulario(
        "Nenhuma categoria disponível para o tipo de parceiro selecionado."
      );
      return false;
    }

    setErroFormulario(null);
    return true;
  };

  // ==========================================================
  // VERIFICAR EMAIL E DOCUMENTO
  // ==========================================================

  const verificarEmailEDocumento = async (): Promise<boolean> => {
    const email = novoParceiro.email.trim();
    const documento = somenteNumeros(novoParceiro.documento);

    if (!email || !documento) {
      setErroFormulario("Informe o e-mail e o documento.");
      return false;
    }

    try {
      setVerificandoDisponibilidade(true);
      setErroFormulario(null);

      const resultado = await authService.verificarDisponibilidade({
        email,
        documento,
      });

      setEmailDisponivel(resultado.emailDisponivel);
      setDocumentoDisponivel(resultado.documentoDisponivel);

      if (resultado.emailDisponivel === false) {
        setErroFormulario(
          "Este e-mail já está cadastrado. Informe outro e-mail."
        );
        return false;
      }

      if (resultado.documentoDisponivel === false) {
        setErroFormulario(
          novoParceiro.tipoPessoa === "JURIDICA"
            ? "Este CNPJ já está cadastrado."
            : "Este CPF já está cadastrado."
        );
        return false;
      }

      return true;
    } catch (error: any) {
      console.error(
        "Erro ao verificar disponibilidade:",
        error?.response?.data || error
      );

      const mensagem =
        error?.response?.data?.message ||
        "Não foi possível verificar o e-mail e o documento.";

      setErroFormulario(
        Array.isArray(mensagem) ? mensagem.join(", ") : String(mensagem)
      );

      return false;
    } finally {
      setVerificandoDisponibilidade(false);
    }
  };

  // ==========================================================
  // VALIDAÇÃO PASSO 2
  // ==========================================================

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
      setErroFormulario(
        "Selecione a localização do ponto de coleta no mapa ou preencha o endereço."
      );
      return false;
    }

    setErroFormulario(null);
    return true;
  };

  // ==========================================================
  // PRÓXIMO PASSO
  // ==========================================================

  const proximoPasso = async () => {
    if (verificandoDisponibilidade) return;

    if (!validarPasso1()) return;

    const disponivel = await verificarEmailEDocumento();

    if (!disponivel) return;

    setErroFormulario(null);
    setCurrentStep(2);
  };

  // ==========================================================
  // VOLTAR
  // ==========================================================

  const passoAnterior = () => {
    setCurrentStep(1);
    setErroFormulario(null);
  };

  // ==========================================================
  // ENDEREÇO VINDO DO MAPA
  // ==========================================================

  const atualizarEnderecoDoMapa = (
    data: Partial<AddressMapValue>
  ) => {
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

  // ==========================================================
  // ADICIONAR REDE SOCIAL
  // ==========================================================

  const adicionarRedeSocial = () => {
    if (!isInstitucional) return;
    if (!selectedRede || !redeValue.trim()) return;

    const novaRede: RedeSocial = {
      tipo: selectedRede,
      valor: redeValue.trim(),
    };

    const redes = novoParceiro.redesSociais || [];

    // Evita duplicar exatamente a mesma rede + mesmo valor
    const jaExiste = redes.some(
      (r) =>
        r.tipo === novaRede.tipo &&
        r.valor.toLowerCase() === novaRede.valor.toLowerCase()
    );

    if (jaExiste) {
      setRedeValue("");
      return;
    }

    atualizarCampo("redesSociais", [...redes, novaRede]);

    setSelectedRede(null);
    setRedeValue("");
  };

  // ==========================================================
  // REMOVER REDE SOCIAL
  // ==========================================================

  const removerRedeSocial = (index: number) => {
    const redes = novoParceiro.redesSociais || [];
    atualizarCampo(
      "redesSociais",
      redes.filter((_, i) => i !== index)
    );
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validarPasso2()) return;

    setErroFormulario(null);

    try {
      const temIndicador = Boolean(novoParceiro.parceiroIndicadorId);

      const enviarComunicacao =
        novoParceiro.tipoParceiro === "INSTITUCIONAL";

      const payloadFinal: NovoParceiroPayload = {
        tipoPessoa: novoParceiro.tipoPessoa,
        tipoParceiro: novoParceiro.tipoParceiro,

        razaoSocial: novoParceiro.razaoSocial
          ? novoParceiro.razaoSocial.trim()
          : novoParceiro.nome
          ? novoParceiro.nome.trim()
          : "",

        nome: novoParceiro.nome ? novoParceiro.nome.trim() : null,

        email: novoParceiro.email.trim(),
        senha: novoParceiro.senha,

        documento: somenteNumeros(novoParceiro.documento),

        telefone: novoParceiro.telefone
          ? somenteNumeros(novoParceiro.telefone)
          : "",

        aceiteMarketing: Boolean(novoParceiro.aceiteMarketing),

        responsavelLegal: novoParceiro.responsavelLegal
          ? novoParceiro.responsavelLegal.trim()
          : null,

        responsavelLegalCpf: novoParceiro.responsavelLegalCpf
          ? somenteNumeros(novoParceiro.responsavelLegalCpf)
          : null,

        cep: somenteNumeros(novoParceiro.cep),
        logradouro: novoParceiro.logradouro.trim(),
        numero: novoParceiro.numero.trim(),
        cidade: novoParceiro.cidade.trim(),
        bairro: novoParceiro.bairro.trim(),
        estado: novoParceiro.estado || "",
        complemento: novoParceiro.complemento
          ? novoParceiro.complemento.trim()
          : null,

        categoria: Number(novoParceiro.categoria) || 1,

        expectativaGeracao:
          Number(novoParceiro.expectativaGeracao) || 0,

        capacidadeBombona:
          Number(novoParceiro.capacidadeBombona) || 0,

        // ------------------------------------------------
        // CONTATO / REDES — só INSTITUCIONAL
        // ------------------------------------------------
        redesSociais: enviarComunicacao
          ? novoParceiro.redesSociais || []
          : [],

        site:
          enviarComunicacao && novoParceiro.site
            ? novoParceiro.site.trim()
            : null,

        aceiteDivulgacao: enviarComunicacao
          ? Boolean(novoParceiro.aceiteDivulgacao)
          : false,

        // ------------------------------------------------
        // COMO CONHECEU
        // ------------------------------------------------
        parceiroIndicadorId: temIndicador
          ? Number(novoParceiro.parceiroIndicadorId)
          : null,

        outroParceiro: novoParceiro.outroParceiro
          ? novoParceiro.outroParceiro.trim()
          : null,

        comoConheceu: temIndicador
          ? "Parceiro Indicador"
          : "Criado pelo Administrador",

        observacao: novoParceiro.observacao
          ? novoParceiro.observacao.trim()
          : "",

        // ------------------------------------------------
        // LOCALIZAÇÃO
        // ------------------------------------------------
        longitude: Number(novoParceiro.longitude) || 0,
        latitude: Number(novoParceiro.latitude) || 0,

        statusAprovacaoParceiro: "APROVADO",
      };

      await onSubmit(payloadFinal);

      // Reset
      setNovoParceiro(NOVO_PARCEIRO_INICIAL);
      setSelectedRede(null);
      setRedeValue("");
      setCurrentStep(1);
      setEmailDisponivel(null);
      setDocumentoDisponivel(null);
      onClose();
    } catch (error: any) {
      console.error(
        "Erro detalhado da API ao salvar parceiro:",
        error.response?.data || error
      );

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

  // ==========================================================
  // FECHAR
  // ==========================================================

  const handleClose = () => {
    if (loading) return;

    setNovoParceiro(NOVO_PARCEIRO_INICIAL);
    setErroFormulario(null);
    setSelectedRede(null);
    setRedeValue("");
    setEmailDisponivel(null);
    setDocumentoDisponivel(null);
    setCurrentStep(1);
    onClose();
  };

  // ==========================================================
  // PASSO 1
  // ==========================================================

  const renderPasso1 = () => {
    const categoriasPermitidas = getCategoriasPermitidas();
    const tipoSelecionado = novoParceiro.tipoParceiro;

    return (
      <div className="space-y-4">

        {/* ================================================= */}
        {/* DADOS DE ACESSO */}
        {/* ================================================= */}

        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* EMAIL */}
            <label className="block">
              <span className="text-xs text-white-600 font-medium mb-1 block">
                E-mail de Acesso *
              </span>

              <Input
                type="email"
                value={novoParceiro.email}
                onChange={(e) =>
                  atualizarCampo("email", e.target.value)
                }
                placeholder="nome@exemplo.com"
                disabled={loading || verificandoDisponibilidade}
              />

              {emailDisponivel === true && (
                <span className="text-[11px] text-green-primary mt-1 block">
                  E-mail disponível.
                </span>
              )}

              {emailDisponivel === false && (
                <span className="text-[11px] text-red-primary mt-1 block">
                  Este e-mail já está cadastrado.
                </span>
              )}
            </label>

            {/* SENHA */}
            <label className="block">
              <span className="text-xs text-white-600 font-medium mb-1 block">
                Senha *
              </span>

              <Input
                type="password"
                value={novoParceiro.senha}
                onChange={(e) =>
                  atualizarCampo("senha", e.target.value)
                }
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
            </label>
          </div>

          {/* ================================================= */}
          {/* TIPO DE PESSOA + DOCUMENTO */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

            <label className="block">
              <span className="text-xs text-white-600 font-medium">
                Tipo de Pessoa *
              </span>

              <select
                value={novoParceiro.tipoPessoa}
                onChange={(e) =>
                  atualizarCampo("tipoPessoa", e.target.value)
                }
                className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
                required
              >
                <option value="">Selecionar</option>
                <option value="FISICA">Física</option>
                <option value="JURIDICA">Jurídica</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-white-600 font-medium">
                {novoParceiro.tipoPessoa === "JURIDICA"
                  ? "CNPJ *"
                  : "CPF *"}
              </span>

              <input
                type="text"
                inputMode="numeric"
                value={novoParceiro.documento}
                onChange={(e) => {
                  const valorMascarado = mascaraDocumento(
                    e.target.value,
                    novoParceiro.tipoPessoa
                  );
                  atualizarCampo("documento", valorMascarado);
                }}
                placeholder={
                  novoParceiro.tipoPessoa === "JURIDICA"
                    ? "00.000.000/0000-00"
                    : "000.000.000-00"
                }
                maxLength={
                  novoParceiro.tipoPessoa === "JURIDICA" ? 18 : 14
                }
                className={`w-full bg-white border rounded-xl p-2.5 mt-1 text-sm focus:outline-none ${
                  documentoDisponivel === false
                    ? "border-red-primary"
                    : documentoDisponivel === true
                    ? "border-green-primary"
                    : "border-white-200 focus:border-green-primary"
                }`}
                disabled={loading || verificandoDisponibilidade}
                required
              />

              {documentoDisponivel === true && (
                <span className="text-[11px] text-green-primary mt-1 block">
                  {novoParceiro.tipoPessoa === "JURIDICA"
                    ? "CNPJ disponível."
                    : "CPF disponível."}
                </span>
              )}

              {documentoDisponivel === false && (
                <span className="text-[11px] text-red-primary mt-1 block">
                  {novoParceiro.tipoPessoa === "JURIDICA"
                    ? "CNPJ já cadastrado."
                    : "CPF já cadastrado."}
                </span>
              )}
            </label>
          </div>

          {/* ================================================= */}
          {/* PF/PJ */}
          {/* ================================================= */}

          {novoParceiro.tipoPessoa === "JURIDICA" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="block sm:col-span-2">
                <span className="text-xs text-white-600 font-medium">
                  Razão Social *
                </span>

                <input
                  type="text"
                  value={novoParceiro.razaoSocial}
                  onChange={(e) =>
                    atualizarCampo("razaoSocial", e.target.value)
                  }
                  placeholder="Razão Social"
                  className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs text-white-600 font-medium">
                  Nome Fantasia
                </span>

                <input
                  type="text"
                  value={novoParceiro.nome || ""}
                  onChange={(e) =>
                    atualizarCampo("nome", e.target.value)
                  }
                  placeholder="Nome Fantasia"
                  className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />
              </label>
            </div>
          ) : (
            <div className="pt-1">
              <label className="block">
                <span className="text-xs text-white-600 font-medium">
                  Nome Completo *
                </span>

                <input
                  type="text"
                  value={novoParceiro.nome || ""}
                  onChange={(e) =>
                    atualizarCampo("nome", e.target.value)
                  }
                  placeholder="Nome completo"
                  className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                  required
                />
              </label>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* TIPO PARCEIRO */}
        {/* ================================================= */}

        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-2">
          <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
            Tipo de Parceiro *
          </h3>

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
                    <span className="text-xs font-semibold block text-black-primary">
                      {labelMap[tipo]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================= */}
        {/* CATEGORIA */}
        {/* ================================================= */}

        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-2">
          <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
            Categoria do Estabelecimento *
          </h3>

          {!tipoSelecionado ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              Selecione o tipo de parceiro acima para habilitar as
              categorias correspondentes.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {categoriasPermitidas.map(({ value, label }) => {
                const categoriaId = Number(value);
                const selecionada =
                  Number(novoParceiro.categoria) === categoriaId;

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
                      {CATEGORIA_ICON_MAP[categoriaId] || (
                        <Building2 className="w-5 h-5 text-white-400" />
                      )}
                    </div>

                    <span className="text-xs font-medium text-black-primary leading-tight">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* RESPONSÁVEL & OPERAÇÃO */}
        {/* ================================================= */}

        <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
          <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
            Responsável & Operação
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* RESPONSÁVEL */}
            <label className="block w-full">
              <span className="text-xs text-white-600 font-medium">
                Nome do Responsável Legal
              </span>

              <input
                type="text"
                value={novoParceiro.responsavelLegal || ""}
                onChange={(e) =>
                  atualizarCampo("responsavelLegal", e.target.value)
                }
                placeholder="Nome completo"
                className="w-full h-10 bg-white border border-white-200 rounded-xl px-3 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>

            {/* CPF RESPONSÁVEL */}
            <label className="block w-full">
              <span className="text-xs text-white-600 font-medium">
                CPF do Responsável Legal
              </span>

              <input
                type="text"
                inputMode="numeric"
                value={novoParceiro.responsavelLegalCpf || ""}
                onChange={(e) =>
                  atualizarCampo(
                    "responsavelLegalCpf",
                    mascaraCPFResponsavel(e.target.value)
                  )
                }
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full h-10 bg-white border border-white-200 rounded-xl px-3 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>

            {/* CAPACIDADE DA BOMBONA */}
            <label className="block w-full">
              <span className="text-xs text-white-600 font-medium">
                Capacidade da Bombona (Litros)
              </span>

              <input
                type="number"
                min={0}
                value={novoParceiro.capacidadeBombona ?? ""}
                onChange={(e) => {
                  const valor = e.target.value;
                  atualizarCampo(
                    "capacidadeBombona",
                    valor === "" ? "" : Number(valor)
                  );
                }}
                placeholder="0"
                className="w-full h-10 bg-white border border-white-200 rounded-xl px-3 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>

            {/* EXPECTATIVA DE GERAÇÃO */}
            <label className="block w-full">
              <span className="text-xs text-white-600 font-medium">
                Expectativa de Geração (Litros/Mês)
              </span>

              <input
                type="number"
                min={0}
                value={novoParceiro.expectativaGeracao ?? ""}
                onChange={(e) => {
                  const valor = e.target.value;
                  atualizarCampo(
                    "expectativaGeracao",
                    valor === "" ? "" : Number(valor)
                  );
                }}
                placeholder="0"
                className="w-full h-10 bg-white border border-white-200 rounded-xl px-3 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {/* PARCEIRO INDICADOR */}
        <div className="pt-1">
          <label className="block">
            <span className="text-xs text-white-600 font-medium">
              Parceiro Indicador (Opcional)
            </span>

            <select
              value={novoParceiro.parceiroIndicadorId?.toString() || ""}
              onChange={(e) => {
                const val = e.target.value;
                atualizarCampo(
                  "parceiroIndicadorId",
                  val ? Number(val) : null
                );
              }}
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            >
              <option value="">
                Nenhum (Criado pelo Administrador)
              </option>

              {indicadores &&
                indicadores.map((ind) => (
                  <option key={ind.id} value={String(ind.id)}>
                    {ind.nome}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  // ==========================================================
  // PASSO 2
  // ==========================================================

  const renderPasso2 = () => (
    <div className="space-y-4">

      {/* =================================================== */}
      {/* ENDEREÇO */}
      {/* =================================================== */}

      <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
        <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
          Endereço do Ponto de Coleta
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-white-600 font-medium">CEP</span>
            <input
              type="text"
              inputMode="numeric"
              value={novoParceiro.cep}
              onChange={(e) =>
                atualizarCampo("cep", mascaraCEP(e.target.value))
              }
              placeholder="00000-000"
              maxLength={9}
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs text-white-600 font-medium">
              Logradouro
            </span>
            <input
              type="text"
              value={novoParceiro.logradouro}
              onChange={(e) =>
                atualizarCampo("logradouro", e.target.value)
              }
              placeholder="Rua, Avenida..."
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs text-white-600 font-medium">
              Número *
            </span>
            <input
              type="text"
              value={novoParceiro.numero}
              onChange={(e) => atualizarCampo("numero", e.target.value)}
              placeholder="123"
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
              required
            />
          </label>

          <label className="block sm:col-span-3">
            <span className="text-xs text-white-600 font-medium">
              Complemento
            </span>
            <input
              type="text"
              value={novoParceiro.complemento || ""}
              onChange={(e) =>
                atualizarCampo("complemento", e.target.value)
              }
              placeholder="Apto, Sala, Bloco..."
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
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
              onChange={(e) =>
                atualizarCampo("bairro", e.target.value)
              }
              placeholder="Bairro"
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="text-xs text-white-600 font-medium">Cidade</span>
            <input
              type="text"
              value={novoParceiro.cidade}
              onChange={(e) =>
                atualizarCampo("cidade", e.target.value)
              }
              placeholder="Cidade"
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="text-xs text-white-600 font-medium">Estado</span>
            <select
              value={novoParceiro.estado || ""}
              onChange={(e) =>
                atualizarCampo("estado", e.target.value)
              }
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
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

        {/* MAPA */}
        <div className="pt-2">
          <span className="text-xs text-white-600 font-medium block mb-1">
            Localização no Mapa (Ajuste o pin se necessário)
          </span>

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

      {/* =================================================== */}
      {/* CONTATO & REDES */}
      {/* =================================================== */}

      <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
        <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">
          Contato & Redes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* TELEFONE */}
          <label className="block">
            <span className="text-xs text-white-600 font-medium">
              Telefone
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={novoParceiro.telefone || ""}
              onChange={(e) =>
                atualizarCampo(
                  "telefone",
                  mascaraTelefone(e.target.value)
                )
              }
              placeholder="(77) 99999-9999"
              maxLength={15}
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            />
          </label>

          {/* SITE (só institucional) */}
          {isInstitucional && (
            <label className="block">
              <span className="text-xs text-white-600 font-medium">
                Site
              </span>
              <input
                type="text"
                value={novoParceiro.site || ""}
                onChange={(e) =>
                  atualizarCampo("site", e.target.value)
                }
                placeholder="https://..."
                className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary"
                disabled={loading}
              />
            </label>
          )}
        </div>

        {/* ================================================= */}
        {/* REDES SOCIAIS (só institucional) */}
        {/* ================================================= */}

        {isInstitucional && (
          <div className="pt-1 space-y-2">
            <span className="text-xs text-white-600 font-medium block">
              Redes Sociais
            </span>

            {/* Seleção da rede */}
            <select
              value={selectedRede || ""}
              onChange={(e) => handleSelectRede(e.target.value)}
              className="w-full bg-white border border-white-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-green-primary"
              disabled={loading}
            >
              <option value="">Selecione a rede social</option>
              {REDES_OPCOES.map((rede) => (
                <option key={rede.value} value={rede.value}>
                  {rede.label}
                </option>
              ))}
            </select>

            {/* Input do @ ou link */}
            {selectedRede && (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={redeValue}
                  onChange={(e) => setRedeValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarRedeSocial();
                    }
                  }}
                  placeholder={getPlaceholderInput()}
                  className="flex-1 bg-white border border-white-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-green-primary"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={adicionarRedeSocial}
                  className="px-3 rounded-xl border border-green-primary text-green-primary text-sm hover:bg-green-100 transition-colors cursor-pointer"
                  disabled={loading}
                  title="Adicionar rede social"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Redes adicionadas */}
            {novoParceiro.redesSociais &&
              novoParceiro.redesSociais.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-white-500">
                    Redes adicionadas
                  </span>

                  {novoParceiro.redesSociais.map((rede, i) => (
                    <div
                      key={`${rede.tipo}-${rede.valor}-${i}`}
                      className="flex items-center justify-between gap-2 bg-white border border-white-200 rounded-xl px-3 py-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-green-primary">
                          {getRedeLabel(rede.tipo)}
                        </span>
                        <span className="text-xs text-black-primary truncate">
                          {rede.valor}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerRedeSocial(i)}
                        className="text-red-primary hover:opacity-70 transition-opacity cursor-pointer"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ================================================= */}
        {/* ACEITES */}
        {/* ================================================= */}

        <div className="space-y-2 pt-2 border-t border-white-200/60">
          <div
            className={`flex items-center gap-2 ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <Checkbox
              id="aceiteMarketing"
              checked={Boolean(novoParceiro.aceiteMarketing)}
              onChange={(checked) =>
                atualizarCampo("aceiteMarketing", checked)
              }
            />

            <label
              htmlFor="aceiteMarketing"
              className="text-xs text-white-600 cursor-pointer"
            >
              Aceita receber comunicações de marketing
            </label>
          </div>

          {/* Aceite de divulgação só INSTITUCIONAL */}
          {isInstitucional && (
            <div
              className={`flex items-center gap-2 ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <Checkbox
                id="aceiteDivulgacao"
                checked={Boolean(novoParceiro.aceiteDivulgacao)}
                onChange={(checked) =>
                  atualizarCampo("aceiteDivulgacao", checked)
                }
              />

              <label
                htmlFor="aceiteDivulgacao"
                className="text-xs text-white-600 cursor-pointer"
              >
                Aceita divulgação
              </label>
            </div>
          )}
        </div>

        {/* OBSERVAÇÃO */}
        <label className="block pt-1">
          <span className="text-xs text-white-600 font-medium">
            Observação
          </span>

          <textarea
            value={novoParceiro.observacao || ""}
            onChange={(e) =>
              atualizarCampo("observacao", e.target.value)
            }
            placeholder="Observações adicionais..."
            rows={2}
            className="w-full bg-white border border-white-200 rounded-xl p-2.5 mt-1 text-sm focus:outline-none focus:border-green-primary resize-none"
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto">

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
          <div>
            <h2 className="font-bold text-xl text-green-primary">
              Adicionar Parceiro
            </h2>
            <p className="text-xs text-white-500">
              Cadastro administrativo - Etapa {currentStep} de 2
            </p>
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

        {/* PROGRESSO */}
        <div className="mb-6">
          <ProgressBar step={currentStep} totalSteps={2} />
        </div>

        {/* ERRO */}
        {erroFormulario && (
          <div className="mb-4 rounded-lg border border-red-primary/30 bg-red-50 px-3 py-2 text-xs text-red-primary">
            {erroFormulario}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="min-h-[380px]">
            {currentStep === 1 ? renderPasso1() : renderPasso2()}
          </div>

          {/* BOTÕES */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-white-100">
            {currentStep === 2 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={passoAnterior}
                disabled={loading}
                fullWidth={false}
                className="flex-1"
              >
                Voltar
              </Button>
            )}

            {currentStep === 1 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={proximoPasso}
                disabled={loading || verificandoDisponibilidade}
                loading={verificandoDisponibilidade}
                fullWidth={false}
                className="flex-1 ml-auto"
              >
                {verificandoDisponibilidade ? "Verificando..." : "Próximo"}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                disabled={loading}
                fullWidth={false}
                className="flex-1"
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