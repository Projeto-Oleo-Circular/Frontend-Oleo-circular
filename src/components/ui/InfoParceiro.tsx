import { useEffect, useState, type ChangeEvent } from "react";
import HeaderCadastro from "../layout/HeaderCadastro";
import ProgressBar from "./ProgressBar";
import Input from "./Input";
import Button from "./Button";
import Dropdown from "./Dropdown";
import AddressMapPicker, { type AddressMapValue } from "./AddressMapPicker";
import { authService } from "../../services/authService";
import useToast from "../../hooks/useToast";

interface Props {
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
  userName?: string;
  onDataChange?: (data: Record<string, unknown>) => void;
  initialData?: Record<string, any>;
  profile: string;
}

interface FormData {
  responsavel: string;
  cnpj: string;
  razaoSocial: string;
  cep: string;
  cidade: string;
  estado: string;
  logradouro: string;
  bairro: string;
  numero: string;
  complemento: string;
  categoria: string;
  latitude: number | null;
  longitude: number | null;
}

type FieldErrors = Record<
  "responsavel" | "cnpj" | "razaoSocial" | "cep" | "cidade" |
  "estado" | "logradouro" | "bairro" | "numero" | "categoria",
  string
>;

const EMPTY_ERRORS: FieldErrors = {
  responsavel: "",
  cnpj: "",
  razaoSocial: "",
  cep: "",
  cidade: "",
  estado: "",
  logradouro: "",
  bairro: "",
  numero: "",
  categoria: "",
};

const CATEGORIES_BY_PROFILE: Record<string, number[]> = {
  institucional: [1, 2, 3, 4, 5],
  comunitario: [6, 7],
  solidario: [8],
};

function formatCep(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 8);
  return cleaned.length > 5
    ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    : cleaned;
}

function formatDocument(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 11) {
    return cleaned.slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return cleaned.slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function validateCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let index = 0; index < 9; index++) sum += Number(cpf[index]) * (10 - index);
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  sum = 0;
  for (let index = 0; index < 10; index++) sum += Number(cpf[index]) * (11 - index);
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return Number(cpf[9]) === digit1 && Number(cpf[10]) === digit2;
}

