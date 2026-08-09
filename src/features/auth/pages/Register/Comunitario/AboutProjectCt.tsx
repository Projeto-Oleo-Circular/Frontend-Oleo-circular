import { useEffect, useState } from "react";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Dropdown from "../../../../../components/ui/Dropdown";
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
}

function AboutProjectCt({
  onNext,
  onBack,
  step,
  totalSteps,
  userName = "Usuário",
  onDataChange,
  initialData = {},
}: Props) {
  const [partnerOptions, setPartnerOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [formData, setFormData] = useState({
    partner: initialData.parceiroIndicadorId
      ? String(initialData.parceiroIndicadorId)
      : initialData.partner || null,
    otherPartnerName: initialData.outroParceiro || "",
    howFound: initialData.comoConheceu || "",
    observation: initialData.observacao || "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    partner: "",
    otherPartnerName: "",
    howFound: "",
    observation: "",
  });

  useEffect(() => {
    const carregarParceiros = async () => {
      try {
        const parceiros = await authService.listarParceirosIndicadores();

        const options = parceiros.map((parceiro) => ({
          value: parceiro.id.toString(),
          label: parceiro.nome,
        }));

        options.push({ value: "outros", label: "Outros" });

        setPartnerOptions(options);
      } catch (error) {
        console.error("Erro ao carregar parceiros:", error);
        setPartnerOptions([{ value: "outros", label: "Outros" }]);
      }
    };

    carregarParceiros();
  }, []);

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleDropdownChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      partner: value,
      otherPartnerName: value !== "outros" ? "" : prev.otherPartnerName,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      partner: "",
      otherPartnerName: "",
    }));
  };

  const validateForm = (): boolean => {
    let hasError = false;

    const errors = {
      partner: "",
      otherPartnerName: "",
      howFound: "",
      observation: "",
    };

    if (!formData.partner) {
      errors.partner = "Selecione um parceiro para continuar";
      hasError = true;
    }

    if (formData.partner === "outros" && !formData.otherPartnerName.trim()) {
      errors.otherPartnerName = "Informe o nome do parceiro";
      hasError = true;
    }

    setFieldErrors(errors);

    return !hasError;
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    const isOther = formData.partner === "outros";
    const parceiroId =
      formData.partner && !isOther ? Number(formData.partner) : null;

    let comoConheceuFinal = formData.howFound;
    if (isOther && formData.otherPartnerName) {
      comoConheceuFinal = `Parceiro indicado: ${formData.otherPartnerName.trim()}.${
        formData.howFound ? ` | ${formData.howFound.trim()}` : ""
      }`;
    }

    onDataChange?.({
      comoConheceu: comoConheceuFinal,
      observacao: formData.observation,
      parceiroIndicadorId: parceiroId,
      outroParceiro: formData.otherPartnerName,
    });

    onNext();
  };

  return (
    <div className="flex flex-col h-screen">
      <HeaderCadastro title="Criar Conta" onBack={onBack} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex md:w-1/2 relative">
          <img
            src="/assets/Imagem 3.jpg"
            alt="Projeto Óleo Circular"
            className="w-full h-full object-cover object-center"
          />
        </aside>

        <main className="flex flex-col w-full md:w-1/2 px-5 sm:px-8 md:px-12 bg-background overflow-y-auto">
          <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-green-primary">
              Bem-vindo(a), {userName}!
            </h1>

            <p className="text-sm sm:text-base font-medium text-white-500">
              Escolha um parceiro indicador e nos conte como conheceu o projeto.
            </p>
          </div>

          <ProgressBar step={step} totalSteps={totalSteps} />

          <div className="w-full pb-4">
            <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">
              COMO CONHECEU O ÓLEO CIRCULAR
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 mb-6">
              <div>
                <Dropdown
                  placeholder="Selecione um parceiro"
                  options={partnerOptions}
                  value={formData.partner}
                  onChange={handleDropdownChange}
                />

                {fieldErrors.partner && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {fieldErrors.partner}
                  </p>
                )}
              </div>

              {formData.partner === "outros" && (
                <div>
                  <Input
                    name="otherPartnerName"
                    value={formData.otherPartnerName}
                    onChange={handleInputChange}
                    placeholder="Qual é o parceiro?"
                    className="w-full bg-white rounded-xl border border-white-200 px-4 py-3 text-sm text-black-primary outline-none resize-none h-28 placeholder:text-black-100 focus:border-green-primary transition-colors duration-200"
                    error={fieldErrors.otherPartnerName}
                  />
                </div>
              )}

              <textarea
                name="howFound"
                value={formData.howFound}
                onChange={handleTextareaChange}
                placeholder="Como descobriu o projeto? (opcional)"
                className="w-full bg-white rounded-xl border border-white-200 px-4 py-3 text-sm text-black-primary outline-none resize-none h-28 placeholder:text-black-100 focus:border-green-primary transition-colors duration-200"
              />

              <textarea
                name="observation"
                value={formData.observation}
                onChange={handleTextareaChange}
                placeholder="Quer deixar alguma observação? (opcional)"
                className="w-full bg-white rounded-xl border border-white-200 px-4 py-3 text-sm text-black-primary outline-none resize-none h-28 placeholder:text-black-100 focus:border-green-primary transition-colors duration-200"
              />
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 mt-4">
              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                fullWidth
              >
                Avançar
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

          <p className="text-center text-xs text-black-100 py-4 sm:py-6">
            © 2026 HS Tecnologia. Todos os direitos reservados.
          </p>
        </main>
      </div>
    </div>
  );
}

export default AboutProjectCt;