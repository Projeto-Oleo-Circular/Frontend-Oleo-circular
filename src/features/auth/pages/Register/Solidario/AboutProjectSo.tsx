import { useEffect, useMemo, useState } from "react";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Button from "../../../../../components/ui/Button";
import Input from "../../../../../components/ui/Input";
import { authService } from "../../../../../services/authService";

interface Props {
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
  userName?: string;
  onDataChange?: (data: any) => void;
  initialData?: any;
  onSubmit?: () => Promise<void>;
  loading?: boolean;
}

type TipoOrigem = "PARCEIRO" | "CANAL";

interface OpcaoComoConheceu {
  id: string;
  label: string;
  tipo: TipoOrigem;
  parceiroId?: number;
  descricao?: string;
}

/**
 * Opções fixas de como o usuário pode
 * ter conhecido o projeto.
 */
const CANAIS_COMO_CONHECEU: OpcaoComoConheceu[] = [
  {
    id: "google",
    label: "Google",
    tipo: "CANAL",
    descricao: "Pesquisa no Google",
  },
  {
    id: "bing",
    label: "Bing",
    tipo: "CANAL",
    descricao: "Pesquisa no Bing",
  },
  {
    id: "outro_buscador",
    label: "Outro site de busca",
    tipo: "CANAL",
    descricao: "Outro mecanismo de pesquisa",
  },

  {
    id: "instagram",
    label: "Instagram",
    tipo: "CANAL",
    descricao: "Rede social",
  },
  {
    id: "facebook",
    label: "Facebook",
    tipo: "CANAL",
    descricao: "Rede social",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    tipo: "CANAL",
    descricao: "Rede social",
  },
  {
    id: "tiktok",
    label: "TikTok",
    tipo: "CANAL",
    descricao: "Rede social",
  },
  {
    id: "youtube",
    label: "YouTube",
    tipo: "CANAL",
    descricao: "Rede social",
  },
  {
    id: "x",
    label: "X (Twitter)",
    tipo: "CANAL",
    descricao: "Rede social",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    tipo: "CANAL",
    descricao: "Mensagem, grupo ou comunidade",
  },
  {
    id: "telegram",
    label: "Telegram",
    tipo: "CANAL",
    descricao: "Mensagem, grupo ou comunidade",
  },

  {
    id: "indicacao_amigo",
    label: "Indicação de amigo ou conhecido",
    tipo: "CANAL",
    descricao: "Indicação pessoal",
  },
  {
    id: "empresa",
    label: "Empresa onde trabalho",
    tipo: "CANAL",
    descricao: "Ambiente profissional",
  },
  {
    id: "escola_faculdade",
    label: "Escola, faculdade ou universidade",
    tipo: "CANAL",
    descricao: "Instituição de ensino",
  },
  {
    id: "evento",
    label: "Evento, palestra ou feira",
    tipo: "CANAL",
    descricao: "Evento presencial ou online",
  },
  {
    id: "site",
    label: "Outro site ou portal",
    tipo: "CANAL",
    descricao: "Site ou portal da internet",
  },
  {
    id: "radio",
    label: "Rádio",
    tipo: "CANAL",
    descricao: "Divulgação em rádio",
  },
  {
    id: "tv",
    label: "Televisão",
    tipo: "CANAL",
    descricao: "Divulgação em televisão",
  },
  {
    id: "jornal",
    label: "Jornal ou revista",
    tipo: "CANAL",
    descricao: "Mídia impressa ou digital",
  },
  {
    id: "material_impresso",
    label: "Panfleto, cartaz ou material impresso",
    tipo: "CANAL",
    descricao: "Material de divulgação",
  },
  {
    id: "outro",
    label: "Outro",
    tipo: "CANAL",
    descricao: "Outra forma",
  },
];

/**
 * Remove acentos e deixa o texto em minúsculo
 * para facilitar a pesquisa.
 */
const normalizarTexto = (texto: string) => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