function validateCNPJ(value: string): boolean {
  const cnpj = value.replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  let sum = 0;
  let weight = 5;
  for (let index = 0; index < 12; index++) {
    sum += Number(cnpj[index]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  sum = 0;
  weight = 6;
  for (let index = 0; index < 13; index++) {
    sum += Number(cnpj[index]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return Number(cnpj[12]) === digit1 && Number(cnpj[13]) === digit2;
}

function InfoParceiro({
  onNext, onBack, step, totalSteps, userName = "Usuário",
  onDataChange, initialData = {}, profile,
}: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState<FormData>({
    responsavel: initialData.responsavel || initialData.responsavelLegal || initialData.responsavelLegalNome || "",
    cnpj: initialData.cnpj || initialData.documento || "",
    razaoSocial: initialData.razaoSocial || "",
    cep: initialData.cep || "",
    cidade: initialData.cidade || "",
    estado: initialData.estado || "",
    logradouro: initialData.logradouro || initialData.rua || "",
    bairro: initialData.bairro || "",
    numero: initialData.numero || "",
    complemento: initialData.complemento || "",
    categoria: String(initialData.categoria || initialData.categoriaId || ""),
    latitude: initialData.latitude ?? null,
    longitude: initialData.longitude ?? null,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_ERRORS);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategorias(true);
        const categories = await authService.listarCategorias();
        const allowedIds = CATEGORIES_BY_PROFILE[profile] || [];
        setCategoryOptions(categories
          .filter((category) => allowedIds.includes(Number(category.value)))
          .map((category) => ({ value: String(category.value), label: category.label }))
        );
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        addToast("Erro ao carregar categorias", "error");
      } finally {
        setLoadingCategorias(false);
      }
    };
    void loadCategories();
  }, [profile]);

  const clearError = (field: keyof FieldErrors) => {
    setFieldErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name in fieldErrors) clearError(name as keyof FieldErrors);

    if (name === "cnpj") {
      const formatted = formatDocument(value);
      const document = formatted.replace(/\D/g, "");
      setFormData((previous) => ({ ...previous, cnpj: formatted }));
      onDataChange?.({
        documento: document,
        tipoPessoa: document.length <= 11 ? "FISICA" : "JURIDICA",
      });
      return;
    }

    if (name === "cep") {
      const formatted = formatCep(value);
      const cleaned = formatted.replace(/\D/g, "");
      setFormData((previous) => ({ ...previous, cep: formatted }));
      onDataChange?.({ cep: cleaned });
      if (cleaned.length === 8) {
        setLoadingCep(true);
        try {
          const address = await authService.buscarCep(cleaned);
          const addressData = {
            cep: formatted,
            cidade: address.cidade || "",
            estado: address.estado || "",
            logradouro: address.logradouro || "",
            bairro: address.bairro || "",
          };
          setFormData((previous) => ({ ...previous, ...addressData }));
          setFieldErrors((previous) => ({
            ...previous, cep: "", cidade: "", estado: "", logradouro: "", bairro: "",
          }));
          onDataChange?.({ ...addressData, cep: cleaned });
        } catch {
          setFieldErrors((previous) => ({ ...previous, cep: "CEP não encontrado" }));
        } finally {
          setLoadingCep(false);
        }
      }
      return;
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
    onDataChange?.({ [name]: value });
  };

  const handleCategoryChange = (value: string) => {
    setFormData((previous) => ({ ...previous, categoria: value }));
    clearError("categoria");
    onDataChange?.({ categoria: Number(value), categoriaId: Number(value) });
  };

  const handleMapChange = (data: Partial<AddressMapValue>) => {
    const mapData = {
      ...data,
      ...(data.cep !== undefined ? { cep: formatCep(data.cep) } : {}),
    };
    setFormData((previous) => ({ ...previous, ...mapData }));
    setFieldErrors((previous) => ({
      ...previous,
      cep: data.cep ? "" : previous.cep,
      logradouro: data.logradouro ? "" : previous.logradouro,
      bairro: data.bairro ? "" : previous.bairro,
      cidade: data.cidade ? "" : previous.cidade,
      estado: data.estado ? "" : previous.estado,
      numero: data.numero ? "" : previous.numero,
    }));
    onDataChange?.({
      ...data,
      ...(data.cep !== undefined ? { cep: data.cep.replace(/\D/g, "") } : {}),
    });
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = { ...EMPTY_ERRORS };
    const document = formData.cnpj.replace(/\D/g, "");
    if (!formData.responsavel.trim()) errors.responsavel = "Nome do responsável é obrigatório";
    if (!document) errors.cnpj = "CNPJ/CPF é obrigatório";
    else if (document.length === 11 && !validateCPF(document)) errors.cnpj = "CPF inválido";
    else if (document.length === 14 && !validateCNPJ(document)) errors.cnpj = "CNPJ inválido";
    else if (document.length !== 11 && document.length !== 14) errors.cnpj = "Informe um CPF ou CNPJ válido";
    if (!formData.razaoSocial.trim()) errors.razaoSocial = "Razão social é obrigatória";
    if (!formData.cep.trim()) errors.cep = "CEP é obrigatório";
    if (!formData.estado.trim()) errors.estado = "Estado é obrigatório";
    if (!formData.cidade.trim()) errors.cidade = "Cidade é obrigatória";
    if (!formData.logradouro.trim()) errors.logradouro = "Logradouro é obrigatório";
    if (!formData.bairro.trim()) errors.bairro = "Bairro é obrigatório";
    if (!formData.numero.trim()) errors.numero = "Número é obrigatório";
    if (!formData.categoria) errors.categoria = "Tipo de estabelecimento é obrigatório";
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const document = formData.cnpj.replace(/\D/g, "");
      const availability = await authService.verificarDisponibilidade({ documento: document });
      if (availability.documentoDisponivel === false) {
        setFieldErrors((previous) => ({ ...previous, cnpj: "Este documento já está cadastrado" }));
        return;
      }
      onDataChange?.({
        documento: document,
        tipoPessoa: document.length === 11 ? "FISICA" : "JURIDICA",
        razaoSocial: formData.razaoSocial.trim(),
        responsavelLegal: formData.responsavel.trim(),
        cep: formData.cep.replace(/\D/g, ""),
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim(),
        logradouro: formData.logradouro.trim(),
        bairro: formData.bairro.trim(),
        numero: formData.numero.trim(),
        complemento: formData.complemento.trim(),
        categoria: Number(formData.categoria),
        categoriaId: Number(formData.categoria),
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      onNext();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Erro ao verificar documento";
      if (error?.response?.status === 409 || message.toLowerCase().includes("cadastrado")) {
        setFieldErrors((previous) => ({ ...previous, cnpj: "Este documento já está cadastrado" }));
      }
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <HeaderCadastro title="Criar Conta" onBack={onBack} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex md:w-1/2 relative">
          <img src="/assets/Imagem 3.jpg" alt="Projeto Óleo Circular" className="w-full h-full object-cover object-center" />
        </aside>
        <main className="flex flex-col w-full md:w-1/2 px-5 sm:px-8 md:px-12 bg-background overflow-y-auto">
          <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-green-primary">Bem-vindo(a), {userName}!</h1>
            <p className="text-sm sm:text-base font-medium text-white-500">Preencha os dados e selecione a localização no mapa.</p>
          </div>
          <ProgressBar step={step} totalSteps={totalSteps} />
          <div className="w-full pb-4">
            <p className="text-xs font-extrabold text-white-500 tracking-widest py-4">INFORMAÇÕES DO PARCEIRO</p>
            <div className="mb-3">
              {loadingCategorias ? (
                <div className="text-center py-2 text-white-500">Carregando categorias...</div>
              ) : (
                <Dropdown placeholder="Tipo de estabelecimento" options={categoryOptions} value={formData.categoria} onChange={handleCategoryChange} />
              )}
              {fieldErrors.categoria && <p className="text-red-500 text-xs mt-1 font-medium pl-2">{fieldErrors.categoria}</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
              <Input type="text" icon="icon-razaoSocial" placeholder="Razão social" name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} noBorder error={fieldErrors.razaoSocial} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-name" placeholder="Nome do responsável legal" name="responsavel" value={formData.responsavel} onChange={handleInputChange} noBorder error={fieldErrors.responsavel} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-CNPJ" placeholder="CNPJ ou CPF" name="cnpj" value={formData.cnpj} onChange={handleInputChange} noBorder error={fieldErrors.cnpj} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-CEP" placeholder={loadingCep ? "Buscando CEP..." : "CEP"} name="cep" value={formData.cep} onChange={handleInputChange} noBorder error={fieldErrors.cep} disabled={loadingCep} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-estado" placeholder="Estado" name="estado" value={formData.estado} onChange={handleInputChange} noBorder error={fieldErrors.estado} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-city" placeholder="Cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} noBorder error={fieldErrors.cidade} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-logradouro" placeholder="Logradouro" name="logradouro" value={formData.logradouro} onChange={handleInputChange} noBorder error={fieldErrors.logradouro} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-bairro" placeholder="Bairro" name="bairro" value={formData.bairro} onChange={handleInputChange} noBorder error={fieldErrors.bairro} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-number" placeholder="Número do estabelecimento" name="numero" value={formData.numero} onChange={handleInputChange} noBorder error={fieldErrors.numero} />
              <hr className="border-white-100" />
              <Input type="text" icon="icon-complemento" placeholder="Complemento (opcional)" name="complemento" value={formData.complemento} onChange={handleInputChange} noBorder />
            </div>
            <div className="mb-6">
              <AddressMapPicker
                value={{
                  cep: formData.cep,
                  logradouro: formData.logradouro,
                  bairro: formData.bairro,
                  cidade: formData.cidade,
                  estado: formData.estado,
                  numero: formData.numero,
                  complemento: formData.complemento,
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                onChange={handleMapChange}
              />
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <Button type="button" onClick={handleNext} variant="primary" fullWidth disabled={loading}>{loading ? "Verificando..." : "Avançar"}</Button>
              <Button type="button" onClick={onBack} variant="secondary" fullWidth disabled={loading}>Voltar</Button>
            </div>
          </div>
          <p className="text-center text-xs text-black-100 py-4 sm:py-6">© 2026 HS Tecnologia. Todos os direitos reservados.</p>
        </main>
      </div>
    </div>
  );
}

export default InfoParceiro;
