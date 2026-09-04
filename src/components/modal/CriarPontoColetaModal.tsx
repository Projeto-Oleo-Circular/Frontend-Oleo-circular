import { useState } from 'react';
import { X } from "lucide-react";
import Button from "../../components/ui/Button";

export interface CriarPontoColetaPayload {
    nomePontoColeta: string;
    categoria: number;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado?: string;
    complemento?: string | null;
    expectativaGeracao: number;
    capacidadeBombona?: number;
    nivelAtualPct?: number;
    statusBombona?: string;
    latitude?: string;
    longitude?: string;
    parceiroId?: number; // Adicionado para compatibilidade
}

interface CriarPontoColetaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CriarPontoColetaPayload) => Promise<void>;
    loading?: boolean;
    parceiroNome?: string; // Adicionado para mostrar o parceiro selecionado
}

const payloadDefault: CriarPontoColetaPayload = {
    nomePontoColeta: '',
    categoria: 0,
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',
    expectativaGeracao: 0,
    capacidadeBombona: 0,
    nivelAtualPct: 0,
    statusBombona: '',
    latitude: '',
    longitude: '',
};

export function CriarPontoColetaModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    loading, 
    parceiroNome 
}: CriarPontoColetaModalProps) {
    const [formData, setFormData] = useState<CriarPontoColetaPayload>(payloadDefault);
    const [erro, setErro] = useState<string | null>(null);

    if (!isOpen) return null;

    const atualizarCampo = (campo: keyof CriarPontoColetaPayload, valor: any) => {
        setFormData((prev) => ({
            ...prev,
            [campo]: valor,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação
        if (!formData.nomePontoColeta || !formData.categoria || !formData.cep || 
            !formData.logradouro || !formData.numero || !formData.bairro || 
            !formData.cidade || !formData.expectativaGeracao) {
            setErro("Preencha todos os campos obrigatórios.");
            return;
        }
        
        setErro(null);
        try {
            await onSubmit(formData);
            setFormData(payloadDefault); // Reset após submit
            onClose();
        } catch (error) {
            setErro("Ocorreu um erro ao criar o ponto de coleta. Tente novamente.");
        }
    };

    const handleClose = () => {
        setFormData(payloadDefault);
        setErro(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-white-100 mb-4">
                    <div>
                        <h2 className="font-bold text-xl text-green-primary">Novo Ponto de Coleta</h2>
                        {parceiroNome && (
                            <p className="text-xs text-white-500 mt-1">
                                Para o parceiro: <strong>{parceiroNome}</strong>
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="text-red-primary hover:text-red-hover cursor-pointer"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {erro && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-primary border border-red-primary/30">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block sm:col-span-2">
                            <span className="text-xs text-white-600 font-medium">Nome do Ponto de Coleta *</span>
                            <input
                                type="text"
                                value={formData.nomePontoColeta}
                                onChange={(e) => atualizarCampo("nomePontoColeta", e.target.value)}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="Ex: Restaurante Central"
                                disabled={loading}
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">CEP *</span>
                            <input
                                type="text"
                                value={formData.cep}
                                onChange={(e) => atualizarCampo("cep", e.target.value)}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="00000-000"
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
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="Cidade"
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
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="Rua, Avenida..."
                                disabled={loading}
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Número *</span>
                            <input
                                type="text"
                                value={formData.numero}
                                onChange={(e) => atualizarCampo("numero", e.target.value)}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="123"
                                disabled={loading}
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Bairro *</span>
                            <input
                                type="text"
                                value={formData.bairro}
                                onChange={(e) => atualizarCampo("bairro", e.target.value)}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="Bairro"
                                disabled={loading}
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Estado</span>
                            <select
                                value={formData.estado || ""}
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

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Complemento</span>
                            <input
                                type="text"
                                value={formData.complemento || ""}
                                onChange={(e) => atualizarCampo("complemento", e.target.value)}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="Apto, Sala..."
                                disabled={loading}
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Expectativa de Geração (kg/mês) *</span>
                            <input
                                type="number"
                                value={formData.expectativaGeracao}
                                onChange={(e) => atualizarCampo("expectativaGeracao", Number(e.target.value))}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="0"
                                disabled={loading}
                                required
                                min="0"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Capacidade da Bombona (kg)</span>
                            <input
                                type="number"
                                value={formData.capacidadeBombona || 0}
                                onChange={(e) => atualizarCampo("capacidadeBombona", Number(e.target.value))}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
                                placeholder="0"
                                disabled={loading}
                                min="0"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-white-600 font-medium">Categoria</span>
                            <select
                                value={formData.categoria}
                                onChange={(e) => atualizarCampo("categoria", Number(e.target.value))}
                                className="w-full border border-white-200 rounded-lg p-2 mt-1 text-sm focus:outline-none focus:border-green-primary bg-white"
                                disabled={loading}
                                required
                            >
                                <option value="0">Selecionar</option>
                                <option value="1">Residencial</option>
                                <option value="2">Comercial</option>
                                <option value="3">Industrial</option>
                                <option value="4">Instituição</option>
                            </select>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={handleClose} 
                            disabled={loading} 
                            fullWidth
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            loading={loading} 
                            type="submit" 
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