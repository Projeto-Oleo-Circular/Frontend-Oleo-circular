import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../components/layout/HeaderCadastro";
import Input from "../../../../components/ui/Input";
import { useState, type ChangeEvent } from "react";
import StepProfile from "./StepProfile";
import useToast from "../../../../hooks/useToast";
import {
  authService,
  type RegisterCredentials,
} from "../../../../services/authService";

import ComunicacaoIns from "./Instituicao/ComunicacaoIns";
import VolumeIns from "./Instituicao/VolumeIns";
import AboutProjectIns from "./Instituicao/AboutProjectIns";
import FeedbackIns from "./Instituicao/FeedbackIns";

import VolumeCt from "./Comunitario/VolumeCt";
import AboutProjectCt from "./Comunitario/AboutProjectCt";
import FeedbackCt from "./Comunitario/FeedbackCt";

import VolumeSo from "./Solidario/VolumeSo";
import AboutProjectSo from "./Solidario/AboutProjectSo";
import FeedbackSo from "./Solidario/FeedbackSo";

import InfoParceiro from "../../../../components/ui/InfoParceiro";
import Checkbox from "../../../../components/ui/Checkbox";
import Button from "../../../../components/ui/Button";

interface RedeSocial {
  tipo: string;
  valor: string;
}

interface AdditionalData {
  tipoPessoa: string;
  tipoParceiro: string;

  razaoSocial: string;
  nome: string;
  documento: string;

  redesSociais: RedeSocial[];

  aceiteMarketing: boolean;

  responsavelLegal: string;
  responsavelLegalCpf: string;

  parceiroIndicadorId: number | null;

  outroParceiro: string | null;
  comoConheceu: string;
  observacao: string;

  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;

  latitude: number;
  longitude: number;

  expectativaGeracao: number;
  capacidadeBombona: number;
  nivelAtualPct: number;
  statusBombona: string;

  categoria: number;
  criadoPorAdmin?: boolean;
}

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 11;
};

const STEPS: Record<string, string[]> = {
  institucional: [
    "profile",
    "info",
    "comunicacao",
    "volume",
    "about",
    "feedback",
  ],
  comunitario: ["profile", "info", "volume", "about", "feedback"],
  solidario: ["profile", "info", "volume", "about", "feedback"],
};