function AboutProjectIns({
  onNext,
  onBack,
  step,
  totalSteps,
  userName = "Usuário",
  onDataChange,
  initialData = {},
  onSubmit,
  loading = false,
}: Props) {
  const [opcoesParceiros, setOpcoesParceiros] = useState<
    OpcaoComoConheceu[]
  >([]);

  const [loadingParceiros, setLoadingParceiros] =
    useState<boolean>(true);

  const [busca, setBusca] = useState<string>("");

  const [mostrarLista, setMostrarLista] =
    useState<boolean>(false);

  const [opcaoSelecionada, setOpcaoSelecionada] =
    useState<OpcaoComoConheceu | null>(null);

  const [detalheOutro, setDetalheOutro] =
    useState<string>("");

  const [observation, setObservation] =
    useState<string>(
      typeof initialData.observacao === "string"
        ? initialData.observacao
        : ""
    );

  const [fieldError, setFieldError] =
    useState<string>("");

  /**
   * Carrega os parceiros indicadores.
   */
  useEffect(() => {
    const carregarParceiros = async () => {
      try {
        setLoadingParceiros(true);

        const parceiros =
          await authService.listarParceirosIndicadores();

        const parceirosFormatados: OpcaoComoConheceu[] =
          parceiros.map((parceiro: any) => ({
            id: `parceiro-${parceiro.id}`,
            label:
              parceiro.nome ||
              parceiro.nomeFantasia ||
              parceiro.razaoSocial ||
              `Parceiro ${parceiro.id}`,
            tipo: "PARCEIRO",
            parceiroId: Number(parceiro.id),
            descricao:
              "Parceiro indicador do Óleo Circular",
          }));

        setOpcoesParceiros(parceirosFormatados);
      } catch (error) {
        console.error(
          "Erro ao carregar parceiros indicadores:",
          error
        );

        setOpcoesParceiros([]);
      } finally {
        setLoadingParceiros(false);
      }
    };

    carregarParceiros();
  }, []);

  /**
   * Junta parceiros da API com os canais fixos.
   */
  const todasOpcoes = useMemo(() => {
    return [
      ...opcoesParceiros,
      ...CANAIS_COMO_CONHECEU,
    ];
  }, [opcoesParceiros]);

  /**
   * Restaura seleção caso o usuário volte
   * para esta etapa do cadastro.
   */
  useEffect(() => {
    if (opcaoSelecionada) {
      return;
    }

    /**
     * Caso tenha escolhido parceiro indicador.
     */
    if (initialData.parceiroIndicadorId) {
      const parceiroId = Number(
        initialData.parceiroIndicadorId
      );

      const parceiroEncontrado =
        opcoesParceiros.find(
          (opcao) =>
            opcao.tipo === "PARCEIRO" &&
            opcao.parceiroId === parceiroId
        );

      if (parceiroEncontrado) {
        setOpcaoSelecionada(parceiroEncontrado);
        setBusca(parceiroEncontrado.label);
        return;
      }
    }

    /**
     * Caso tenha escolhido um canal.
     */
    if (
      typeof initialData.comoConheceu === "string" &&
      initialData.comoConheceu.trim()
    ) {
      const comoConheceu =
        initialData.comoConheceu.trim();

      const comoConheceuNormalizado =
        normalizarTexto(comoConheceu);

      /**
       * Tenta descobrir qual opção foi selecionada
       * anteriormente.
       */
      const canalEncontrado =
        CANAIS_COMO_CONHECEU.find((canal) => {
          const label =
            normalizarTexto(canal.label);

          return (
            comoConheceuNormalizado === label ||
            comoConheceuNormalizado.startsWith(
              `${label}:`
            )
          );
        });

      if (canalEncontrado) {
        setOpcaoSelecionada(canalEncontrado);
        setBusca(canalEncontrado.label);

        /**
         * Recupera a parte depois de ":"
         * Ex:
         *
         * "Outro site de busca: DuckDuckGo"
         *
         * detalheOutro = "DuckDuckGo"
         */
        const separatorIndex =
          comoConheceu.indexOf(":");

        if (separatorIndex !== -1) {
          setDetalheOutro(
            comoConheceu
              .slice(separatorIndex + 1)
              .trim()
          );
        }

        return;
      }
    }

    /**
     * Compatibilidade com dado antigo.
     */
    if (
      typeof initialData.outroParceiro === "string" &&
      initialData.outroParceiro.trim()
    ) {
      const opcaoOutro =
        CANAIS_COMO_CONHECEU.find(
          (opcao) => opcao.id === "outro"
        );

      if (opcaoOutro) {
        setOpcaoSelecionada(opcaoOutro);
        setBusca(opcaoOutro.label);
        setDetalheOutro(
          initialData.outroParceiro.trim()
        );
      }
    }
  }, [
    initialData,
    opcoesParceiros,
    opcaoSelecionada,
  ]);

  /**
   * Pesquisa.
   */
  const opcoesFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) {
      return todasOpcoes;
    }

    return todasOpcoes.filter((opcao) => {
      const texto = normalizarTexto(
        `${opcao.label} ${opcao.descricao || ""}`
      );

      return texto.includes(termo);
    });
  }, [busca, todasOpcoes]);

  /**
   * Separa os resultados para exibir
   * em categorias.
   */
  const parceirosFiltrados =
    opcoesFiltradas.filter(
      (opcao) => opcao.tipo === "PARCEIRO"
    );

  const canaisFiltrados =
    opcoesFiltradas.filter(
      (opcao) => opcao.tipo === "CANAL"
    );

  /**
   * Seleciona uma opção.
   */
  const selecionarOpcao = (
    opcao: OpcaoComoConheceu
  ) => {
    setOpcaoSelecionada(opcao);

    setBusca(opcao.label);

    setMostrarLista(false);

    setFieldError("");

    /**
     * Limpa detalhe se ele não for necessário.
     */
    if (
      opcao.id !== "outro" &&
      opcao.id !== "outro_buscador" &&
      opcao.id !== "site"
    ) {
      setDetalheOutro("");
    }
  };

  /**
   * Limpa a seleção e permite pesquisar novamente.
   */
  const limparSelecao = () => {
    setOpcaoSelecionada(null);

    setBusca("");

    setDetalheOutro("");

    setFieldError("");

    setMostrarLista(true);
  };

  /**
   * Verifica se a opção exige texto adicional.
   */
  const precisaDetalhar =
    opcaoSelecionada?.id === "outro" ||
    opcaoSelecionada?.id === "outro_buscador" ||
    opcaoSelecionada?.id === "site";

  const getPlaceholderDetalhe = () => {
    switch (opcaoSelecionada?.id) {
      case "outro_buscador":
        return "Qual site de busca você utilizou?";

      case "site":
        return "Qual site ou portal?";

      case "outro":
        return "Conte como conheceu o projeto";

      default:
        return "Informe mais detalhes";
    }
  };

  /**
   * Validação.
   */
  const validateForm = (): boolean => {
    if (!opcaoSelecionada) {
      setFieldError(
        "Selecione como você conheceu o Óleo Circular"
      );

      return false;
    }

    if (
      precisaDetalhar &&
      !detalheOutro.trim()
    ) {
      setFieldError(
        "Informe mais detalhes para continuar"
      );

      return false;
    }

    setFieldError("");

    return true;
  };

  /**
   * Avança para próxima etapa.
   */
  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    if (!opcaoSelecionada) {
      return;
    }

    const isParceiro =
      opcaoSelecionada.tipo === "PARCEIRO";

    let comoConheceu = "";

    /**
     * Se for parceiro, mantemos o ID em
     * parceiroIndicadorId.
     */
    if (isParceiro) {
      comoConheceu = "Parceiro indicador";
    } else {
      comoConheceu =
        opcaoSelecionada.label;

      if (
        precisaDetalhar &&
        detalheOutro.trim()
      ) {
        comoConheceu =
          `${opcaoSelecionada.label}: ${detalheOutro.trim()}`;
      }
    }

    /**
     * Payload enviado para o componente pai.
     */
    onDataChange?.({
      parceiroIndicadorId:
        isParceiro &&
        opcaoSelecionada.parceiroId
          ? opcaoSelecionada.parceiroId
          : null,

      outroParceiro: null,

      comoConheceu,

      observacao: observation.trim(),
    });
      if (onSubmit) {
            try {
              await onSubmit();
              onNext(); // Só avança para o feedback se der certo
            } catch (err) {
              // O erro já é tratado no toast pelo Register, aqui apenas evitamos avançar
              console.error("Falha ao registrar:", err);
            }
          } else {
            onNext();
          }
        };

  return (
    <div className="flex flex-col h-screen">
      <HeaderCadastro
        title="Criar Conta"
        onBack={onBack}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* IMAGEM */}
        <aside className="hidden md:flex md:w-1/2 bg-[#1b6b3b] relative overflow-hidden">
          <img 
            src="/assets/imagem-lateral-parceiro.png" 
            alt="Projeto Óleo Circular" 
            className="absolute bottom-0 left-0 w-auto h-full max-h-full object-contain object-left-bottom" 
          />
        </aside>

        {/* FORMULÁRIO */}
        <main
          className="
            flex
            flex-col
            w-full
            md:w-1/2
            px-5
            sm:px-8
            md:px-12
            bg-background
            overflow-y-auto
          "
        >
          <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">
            <h1
              className="
                text-lg
                sm:text-xl
                md:text-2xl
                font-bold
                text-green-primary
              "
            >
              Bem-vindo(a), {userName}!
            </h1>

            <p
              className="
                text-sm
                sm:text-base
                font-medium
                text-white-500
              "
            >
              Conte para nós como você conheceu o
              Óleo Circular.
            </p>
          </div>

          <ProgressBar
            step={step}
            totalSteps={totalSteps}
          />

          <div className="w-full pb-4">
            <p
              className="
                text-xs
                font-extrabold
                text-white-500
                tracking-widest
                py-4
              "
            >
              COMO CONHECEU O ÓLEO CIRCULAR
            </p>

            <div className="flex flex-col gap-4 mb-6">

              {/* BUSCADOR */}
              <div className="relative">
                <div
                  className={`
                    flex
                    items-center
                    bg-white
                    rounded-xl
                    border
                    transition-colors

                    ${
                      fieldError
                        ? "border-red-500"
                        : "border-white-200 focus-within:border-green-primary"
                    }
                  `}
                >
                <div
  className="flex-1"
  onClick={() => setMostrarLista(true)}
