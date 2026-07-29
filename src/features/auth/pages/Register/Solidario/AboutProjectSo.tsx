import { useEffect, useState } from "react";
import HeaderCadastro from "../../../../../components/layout/HeaderCadastro";
import ProgressBar from "../../../../../components/ui/ProgressBar";
import Dropdown from "../../../../../components/ui/Dropdown";
import Button from "../../../../../components/ui/Button";
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

function AboutProjectSo({
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
    partner: initialData.partner || null,
    howFound: initialData.comoConheceu || "",
    observation: initialData.observacao || "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    partner: "",
    howFound: "",
    observation: "",
  });

  useEffect(() => {
    const carregarParceiros = async () => {
      try {
        const parceiros = await authService.listarParceirosIndicadores();

        setPartnerOptions(
          parceiros.map((parceiro) => ({
            value: parceiro.id.toString(),
            label: parceiro.nome,
          }))
        );
      } catch (error) {
        console.error("Erro ao carregar parceiros:", error);
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

  const handleDropdownChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      partner: value,
    }));

    if (fieldErrors.partner) {
      setFieldErrors((prev) => ({
        ...prev,
        partner: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    let hasError = false;

    const errors = {
      partner: "",
      howFound: "",
      observation: "",
    };

    if (!formData.partner) {
      errors.partner = "Selecione um parceiro para continuar";
      hasError = true;
    }

    setFieldErrors(errors);

    return !hasError;
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    onDataChange?.({
      comoConheceu: formData.howFound,
      observacao: formData.observation,
      partner: formData.partner,
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
              Nos conte como conheceu o projeto.
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

export default AboutProjectSo;