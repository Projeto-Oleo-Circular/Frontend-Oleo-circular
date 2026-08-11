import { useNavigate } from "react-router-dom";
import HeaderCadastro from "../../../../components/layout/HeaderCadastro";
import Input from "../../../../components/ui/Input";
import { useState, ChangeEvent } from "react";
import StepProfile from "./StepProfile";
import useToast from "../../../../hooks/useToast";
import {
  authService,
  RegisterCredentials,
} from "../../../../services/authService";

import InfoIns from "./Instituicao/InfoIns";
import ComunicacaoIns from "./Instituicao/ComunicacaoIns";
import VolumeIns from "./Instituicao/VolumeIns";
import AboutProjectIns from "./Instituicao/AboutProjectIns";
import FeedbackIns from "./Instituicao/FeedbackIns";

import InfoCt from "./Comunitario/InfoCt";
import VolumeCt from "./Comunitario/VolumeCt";
import AboutProjectCt from "./Comunitario/AboutProjectCt";
import FeedbackCt from "./Comunitario/FeedbackCt";

import InfoSo from "./Solidario/InfoSo";
import VolumeSo from "./Solidario/VolumeSo";
import AboutProjectSo from "./Solidario/AboutProjectSo";
import FeedbackSo from "./Solidario/FeedbackSo";

