// CriarPontoColetaModal.tsx

import {
  useEffect,
  useState,
  type FormEvent,
  useRef,
} from "react";

import {
  X,
  Building2,
  Factory,
  GraduationCap,
  Hotel,
  Utensils,
  Home,
  Store,
  HeartHandshake,
} from "lucide-react";

import Button from "../ui/Button";
import AddressMapPicker, { type AddressMapValue } from "../ui/AddressMapPicker";
import { CATEGORIA_OPTIONS } from "../../constants/categorias";
import { type Parceiro } from "../../services/adminParceiroService";

export interface CriarPontoColetaPayload {
    nomePontoColeta: string;
    categoria: number;
    cep: string;
    logradouro: string;
    numero: string; // Tipagem ajustada para string limpa
    bairro: string;
    cidade: string;
    estado?: string;
    complemento?: string | null;
    expectativaGeracao: number;
    capacidadeBombona?: number;
    nivelAtualPct?: number;
    statusBombona?: string;
    latitude?: string | number;
    longitude?: string | number;
    parceiroId?: number;
    statusAprovacaoPontoColeta?: "PENDENTE" | "APROVADO" | "REJEITADO";
}

interface CriarPontoColetaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CriarPontoColetaPayload) => Promise<void>;
    loading?: boolean;
    parceiro?: Parceiro | null;
}

const payloadDefault: CriarPontoColetaPayload = {
    nomePontoColeta: '',
    categoria: 1,
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',
    expectativaGeracao: 0,
    capacidadeBombona: 20,
    nivelAtualPct: 0,
    statusBombona: 'VAZIA',
    latitude: '',
    longitude: '',
    statusAprovacaoPontoColeta: 'APROVADO',
};

// Mapeamento de categorias permitidas por tipo de parceiro
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