function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    aceiteMarketing: "",
  });

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
  });

  const [additionalData, setAdditionalData] =
    useState<AdditionalData>({
      tipoPessoa: "JURIDICA",
      tipoParceiro: "INSTITUCIONAL",

      razaoSocial: "",
      nome: "",
      documento: "",

      // CORRIGIDO: agora é array
      redesSociais: [],

      aceiteMarketing: false,

      responsavelLegal: "",
      responsavelLegalCpf: "",

      parceiroIndicadorId: null,
      outroParceiro: null,
      comoConheceu: "",
      observacao: "",

      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      complemento: "",
      latitude: 0,
      longitude: 0,

      expectativaGeracao: 0,
      capacidadeBombona: 0,
      nivelAtualPct: 0,
      statusBombona: "VAZIA",

      categoria: 0,
    });

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 11);

    if (limited.length <= 2) {
      return limited;
    }

    if (limited.length <= 6) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    }

    if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(
        2,
        6
      )}-${limited.slice(6)}`;
    }

    return `(${limited.slice(0, 2)}) ${limited.slice(
      2,
      7
    )}-${limited.slice(7, 11)}`;
  };

  const formatarRedesSociais = (redes: unknown): string[] => {
    if (!redes) {
      return [];
    }

    if (Array.isArray(redes)) {
      return redes
        .map((rede: any) => {
          if (typeof rede === "string") {
            return rede.trim();
          }

          if (
            rede &&
            typeof rede === "object" &&
            typeof rede.valor === "string"
          ) {
            const valor = rede.valor.trim();

            if (!valor) {
              return "";
            }

            const tipo =
              typeof rede.tipo === "string" && rede.tipo.trim()
                ? rede.tipo.trim()
                : "outra";

            return `${tipo}: ${valor}`;
          }

          return "";
        })
        .filter((rede): rede is string => Boolean(rede));
    }

    if (typeof redes === "string") {
      const valor = redes.trim();

      return valor ? [valor] : [];
    }

    return [];
  };

  const validateForm = () => {
    let hasError = false;

    const errors = {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      telefone: "",
      aceiteMarketing: "",
    };

    if (!formData.nome.trim()) {
      errors.nome = "Nome é obrigatório";
      hasError = true;
    }

    if (!formData.email.trim()) {
      errors.email = "E-mail é obrigatório";
      hasError = true;
    } else if (
      !formData.email.includes("@") ||
      !formData.email.includes(".")
    ) {
      errors.email = "E-mail inválido";
      hasError = true;
    }

    if (!formData.senha) {
      errors.senha = "Senha é obrigatória";
      hasError = true;
    } else if (formData.senha.length < 6) {
      errors.senha = "Senha deve ter no mínimo 6 caracteres";
      hasError = true;
    }

    if (!formData.confirmarSenha) {
      errors.confirmarSenha = "Confirme sua senha";
      hasError = true;
    } else if (formData.senha !== formData.confirmarSenha) {
      errors.confirmarSenha = "As senhas não coincidem";
      hasError = true;
    }

    if (!formData.telefone) {
      errors.telefone = "Telefone é obrigatório";
      hasError = true;
    } else if (!validatePhone(formData.telefone)) {
      errors.telefone = "Telefone inválido";
      hasError = true;
    }

    if (!additionalData.aceiteMarketing) {
      errors.aceiteMarketing =
        "Você precisa aceitar os Termos de Uso e Política de Privacidade";
      hasError = true;
    }

    setFieldErrors(errors);

    return !hasError;
  };

  const getCompleteRegisterData = (lastStepData?: any): RegisterCredentials => {
    
    // Mescla o que já existia no estado com o que acabou de vir do componente final
    const finalData = {
      ...additionalData,
      ...lastStepData
    };

    const categoriaId = Number(finalData.categoria);
    if (!categoriaId || categoriaId <= 0) {
      throw new Error("Selecione uma categoria válida.");
    }

    const isJuridica = finalData.tipoPessoa === "JURIDICA";
    const nomeExibicaoInicial = formData.nome.trim();
    const razaoSocialOuFormal = finalData.razaoSocial?.trim() || nomeExibicaoInicial;
    const redesSociaisFormatadas = formatarRedesSociais(finalData.redesSociais);

    return {
      // DADOS DO FORMDATA
      nome: nomeExibicaoInicial,
      email: formData.email.trim(),
      senha: formData.senha,
      telefone: formData.telefone.replace(/\D/g, ""),
      
      // DADOS DO ADDITIONALDATA (Agora usando finalData)
      tipoPessoa: finalData.tipoPessoa || "JURIDICA",
      tipoParceiro: profile ? (profile.toUpperCase() as "GERADOR" | "INSTITUCIONAL") : "INSTITUCIONAL",
      razaoSocial: razaoSocialOuFormal,
      documento: finalData.documento.replace(/\D/g, ""),
      redesSociais: redesSociaisFormatadas,
      aceiteMarketing: Boolean(finalData.aceiteMarketing),
      
      // AQUI É ONDE O "COMO CONHECEU" É RESOLVIDO COM SUCESSO:
      parceiroIndicadorId: finalData.parceiroIndicadorId !== null && finalData.parceiroIndicadorId !== undefined && String(finalData.parceiroIndicadorId).trim() !== ""
          ? String(finalData.parceiroIndicadorId)
          : null,
      outroParceiro: typeof finalData.outroParceiro === "string" && finalData.outroParceiro.trim()
          ? finalData.outroParceiro.trim()
          : null,
      comoConheceu: typeof finalData.comoConheceu === "string" 
          ? finalData.comoConheceu.trim() 
          : "",
      observacao: typeof finalData.observacao === "string" 
          ? finalData.observacao.trim() 
          : "",

      responsavelLegal: isJuridica ? finalData.responsavelLegal?.trim() || undefined : razaoSocialOuFormal,
      responsavelLegalCpf: isJuridica ? finalData.responsavelLegalCpf?.replace(/\D/g, "") || undefined : finalData.documento.replace(/\D/g, ""),
      cep: finalData.cep.replace(/\D/g, ""),
      logradouro: finalData.logradouro.trim(),
      numero: finalData.numero.trim(),
      bairro: finalData.bairro.trim(),
      cidade: finalData.cidade.trim(),
      estado: finalData.estado.trim(),
      complemento: finalData.complemento?.trim() || undefined,
      latitude: Number(finalData.latitude) || 0,
      longitude: Number(finalData.longitude) || 0,
      expectativaGeracao: Number(finalData.expectativaGeracao || finalData.capacidadeBombona) || 0,
      capacidadeBombona: Number(finalData.capacidadeBombona) || 0,
      nivelAtualPct: Number(finalData.nivelAtualPct) || 0,
      statusBombona: finalData.statusBombona || "VAZIA",
      categoria: categoriaId,
    };
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const disponibilidade =
        await authService.verificarDisponibilidade({
          email: formData.email.trim(),
        });

      if (!disponibilidade.emailDisponivel) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Este e-mail já está cadastrado",
        }));

        return;
      }

      setStep(1);
    } catch (error: any) {
      addToast(
        error.response?.data?.message ||
          "Erro ao verificar disponibilidade",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (lastStepData?: any) => {
    try {
      setLoading(true);

      // Passa o dado da última tela para a função que monta o payload
      const registerData = getCompleteRegisterData(lastStepData); 

      console.log("Payload enviado para cadastro:", registerData);
      await authService.register(registerData);
      
    } catch (err: any) {
    console.error(
      "Erro ao finalizar cadastro:",
      err
    );

    console.error(
      "Resposta do backend:",
      err?.response?.data
    );

    console.error(
      "Status:",
      err?.response?.status
    );

    console.error(
      "Erros de validação:",
      err?.response?.data?.errors
    );

    addToast(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Erro ao realizar cadastro",
      "error"
    );

    throw err;
  } finally {
    setLoading(false);
  }
};

  const getSteps = (): string[] => {
    if (!profile) {
      return ["profile"];
    }

    return STEPS[profile] || ["profile"];
  };

  const currentStep =
    step === 0
      ? null
      : getSteps()[stepIndex];

  const totalSteps =
    getSteps().length;

  const onNext = () => {
    if (step === 0) {
      handleRegister();
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const onBack = () => {
    if (step === 0) {
      navigate("/login");
      return;
    }

    if (stepIndex === 0) {
      setStep(0);
      setStepIndex(0);
      setProfile(null);
      return;
    }

    setStepIndex((prev) => prev - 1);
  };

  const onSelectProfile = (
    selectedProfile: string
  ) => {
    setProfile(selectedProfile);

    setStepIndex(1);

    setAdditionalData((prev) => ({
      ...prev,
      tipoParceiro:
        selectedProfile.toUpperCase(),
    }));
  };

  const handleInputChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "telefone") {
      setFormData((prev) => ({
        ...prev,
        [name]: formatPhone(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (
      fieldErrors[
        name as keyof typeof fieldErrors
      ]
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleCheckboxChange = (
    checked: boolean
  ) => {
    setAdditionalData((prev) => ({
      ...prev,
      aceiteMarketing: checked,
    }));

    if (fieldErrors.aceiteMarketing) {
      setFieldErrors((prev) => ({
        ...prev,
        aceiteMarketing: "",
      }));
    }
  };

  const handleStepDataChange = (
    data: any
  ) => {
    setAdditionalData((prev) => {
      const normalizedData: any = {
        ...data,
      };

      if (
        data.redesSociais !== undefined
      ) {
        if (
          Array.isArray(data.redesSociais)
        ) {
          normalizedData.redesSociais =
            data.redesSociais;
        } else if (
          typeof data.redesSociais ===
            "string" &&
          data.redesSociais.trim()
        ) {
          normalizedData.redesSociais = [
            {
              tipo: "outra",
              valor:
                data.redesSociais.trim(),
            },
          ];
        } else {
          normalizedData.redesSociais =
            [];
        }
      }

      if (
        data.expectativaGeracao !==
        undefined
      ) {
        normalizedData.capacidadeBombona =
          data.expectativaGeracao;
      }

      if (
        data.categoriaId !== undefined
      ) {
        normalizedData.categoria =
          Number(data.categoriaId);
      }

      return {
        ...prev,
        ...normalizedData,
      };
    });
  };

  const getFirstName = (
    fullName: string
  ): string => {
    if (
      !fullName ||
      fullName.trim() === ""
    ) {
      return "Usuário";
    }

    return fullName
      .trim()
      .split(" ")[0];
  };

  const renderStep = () => {
    const userName =
      getFirstName(formData.nome);

    const displayStep =
      stepIndex + 1;

    switch (currentStep) {
      case "profile":
        return (
          <StepProfile
            onSelectProfile={
              onSelectProfile
            }
            onBack={onBack}
            step={displayStep}
            userName={userName}
          />
        );

      case "info":
        if (!profile) {
          return null;
        }

        return (
          <InfoParceiro
            onNext={onNext}
            onBack={onBack}
            step={displayStep}
            totalSteps={totalSteps}
            userName={userName}
            onDataChange={
              handleStepDataChange
            }
            initialData={
              additionalData
            }
            profile={profile}
          />
        );

      case "comunicacao":
        return (
          <ComunicacaoIns
            onNext={onNext}
            onBack={onBack}
            step={displayStep}
            totalSteps={totalSteps}
            userName={userName}
            onDataChange={
              handleStepDataChange
            }
            initialData={
              additionalData
            }
          />
        );

      case "volume":
        if (
          profile === "institucional"
        ) {
          return (
            <VolumeIns
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={
                handleStepDataChange
              }
              initialData={
                additionalData
              }
            />
          );
        }

        if (
          profile === "comunitario"
        ) {
          return (
            <VolumeCt
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={
                handleStepDataChange
              }
              initialData={
                additionalData
              }
            />
          );
        }

        if (
          profile === "solidario"
        ) {
          return (
            <VolumeSo
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={
                handleStepDataChange
              }
              initialData={
                additionalData
              }
            />
          );
        }

        return null;

      case "about":
        if (
          profile === "institucional"
        ) {
          return (
            <AboutProjectIns
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={
                handleStepDataChange
              }
              initialData={
                additionalData
              }
              onSubmit={handleFinalSubmit}
              loading={loading}
            />
          );
        }

        if (
          profile === "comunitario"
        ) {
          return (
            <AboutProjectCt
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={
                handleStepDataChange
              }
              initialData={
                additionalData
              }
              onSubmit={handleFinalSubmit}
              loading={loading}
            />
          );
        }

        if (
          profile === "solidario"
        ) {
          return (
            <AboutProjectSo
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={
                handleStepDataChange
              }
              initialData={
                additionalData
              }
              onSubmit={handleFinalSubmit}
              loading={loading}
            />
          );
        }
        return null;

      case "feedback":
        if (
          profile === "institucional"
        ) {
          return (
            <FeedbackIns
              step={displayStep}
              totalSteps={
                totalSteps
              }
              userName={userName}
            />
          );
        }

        if (
          profile === "comunitario"
        ) {
          return (
            <FeedbackCt
              step={displayStep}
              totalSteps={
                totalSteps
              }
              userName={userName}
            />
          );
        }

        if (
          profile === "solidario"
        ) {
          return (
            <FeedbackSo
              step={displayStep}
              totalSteps={
                totalSteps
              }
              userName={userName}
            />
          );
        }

        return null;

      default:
        return null;
    }
  };

  if (step === 0) {
    return (
      <div className="flex flex-col h-screen">
        <HeaderCadastro
          title="Criar Conta"
          onBack={onBack}
        />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:flex md:w-1/2 bg-[#1b6b3b] relative overflow-hidden">
              <img 
                  src="/assets/imagem-lateral-parceiro.png" 
                  alt="Projeto Óleo Circular" 
                  className="absolute bottom-0 left-0 w-auto h-full max-h-full object-contain object-left-bottom" 
              />
          </aside>

          <main
            className="
              flex
              flex-col
              items-center
              w-full
              md:w-1/2
              px-5
              sm:px-8
              md:px-12
              bg-background
              overflow-y-auto
            "
          >
            <div
              className="
                flex
                flex-col
                items-center
                w-full
                max-w-sm
                mt-6
                sm:mt-8
                md:mt-10
                mb-4
                sm:mb-6
              "
            >
              <img
                src="/assets/logo-horizontal.svg"
                alt="Logo Óleo Circular"
                className="h-20 sm:h-24 md:h-32 w-auto"
              />

              <p className="text-xs sm:text-sm text-black-100 font-medium mt-2 text-center px-2">
                Plataforma de Coleta Solidária
              </p>
            </div>

            <div className="w-full max-w-sm">
              <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3">
                DADOS DE ACESSO
              </p>

              <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                <Input
                  type="text"
                  icon="icon-name"
                  placeholder="Seu nome"
                  name="nome"
                  value={formData.nome}
                  onChange={
                    handleInputChange
                  }
                  noBorder
                  error={
                    fieldErrors.nome
                  }
                />

                <hr className="border-white-100" />

                <Input
                  type="email"
                  icon="email"
                  placeholder="Seu e-mail"
                  name="email"
                  value={formData.email}
                  onChange={
                    handleInputChange
                  }
                  noBorder
                  error={
                    fieldErrors.email
                  }
                />

                <hr className="border-white-100" />

                <Input
                  type="password"
                  icon="cadeado"
                  placeholder="Sua senha"
                  name="senha"
                  value={formData.senha}
                  onChange={
                    handleInputChange
                  }
                  noBorder
                  error={
                    fieldErrors.senha
                  }
                />

                <hr className="border-white-100" />

                <Input
                  type="password"
                  icon="cadeado"
                  placeholder="Confirme sua senha"
                  name="confirmarSenha"
                  value={
                    formData.confirmarSenha
                  }
                  onChange={
                    handleInputChange
                  }
                  noBorder
                  error={
                    fieldErrors.confirmarSenha
                  }
                />
              </div>

              <p className="text-xs font-extrabold text-white-500 tracking-widest mb-3 mt-6 sm:mt-8">
                CONTATO
              </p>

              <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                <Input
                  type="tel"
                  icon="phone"
                  placeholder="Telefone / WhatsApp"
                  name="telefone"
                  value={
                    formData.telefone
                  }
                  onChange={
                    handleInputChange
                  }
                  noBorder
                  error={
                    fieldErrors.telefone
                  }
                />
              </div>

              <div className="flex flex-col gap-1 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="aceiteMarketing"
                    checked={
                      additionalData.aceiteMarketing
                    }
                    onChange={
                      handleCheckboxChange
                    }
                  />

                  <label
                    htmlFor="aceiteMarketing"
                    className="text-xs sm:text-sm text-black-200 cursor-pointer"
                  >
                    Aceito os{" "}
                    <button
                      type="button"
                      className="text-green-primary font-bold underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/termos");
                      }}
                    >
                      Termos de Uso
                    </button>{" "}
                    e a{" "}
                    <button
                      type="button"
                      className="text-green-primary font-bold underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(
                          "/privacidade"
                        );
                      }}
                    >
                      Política de Privacidade
                    </button>
                  </label>
                </div>

                {fieldErrors.aceiteMarketing && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {
                      fieldErrors.aceiteMarketing
                    }
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={
                  handleRegister
                }
                disabled={loading}
                variant="primary"
              >
                {loading
                  ? "Verificando..."
                  : "Avançar"}
              </Button>
            </div>

            <p className="mt-auto py-4 text-xs text-black-100">
              © 2026 HS Tecnologia. Todos os direitos reservados.
            </p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {renderStep()}
    </div>
  );
}

export default Register;