import Checkbox from "../../../../components/ui/Checkbox";
import Button from "../../../../components/ui/Button";

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

  // Dados da etapa inicial de credenciais/contato (Primeira Tela)
  const [formData, setFormData] = useState({
    nome: "", // Nome Fantasia (se PJ) ou Nome Pessoal (se PF)
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
  });

  const [additionalData, setAdditionalData] = useState({
    tipoPessoa: "JURIDICA", // "JURIDICA" | "FISICA"
    tipoParceiro: "INSTITUCIONAL",
    razaoSocial: "", // Razão Social formal (PJ) ou Nome Completo do documento (PF)
    nome: "", 
    documento: "",
    redesSociais: "",
    aceiteMarketing: false,

    // Responsável Legal
    responsavelLegalNome: "",
    responsavelLegalCpf: "",

    // Indicador
    parceiroIndicadorId: "",

    // Endereço
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",

    // Métricas
    expectativaGeracao: 0,
    capacidadeBombona: 0,
    nivelAtualPct: 0,
    statusBombona: "VAZIA",

    // Categoria
    categoria: 0,
  });

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 11);
    if (limited.length <= 2) return limited;
    else if (limited.length <= 6)
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    else if (limited.length <= 10)
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(
        6
      )}`;
    else
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(
        7,
        11
      )}`;
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

    if (!formData.nome) {
      errors.nome = "Nome é obrigatório";
      hasError = true;
    }
    if (!formData.email) {
      errors.email = "E-mail é obrigatório";
      hasError = true;
    } else if (!formData.email.includes("@") || !formData.email.includes(".")) {
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

  // Montagem final do Payload respeitando a distinção FISICA vs JURIDICA
  const getCompleteRegisterData = (): RegisterCredentials => {
    const categoriaId = Number(additionalData.categoria);

    if (!categoriaId || categoriaId <= 0) {
      throw new Error("Selecione uma categoria válida.");
    }

    const isJuridica = additionalData.tipoPessoa === "JURIDICA";

    // Se Institucional/PJ: Nome da 1ª tela é o Nome Fantasia.
    // Se Física: Nome da 1ª tela representa o nome de exibição/identificador pessoal.
    const nomeExibicaoInicial = formData.nome.trim();

    // Razão Social ou Nome Registro Formal
    const razaoSocialOuFormal =
      additionalData.razaoSocial?.trim() || nomeExibicaoInicial;

    return {
      tipoPessoa: additionalData.tipoPessoa || "JURIDICA",
      tipoParceiro: profile
        ? (profile.toUpperCase() as "GERADOR" | "INSTITUCIONAL")
        : "INSTITUCIONAL",

      // Salva no banco o registro formal/jurídico
      razaoSocial: razaoSocialOuFormal,

      // Salva no banco o Nome Fantasia (PJ) ou Nome Amigável (PF)
      nome: nomeExibicaoInicial,

      email: formData.email.trim(),
      senha: formData.senha,
      documento: additionalData.documento.replace(/\D/g, ""),

      telefone: formData.telefone.replace(/\D/g, ""),

      redesSociais: additionalData.redesSociais.trim()
        ? [additionalData.redesSociais.trim()]
        : [],

      aceiteMarketing: Boolean(additionalData.aceiteMarketing),

      parceiroIndicadorId: additionalData.parceiroIndicadorId
        ? String(additionalData.parceiroIndicadorId)
        : undefined,

      // Se for PJ utiliza o responsável legal informado; se PF, o próprio nome formal
      responsavelLegalNome: isJuridica
        ? additionalData.responsavelLegalNome?.trim() || undefined
        : razaoSocialOuFormal,

      responsavelLegalCpf: isJuridica
        ? additionalData.responsavelLegalCpf?.replace(/\D/g, "") || undefined
        : additionalData.documento.replace(/\D/g, ""),

      cep: additionalData.cep.replace(/\D/g, ""),
      logradouro: additionalData.logradouro.trim(),
      numero: additionalData.numero.trim(),
      bairro: additionalData.bairro.trim(),
      cidade: additionalData.cidade.trim(),
      estado: additionalData.estado.trim(),
      complemento: additionalData.complemento?.trim() || undefined,

      expectativaGeracao:
        Number(
          additionalData.expectativaGeracao || additionalData.capacidadeBombona
        ) || 0,
      capacidadeBombona: Number(additionalData.capacidadeBombona) || 0,

      nivelAtualPct: Number(additionalData.nivelAtualPct) || 0,
      statusBombona: additionalData.statusBombona || "VAZIA",

      categoria: categoriaId,
    };
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const disponibilidade = await authService.verificarDisponibilidade({
        email: formData.email,
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
        error.response?.data?.message || "Erro ao verificar disponibilidade",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const registerData = getCompleteRegisterData();
      await authService.register(registerData);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSteps = (): string[] => {
    if (!profile) return ["profile"];
    return STEPS[profile] || ["profile"];
  };

  const currentStep = step === 0 ? null : getSteps()[stepIndex];
  const totalSteps = getSteps().length;

  const onNext = () => {
    if (step === 0) {
      handleRegister();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  };

  const onBack = () => {
    if (step === 0) {
      navigate("/login");
    } else if (stepIndex === 0) {
      setStep(0);
      setStepIndex(0);
      setProfile(null);
    } else {
      setStepIndex((prev) => prev - 1);
    }
  };

  const onSelectProfile = (selectedProfile: string) => {
    setProfile(selectedProfile);
    setStepIndex(1);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    if (name === "telefone") {
      setFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setAdditionalData((prev) => ({ ...prev, aceiteMarketing: checked }));
    if (fieldErrors.aceiteMarketing) {
      setFieldErrors((prev) => ({ ...prev, aceiteMarketing: "" }));
    }
  };

  const handleStepDataChange = (data: any) => {
    if (data.expectativaGeracao !== undefined) {
      data.capacidadeBombona = data.expectativaGeracao;
    }
    if (data.categoriaId !== undefined) {
      data.categoria = data.categoriaId;
    }
    setAdditionalData((prev) => ({ ...prev, ...data }));
  };

  const getFirstName = (fullName: string): string => {
    if (!fullName || fullName.trim() === "") return "Usuário";
    return fullName.trim().split(" ")[0];
  };

  const renderStep = () => {
    const userName = getFirstName(formData.nome);
    const displayStep = stepIndex + 1;

    switch (currentStep) {
      case "profile":
        return (
          <StepProfile
            onSelectProfile={onSelectProfile}
            onBack={onBack}
            step={displayStep}
            userName={userName}
          />
        );

      case "info":
        if (profile === "institucional")
          return (
            <InfoIns
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
              profile={profile}
            />
          );
        if (profile === "comunitario")
          return (
            <InfoCt
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
              profile={profile}
            />
          );
        if (profile === "solidario")
          return (
            <InfoSo
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
              profile={profile}
            />
          );
        return null;

      case "comunicacao":
        return (
          <ComunicacaoIns
            onNext={onNext}
            onBack={onBack}
            step={displayStep}
            totalSteps={totalSteps}
            userName={userName}
            onDataChange={handleStepDataChange}
            initialData={additionalData}
          />
        );

      case "volume":
        if (profile === "institucional")
          return (
            <VolumeIns
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
            />
          );
        if (profile === "comunitario")
          return (
            <VolumeCt
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
            />
          );
        if (profile === "solidario")
          return (
            <VolumeSo
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
            />
          );
        return null;

      case "about":
        if (profile === "institucional")
          return (
            <AboutProjectIns
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
            />
          );
        if (profile === "comunitario")
          return (
            <AboutProjectCt
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
            />
          );
        if (profile === "solidario")
          return (
            <AboutProjectSo
              onNext={onNext}
              onBack={onBack}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              onDataChange={handleStepDataChange}
              initialData={additionalData}
            />
          );
        return null;

      case "feedback":
        if (profile === "institucional")
          return (
            <FeedbackIns
              onSubmit={handleFinalSubmit}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              loading={loading}
            />
          );
        if (profile === "comunitario")
          return (
            <FeedbackCt
              onSubmit={handleFinalSubmit}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              loading={loading}
            />
          );
        if (profile === "solidario")
          return (
            <FeedbackSo
              onSubmit={handleFinalSubmit}
              step={displayStep}
              totalSteps={totalSteps}
              userName={userName}
              loading={loading}
            />
          );
        return null;

      default:
        return null;
    }
  };

  if (step === 0) {
    return (
      <div className="flex flex-col h-screen">
        <HeaderCadastro title="Criar Conta" onBack={onBack} />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:flex md:w-1/2 relative">
            <img
              src="/assets/Imagem 1.jpg"
              alt="Projeto Óleo Circular"
              className="w-full h-full object-cover object-center"
            />
          </aside>

          <main className="flex flex-col items-center w-full md:w-1/2 px-5 sm:px-8 md:px-12 bg-background overflow-y-auto">
            <div className="flex flex-col items-center w-full max-w-sm mt-6 sm:mt-8 md:mt-10 mb-4 sm:mb-6">
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
                  onChange={handleInputChange}
                  noBorder
                  error={fieldErrors.nome}
                />
                <hr className="border-white-100" />
                <Input
                  type="email"
                  icon="email"
                  placeholder="Seu e-mail"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  noBorder
                  error={fieldErrors.email}
                />
                <hr className="border-white-100" />
                <Input
                  type="password"
                  icon="cadeado"
                  placeholder="Sua senha"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  noBorder
                  error={fieldErrors.senha}
                />
                <hr className="border-white-100" />
                <Input
                  type="password"
                  icon="cadeado"
                  placeholder="Confirme sua senha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  noBorder
                  error={fieldErrors.confirmarSenha}
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
                  value={formData.telefone}
                  onChange={handleInputChange}
                  noBorder
                  error={fieldErrors.telefone}
                />
              </div>

              <div className="flex flex-col gap-1 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="aceiteMarketing"
                    checked={additionalData.aceiteMarketing}
                    onChange={handleCheckboxChange}
                  />
                  <label
                    htmlFor="aceiteMarketing"
                    className="text-xs sm:text-sm text-black-200 cursor-pointer"
                  >
                    Aceito os{" "}
                    <button
                      type="button"
                      className="text-green-primary font-bold underline"
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
                      className="text-green-primary font-bold underline"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/privacidade");
                      }}
                    >
                      Política de Privacidade
                    </button>
                  </label>
                </div>
                {fieldErrors.aceiteMarketing && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {fieldErrors.aceiteMarketing}
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                variant="primary"
              >
                {loading ? "Verificando..." : "Avançar"}
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