export function CriarPontoColetaModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    loading = false, 
    parceiro 
}: CriarPontoColetaModalProps) {
    const [formData, setFormData] = useState<CriarPontoColetaPayload>(payloadDefault);
    const [erro, setErro] = useState<string | null>(null);

    const atualizandoDoMapa = useRef(false);
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Quando abrir o modal ou mudar o parceiro, ajusta a categoria inicial compatível
    useEffect(() => {
        if (!isOpen) {
            setFormData(payloadDefault);
            setErro(null);
            atualizandoDoMapa.current = false;
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
                debounceTimeout.current = null;
            }
        } else if (parceiro?.tipoParceiro) {
            const permitidas = CATEGORIAS_POR_TIPO_PARCEIRO[parceiro.tipoParceiro] || [];
            if (permitidas.length > 0) {
                setFormData(prev => ({ ...prev, categoria: permitidas[0] }));
            }
        }
    }, [isOpen, parceiro]);

    // Filtra as categorias com base no tipo do parceiro selecionado
    const getCategoriasPermitidas = () => {
        const tipo = parceiro?.tipoParceiro;
        if (!tipo) return CATEGORIA_OPTIONS;
        
        const idsPermitidos = CATEGORIAS_POR_TIPO_PARCEIRO[tipo] || [];
        return CATEGORIA_OPTIONS.filter(({ value }) => 
          idsPermitidos.includes(Number(value))
        );
    };

    // Busca de coordenadas via Nominatim se preencher endereço/CEP
    const buscarCoordenadasPorTexto = async () => {
        const temDadosParaBuscar =
            formData.cep ||
            (formData.cidade && formData.estado) ||
            (formData.logradouro && formData.cidade);

        if (!temDadosParaBuscar) return;

        try {
            const queryParts = [
                formData.logradouro,
                formData.numero,
                formData.bairro,
                formData.cidade,
                formData.estado,
                formData.cep,
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
            setFormData((atual) => ({
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

        const temDadosMinimos = formData.cep || (formData.cidade && formData.estado);
        if (!temDadosMinimos) return;

        debounceTimeout.current = setTimeout(() => {
            buscarCoordenadasPorTexto();
        }, 1000);

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [formData.cep, formData.logradouro, formData.numero, formData.bairro, formData.cidade, formData.estado]);

    if (!isOpen) return null;

    const atualizarCampo = async <K extends keyof CriarPontoColetaPayload>(
        campo: K,
        valor: CriarPontoColetaPayload[K]
    ) => {
        setFormData((prev) => ({
            ...prev,
            [campo]: valor,
        }));
        if (erro) setErro(null);

        // Busca ViaCEP automática
        if (campo === "cep") {
            const cepLimpo = String(valor).replace(/\D/g, "");
            if (cepLimpo.length === 8) {
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                    const dadosCep = await res.json();

                    if (!dadosCep.erro) {
                        setFormData((atual) => ({
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

    const atualizarEnderecoDoMapa = (data: Partial<AddressMapValue>) => {
        atualizandoDoMapa.current = true;
        setFormData((atual) => ({
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!formData.nomePontoColeta || !formData.cep || !formData.logradouro || !formData.numero || !formData.bairro || !formData.cidade) {
            setErro("Preencha todos os campos obrigatórios de endereço e nome (*).");
            return;
        }

        if (!formData.latitude || !formData.longitude || (Number(formData.latitude) === 0 && Number(formData.longitude) === 0)) {
            setErro("Selecione a localização correta do ponto de coleta no mapa.");
            return;
        }
        
        setErro(null);
        try {
            const payloadFinal: CriarPontoColetaPayload = {
                ...formData,
                parceiroId: parceiro?.id ? Number(parceiro.id) : undefined,
                nomePontoColeta: formData.nomePontoColeta.trim(),
                cep: formData.cep.trim(),
                logradouro: formData.logradouro.trim(),
                numero: String(formData.numero).trim(),
                bairro: formData.bairro.trim(),
                cidade: formData.cidade.trim(),
                estado: formData.estado || "",
                complemento: formData.complemento ? formData.complemento.trim() : undefined,
                categoria: Number(formData.categoria) > 0 ? Number(formData.categoria) : 1,
                expectativaGeracao: Number(formData.expectativaGeracao) > 0 ? Number(formData.expectativaGeracao) : 1,
                capacidadeBombona: Number(formData.capacidadeBombona) > 0 ? Number(formData.capacidadeBombona) : 20,
                nivelAtualPct: Number(formData.nivelAtualPct) >= 0 ? Number(formData.nivelAtualPct) : 0,
                statusBombona: formData.statusBombona || "VAZIA",
                latitude: String(formData.latitude), 
                longitude: String(formData.longitude),
                statusAprovacaoPontoColeta: "APROVADO",
            };

            await onSubmit(payloadFinal);
            setFormData(payloadDefault);
            onClose();
        } catch (error: any) {
            console.error("Erro detalhado ao criar ponto de coleta:", error.response?.data || error);
            const serverMessage = error.response?.data?.message;
            let errorMessage = "Ocorreu um erro ao criar o ponto de coleta.";

            if (Array.isArray(serverMessage)) {
                errorMessage = serverMessage.join(", ");
            } else if (typeof serverMessage === "string") {
                errorMessage = serverMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setErro(errorMessage);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setFormData(payloadDefault);
        setErro(null);
        onClose();
    };

    const categoriasPermitidas = getCategoriasPermitidas();
    const nomeExibicaoParceiro = parceiro ? (parceiro.razaoSocial || parceiro.nome) : "";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                    <div>
                        <h2 className="font-bold text-xl text-green-primary">Novo Ponto de Coleta</h2>
                        {parceiro && (
                            <p className="text-xs text-white-500 mt-1">
                                Vinculado ao parceiro: <strong>{nomeExibicaoParceiro}</strong> ({parceiro.tipoParceiro})
                            </p>
                        )}
                    </div>
                    <button 
                        type="button"
                        onClick={handleClose} 
                        className="text-white-500 hover:text-black-primary cursor-pointer transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-red-primary" />
                    </button>
                </div>

                {erro && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-primary border border-red-primary/30">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Bloco 1: Identificação */}
                    <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
                        <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Identificação</h3>
                        
                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Nome do Ponto de Coleta *</span>
                            <input
                                type="text"
                                value={formData.nomePontoColeta}
                                onChange={(e) => atualizarCampo("nomePontoColeta", e.target.value)}
                                className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="Ex: Restaurante Central - Cozinha"
                                disabled={loading}
                                required
                            />
                        </label>
                    </div>

                    {/* Bloco 2: Categoria Visual Dinâmica por Tipo de Parceiro */}
                    <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Categoria do Estabelecimento *</h3>
                            {parceiro?.tipoParceiro && (
                                <span className="text-[10px] bg-green-100 text-green-primary px-2 py-0.5 rounded-full font-semibold">
                                    Filtrado por: {parceiro.tipoParceiro}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                            {categoriasPermitidas.map(({ value, label }) => {
                                const categoriaId = Number(value);
                                const selecionada = Number(formData.categoria) === categoriaId;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => atualizarCampo("categoria", categoriaId)}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                                            selecionada
                                                ? "border-green-primary bg-green-50/80 shadow-xs"
                                                : "border-white-200 bg-white hover:border-green-200"
                                        }`}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                                            {CATEGORIA_ICON_MAP[categoriaId] || <Building2 className="w-4 h-4 text-white-400" />}
                                        </div>
                                        <span className="text-xs font-medium text-black-primary leading-tight">{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bloco 3: Endereço & Mapa */}
                    <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
                        <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Endereço & Localização</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="block">
                                <span className="text-xs text-white-600 font-medium">CEP *</span>
                                <input
                                    type="text"
                                    value={formData.cep}
                                    onChange={(e) => atualizarCampo("cep", e.target.value)}
                                    className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                    placeholder="00000-000"
                                    disabled={loading}
                                    required
                                />
                            </label>

                            <label className="block sm:col-span-2">
                                <span className="text-xs text-white-600 font-medium">Logradouro *</span>
                                <input
                                    type="text"
                                    value={formData.logradouro}
                                    onChange={(e) => atualizarCampo("logradouro", e.target.value)}
                                    className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                    placeholder="Rua, Avenida..."
                                    disabled={loading}
                                    required
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <label className="block">
                                <span className="text-xs text-white-600 font-medium">Número *</span>
                                <input
                                    type="text"
                                    value={formData.numero}
                                    onChange={(e) => atualizarCampo("numero", e.target.value)}
                                    className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                    placeholder="123"
                                    disabled={loading}
                                    required
                                />
                            </label>

                            <label className="block sm:col-span-3">
                                <span className="text-xs text-white-600 font-medium">Complemento</span>
                                <input
                                    type="text"
                                    value={formData.complemento || ""}
                                    onChange={(e) => atualizarCampo("complemento", e.target.value)}
                                    className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                    placeholder="Apto, Sala, Bloco..."
                                    disabled={loading}
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="block">
                                <span className="text-xs text-white-600 font-medium">Bairro *</span>
                                <input
                                    type="text"
                                    value={formData.bairro}
                                    onChange={(e) => atualizarCampo("bairro", e.target.value)}
                                    className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                    placeholder="Bairro"
                                    disabled={loading}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs text-white-600 font-medium">Cidade *</span>
                                <input
                                    type="text"
                                    value={formData.cidade}
                                    onChange={(e) => atualizarCampo("cidade", e.target.value)}
                                    className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                    placeholder="Cidade"
                                    disabled={loading}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs text-white-600 font-medium">Estado</span>
                                <select
                                    value={formData.estado || ""}
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
                                    cep: formData.cep,
                                    logradouro: formData.logradouro,
                                    bairro: formData.bairro,
                                    cidade: formData.cidade,
                                    estado: formData.estado || "",
                                    numero: formData.numero,
                                    complemento: formData.complemento || "",
                                    latitude: formData.latitude ? Number(formData.latitude) : null,
                                    longitude: formData.longitude ? Number(formData.longitude) : null,
                                }}
                                onChange={atualizarEnderecoDoMapa}
                                height={240}
                            />
                        </div>
                    </div>

                    {/* Bloco 4: Parâmetros Operacionais */}
                    <div className="p-4 bg-white-50/60 rounded-xl border border-white-100 space-y-3">
                        <h3 className="text-xs font-bold text-green-primary uppercase tracking-wider">Parâmetros Operacionais</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-xs text-white-600 font-medium">Expectativa de Geração (Litros/Mês) *</span>
                                <input
                                    type="number"
                                    value={formData.expectativaGeracao}
                                    onChange={(e) => atualizarCampo("expectativaGeracao", Number(e.target.value))}
                                    className="w-full bg-white border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                    placeholder="0"
                                    disabled={loading}
                                    required
                                    min="0"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white-100">
                        <Button 
                            type="button"
                            variant="secondary" 
                            size="sm" 
                            onClick={handleClose} 
                            disabled={loading} 
                            fullWidth
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit"
                            variant="primary" 
                            size="sm" 
                            loading={loading} 
                            fullWidth
                        >
                            Salvar Ponto
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CriarPontoColetaModal;