>
  <Input
    type="text"
    name="buscaComoConheceu"
    value={busca}
    onChange={(e) => {
      setBusca(e.target.value);

      if (opcaoSelecionada) {
        setOpcaoSelecionada(null);
      }

      setMostrarLista(true);
      setFieldError("");
    }}
    placeholder="Pesquisar parceiro, Google, Instagram..."
    noBorder
  />
</div>

                  {opcaoSelecionada && (
                    <button
                      type="button"
                      onClick={limparSelecao}
                      className="
                        flex
                        items-center
                        justify-center
                        px-4
                        h-full
                        text-black-100
                        hover:text-red-500
                        transition-colors
                      "
                      aria-label="Limpar seleção"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {fieldError && (
                  <p
                    className="
                      text-red-500
                      text-xs
                      mt-1
                      font-medium
                    "
                  >
                    {fieldError}
                  </p>
                )}

                {/* LISTA DE RESULTADOS */}
                {mostrarLista &&
                  !opcaoSelecionada && (
                    <div
                      className="
                        absolute
                        z-50
                        mt-2
                        w-full
                        max-h-80
                        overflow-y-auto
                        bg-white
                        rounded-xl
                        shadow-lg
                        border
                        border-white-200
                      "
                    >
                      {loadingParceiros && (
                        <div
                          className="
                            px-4
                            py-3
                            text-sm
                            text-black-100
                          "
                        >
                          Carregando parceiros...
                        </div>
                      )}

                      {/* PARCEIROS */}
                      {parceirosFiltrados.length >
                        0 && (
                        <div>
                          <div
                            className="
                              sticky
                              top-0
                              z-10
                              bg-white
                              px-4
                              py-2
                              text-xs
                              font-extrabold
                              text-green-primary
                              tracking-wider
                              border-b
                              border-white-200
                            "
                          >
                            PARCEIROS INDICADORES
                          </div>

                          {parceirosFiltrados.map(
                            (opcao) => (
                              <button
                                type="button"
                                key={opcao.id}
                                onClick={() =>
                                  selecionarOpcao(
                                    opcao
                                  )
                                }
                                className="
                                  w-full
                                  flex
                                  flex-col
                                  items-start
                                  text-left
                                  px-4
                                  py-3
                                  hover:bg-green-50
                                  transition-colors
                                  border-b
                                  border-white-100
                                "
                              >
                                <span
                                  className="
                                    text-sm
                                    font-semibold
                                    text-black-primary
                                  "
                                >
                                  {opcao.label}
                                </span>

                                <span
                                  className="
                                    text-xs
                                    text-black-100
                                    mt-0.5
                                  "
                                >
                                  Parceiro indicador
                                </span>
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {/* OUTRAS FORMAS */}
                      {canaisFiltrados.length >
                        0 && (
                        <div>
                          <div
                            className="
                              sticky
                              top-0
                              z-10
                              bg-white
                              px-4
                              py-2
                              text-xs
                              font-extrabold
                              text-green-primary
                              tracking-wider
                              border-b
                              border-white-200
                            "
                          >
                            OUTRAS FORMAS
                          </div>

                          {canaisFiltrados.map(
                            (opcao) => (
                              <button
                                type="button"
                                key={opcao.id}
                                onClick={() =>
                                  selecionarOpcao(
                                    opcao
                                  )
                                }
                                className="
                                  w-full
                                  flex
                                  flex-col
                                  items-start
                                  text-left
                                  px-4
                                  py-3
                                  hover:bg-green-50
                                  transition-colors
                                  border-b
                                  border-white-100
                                "
                              >
                                <span
                                  className="
                                    text-sm
                                    font-semibold
                                    text-black-primary
                                  "
                                >
                                  {opcao.label}
                                </span>

                                {opcao.descricao && (
                                  <span
                                    className="
                                      text-xs
                                      text-black-100
                                      mt-0.5
                                    "
                                  >
                                    {opcao.descricao}
                                  </span>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {!loadingParceiros &&
                        opcoesFiltradas.length ===
                          0 && (
                          <div
                            className="
                              px-4
                              py-5
                              text-center
                              text-sm
                              text-black-100
                            "
                          >
                            Nenhuma opção encontrada.
                          </div>
                        )}
                    </div>
                  )}
              </div>

              {/* OPÇÃO SELECIONADA */}
              {opcaoSelecionada && (
                <div
                  className="
                    bg-white
                    rounded-xl
                    px-4
                    py-3
                    border
                    border-green-primary
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <p
                        className="
                          text-xs
                          text-black-100
                          mb-1
                        "
                      >
                        Você selecionou
                      </p>

                      <p
                        className="
                          text-sm
                          font-bold
                          text-green-primary
                        "
                      >
                        {opcaoSelecionada.label}
                      </p>

                      <p
                        className="
                          text-xs
                          text-black-100
                          mt-1
                        "
                      >
                        {opcaoSelecionada.tipo ===
                        "PARCEIRO"
                          ? "Parceiro indicador"
                          : opcaoSelecionada.descricao}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={limparSelecao}
                      className="
                        text-xs
                        font-semibold
                        text-green-primary
                        hover:underline
                      "
                    >
                      Alterar
                    </button>
                  </div>
                </div>
              )}

              {/* CAMPO ADICIONAL */}
              {precisaDetalhar && (
                <Input
                  type="text"
                  name="detalheOutro"
                  value={detalheOutro}
                  onChange={(e) => {
                    setDetalheOutro(
                      e.target.value
                    );

                    setFieldError("");
                  }}
                  placeholder={
                    getPlaceholderDetalhe()
                  }
                />
              )}

              {/* OBSERVAÇÃO */}
              <textarea
                name="observation"
                value={observation}
                onChange={(e) =>
                  setObservation(e.target.value)
                }
                placeholder="Quer deixar alguma observação? (opcional)"
                className="
                  w-full
                  bg-white
                  rounded-xl
                  border
                  border-white-200
                  px-4
                  py-3
                  text-sm
                  text-black-primary
                  outline-none
                  resize-none
                  h-28
                  placeholder:text-black-100
                  focus:border-green-primary
                  transition-colors
                  duration-200
                "
              />
            </div>

            {/* BOTÕES */}
            <div
              className="
                flex
                flex-col
                gap-3
                sm:gap-4
                mt-4
              "
            >
              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? "Cadastrando..." : "Concluir"}
              </Button>

              <Button
                type="button"
                onClick={onBack}
                variant="secondary"
                fullWidth
              >
                Voltar
              </Button>
            </div>
          </div>

          <p
            className="
              text-center
              text-xs
              text-black-100
              py-4
              sm:py-6
            "
          >
            © 2026 HS Tecnologia. Todos os
            direitos reservados.
          </p>
        </main>
      </div>
    </div>
  );
}

export default AboutProjectIns;