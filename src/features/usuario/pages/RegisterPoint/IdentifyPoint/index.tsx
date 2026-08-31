import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import HeaderApp from "../../../../../components/layout/HeaderApp"
import Button from "../../../../../components/ui/Button"
import Input from "../../../../../components/ui/Input"
import Dropdown from "../../../../../components/ui/Dropdown"
import useToast from "../../../../../hooks/useToast"
import { authService } from "../../../../../services/authService"
import { pontosColetaService, type CriarPontoColetaPayload } from "../../../../../services/pontosColetaService"
import type { EstabelecimentoTag } from "../../../../../constants/perfisParceiros"

const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

interface Props {
    categoria: EstabelecimentoTag
    totalSteps: number
    onBack: () => void
}

const OPCOES_VOLUME = [
    { label: "0", value: "0" },
    { label: "20 L", value: "20" },
    { label: "50 L", value: "50" },
    { label: "100 L", value: "100" },
    { label: "1000 L", value: "1000" },
]

const CENTRO_PADRAO: [number, number] = [-15.2483, -40.2481]

const ESTADOS_MAP: Record<string, string> = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
    "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
    "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
    "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
    "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
    "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
    "Sergipe": "SE", "Tocantins": "TO"
}

function normalizarUF(estado?: string): string {
    if (!estado) return ""
    if (estado.length === 2) return estado.toUpperCase()
    return ESTADOS_MAP[estado] || estado.slice(0, 2).toUpperCase()
}

function buildQuery(form: { logradouro: string; numero: string; bairro: string; cidade: string; estado: string }): string {
    const ruaComNumero = form.numero ? `${form.logradouro}, ${form.numero}` : form.logradouro
    return [ruaComNumero, form.bairro, form.cidade, form.estado].filter(Boolean).join(", ")
}

function MapCenterController({ center }: { center: [number, number] }) {
    const map = useMap()
    map.flyTo(center, 16, { duration: 1 })
    return null
}

function DraggableMarker({
    position,
    onChange,
}: {
    position: [number, number]
    onChange: (pos: [number, number]) => void
}) {
    useMapEvents({})
    return (
        <Marker
            position={position}
            icon={customIcon}
            draggable
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target
                    const { lat, lng } = marker.getLatLng()
                    onChange([lat, lng])
                },
            }}
        />
    )
}

function IdentifyPoint({ categoria, totalSteps, onBack }: Props) {
    const navigate = useNavigate()
    const { addToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [buscandoEndereco, setBuscandoEndereco] = useState(false)
    const [sincronizandoMapa, setSincronizandoMapa] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    const [form, setForm] = useState({
        nome: "",
        cep: "",
        logradouro: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        expectativaGeracao: "",
        complemento: "",
    })

    const [fieldErrors, setFieldErrors] = useState({
        nome: "",
        cep: "",
        logradouro: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        expectativaGeracao: "",
        complemento: "",
    })

    const [posicao, setPosicao] = useState<[number, number]>(CENTRO_PADRAO)
    const [posicaoDefinida, setPosicaoDefinida] = useState(false)

    // Evita loop entre "digitou endereço → busca no mapa" e "mapa devolveu endereço → dispara busca de novo"
    const lastQueryRef = useRef<string>("")
    const debounceTimerRef = useRef<number | null>(null)

    const formatCep = (value: string): string => {
        const cleaned = value.replace(/\D/g, "").slice(0, 8)
        if (cleaned.length > 5) {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
        }
        return cleaned
    }

    // Mapa → inputs (clique ou arrastar marcador)
    const geocodificarCoordenadas = async (lat: number, lng: number) => {
        setBuscandoEndereco(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { "User-Agent": "OleoCircularApp/1.0" } }
            )
            const data = await response.json()
            if (data && data.address) {
                const addr = data.address
                const novoForm = {
                    logradouro: addr.road || addr.pedestrian || "",
                    numero: form.numero, // Nominatim reverse não costuma trazer número; mantém o que já tinha
                    bairro: addr.suburb || addr.neighbourhood || "",
                    cidade: addr.city || addr.town || addr.village || "",
                    estado: normalizarUF(addr.state) || "",
                }

                // Marca essa combinação como já sincronizada, pra o efeito de digitação não disparar de novo
                lastQueryRef.current = buildQuery(novoForm)

                setForm((prev) => ({
                    ...prev,
                    logradouro: novoForm.logradouro || prev.logradouro,
                    bairro: novoForm.bairro || prev.bairro,
                    cidade: novoForm.cidade || prev.cidade,
                    estado: novoForm.estado || prev.estado,
                    cep: addr.postcode ? formatCep(addr.postcode) : prev.cep,
                }))
            }
        } catch (error) {
            console.error("Erro ao converter coordenadas em endereço:", error)
        } finally {
            setBuscandoEndereco(false)
        }
    }

    const handlePosicaoChange = (novaPosicao: [number, number]) => {
        setPosicao(novaPosicao)
        setPosicaoDefinida(true)
        geocodificarCoordenadas(novaPosicao[0], novaPosicao[1])
    }

    // Inputs → mapa (digitação, com debounce — substitui o antigo handleInputBlur)
    useEffect(() => {
        if (!form.logradouro || !form.cidade || !form.estado) return

        const query = buildQuery(form)
        if (!query || query === lastQueryRef.current) return

        if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)

        debounceTimerRef.current = window.setTimeout(async () => {
            setSincronizandoMapa(true)
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
                    { headers: { "User-Agent": "OleoCircularApp/1.0" } }
                )
                const data = await response.json()
                if (data && data.length > 0) {
                    lastQueryRef.current = query
                    setPosicao([parseFloat(data[0].lat), parseFloat(data[0].lon)])
                    setPosicaoDefinida(true)
                }
            } catch (error) {
                console.error("Erro ao geocodificar endereço digitado:", error)
            } finally {
                setSincronizandoMapa(false)
            }
        }, 800)

        return () => {
            if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)
        }
    }, [form.logradouro, form.numero, form.bairro, form.cidade, form.estado])

    const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        if (fieldErrors[name as keyof typeof fieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [name]: "" }))
        }

        if (name === "cep") {
            const formatted = formatCep(value)
            setForm((prev) => ({ ...prev, cep: formatted }))

            const cepLimpo = value.replace(/\D/g, "")
            if (cepLimpo.length === 8) {
                setBuscandoEndereco(true)
                try {
                    const endereco = await authService.buscarCep(cepLimpo)
                    setForm((prev) => ({
                        ...prev,
                        cep: formatted,
                        logradouro: endereco.logradouro || prev.logradouro,
                        bairro: endereco.bairro || prev.bairro,
                        cidade: endereco.cidade || prev.cidade,
                        estado: normalizarUF(endereco.estado) || prev.estado,
                    }))
                    setFieldErrors(prev => ({
                        ...prev, cep: "", logradouro: "", bairro: "", cidade: "", estado: ""
                    }))
                    // Não precisa mais chamar geocoding aqui manualmente — o useEffect acima
                    // já detecta a mudança de logradouro/cidade/estado e sincroniza o mapa sozinho.
                } catch (error) {
                    setFieldErrors(prev => ({ ...prev, cep: "CEP não encontrado" }))
                } finally {
                    setBuscandoEndereco(false)
                }
            }
            return
        }
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleVolumeChange = (value: string) => {
        setForm((prev) => ({ ...prev, expectativaGeracao: value }))
        if (fieldErrors.expectativaGeracao) {
            setFieldErrors((prev) => ({ ...prev, expectativaGeracao: "" }))
        }
    }

    const validateForm = (): boolean => {
        let hasError = false
        const errors = {
            nome: "", cep: "", logradouro: "", numero: "", bairro: "",
            cidade: "", estado: "", expectativaGeracao: "", complemento: "",
        }

        if (!form.nome.trim()) { errors.nome = "Nome do estabelecimento é obrigatório"; hasError = true }

        const cleanedCep = form.cep.replace(/\D/g, "")
        if (!cleanedCep) { errors.cep = "CEP é obrigatório"; hasError = true }
        else if (cleanedCep.length !== 8) { errors.cep = "CEP deve conter 8 dígitos"; hasError = true }

        if (!form.logradouro.trim()) { errors.logradouro = "Rua é obrigatória"; hasError = true }
        if (!form.bairro.trim()) { errors.bairro = "Bairro é obrigatório"; hasError = true }
        if (!form.cidade.trim()) { errors.cidade = "Cidade é obrigatória"; hasError = true }
        if (!form.expectativaGeracao) { errors.expectativaGeracao = "Selecione uma expectativa de geração"; hasError = true }

        setFieldErrors(errors)
        return !hasError
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        const categoriaNum = Number(categoria?.categoriaId ?? categoria)

        const payload: CriarPontoColetaPayload = {
            nomePontoColeta: form.nome.trim(),
            categoria: categoriaNum,
            cep: form.cep.replace(/\D/g, ""),
            logradouro: form.logradouro.trim(),
            numero: form.numero.trim() || "S/N",
            bairro: form.bairro.trim(),
            cidade: form.cidade.trim(),
            estado: normalizarUF(form.estado.trim()) || undefined,
            expectativaGeracao: Number(form.expectativaGeracao) || 0,
            capacidadeBombona: Number(form.expectativaGeracao) || 50,
            nivelAtualPct: 0,
            statusBombona: "VAZIA",
            complemento: form.complemento?.trim() || "",
            latitude: String(posicao[0]),
            longitude: String(posicao[1])
        }

        try {
            setLoading(true)
            await pontosColetaService.criarPontoColeta(payload)
            setShowSuccessModal(true)
        } catch (error: any) {
            addToast(error.response?.data?.message || "Erro ao cadastrar ponto de coleta", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background relative">
            <HeaderApp />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative z-0">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Novo Ponto</h1>
                    </div>

                    <p className="text-sm text-white-500 -mt-2">
                        Informe o nome e o endereço para personalizar o cadastro
                    </p>

                    <div className="flex flex-col gap-1">
                        <div className="w-full h-2 bg-white-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-primary rounded-full transition-all duration-300"
                                style={{ width: `${(2 / totalSteps) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-white-500 text-center">
                            Passo 2 de {totalSteps}
                        </p>
                    </div>

                    <div className="w-full">
                        <p className="text-xs font-bold text-white-500 tracking-widest pb-3">
                            IDENTIFICAÇÃO DO PONTO
                        </p>

                        <div className="mb-3">
                            <Dropdown
                                placeholder="Expectativa de geração (L)"
                                options={OPCOES_VOLUME}
                                value={form.expectativaGeracao}
                                onChange={handleVolumeChange}
                            />
                            {fieldErrors.expectativaGeracao && (
                                <p className="text-red-500 text-xs mt-1 font-medium pl-2">
                                    {fieldErrors.expectativaGeracao}
                                </p>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <Input
                                type="text"
                                icon="icon-razaoSocial"
                                placeholder="Nome do estabelecimento"
                                name="nome"
                                value={form.nome}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.nome}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-CEP"
                                placeholder={buscandoEndereco ? "Buscando CEP..." : "CEP"}
                                name="cep"
                                value={form.cep}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.cep}
                                disabled={buscandoEndereco}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-estado"
                                placeholder="Estado"
                                name="estado"
                                value={form.estado}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.estado}
                                disabled={buscandoEndereco}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-city"
                                placeholder="Cidade"
                                name="cidade"
                                value={form.cidade}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.cidade}
                                disabled={buscandoEndereco}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-rua"
                                placeholder="Rua"
                                name="logradouro"
                                value={form.logradouro}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.logradouro}
                                disabled={buscandoEndereco}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-bairro"
                                placeholder="Bairro"
                                name="bairro"
                                value={form.bairro}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.bairro}
                                disabled={buscandoEndereco}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-number"
                                placeholder="Número"
                                name="numero"
                                value={form.numero}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.numero}
                            />
                            <hr className="border-white-100" />

                            <Input
                                type="text"
                                icon="icon-complemento"
                                placeholder="Complemento (opcional)"
                                name="complemento"
                                value={form.complemento || ""}
                                onChange={handleChange}
                                noBorder
                                error={fieldErrors.complemento}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-white-200 overflow-hidden mt-2">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white-100">
                            <div className="flex items-center gap-2">
                                <img src="/assets/icons/icon-local.svg" alt="Localização" className="w-5 h-5" />
                                <span className="text-xs font-bold text-white-600 tracking-wider">
                                    LOCALIZAÇÃO
                                </span>
                            </div>

                            <div className="flex items-center gap-1 text-white-400 text-xs font-medium">
                                <img src="/assets/icons/icon-longLat.svg" alt="Coordenadas" className="w-4 h-4 opacity-60" />
                                <span>{posicao[0].toFixed(5)}, {posicao[1].toFixed(5)}</span>
                            </div>
                        </div>

                        {sincronizandoMapa && (
                            <p className="text-xs text-green-primary px-4 pt-2">Localizando endereço no mapa...</p>
                        )}

                        <div className="w-full h-64">
                            <MapContainer
                                center={posicao}
                                zoom={posicaoDefinida ? 16 : 12}
                                zoomControl={false}
                                attributionControl={false}
                                className="w-full h-full z-0"
                            >
                                <MapCenterController center={posicao} />
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <DraggableMarker position={posicao} onChange={handlePosicaoChange} />
                            </MapContainer>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 border-t border-white-100 bg-white">
                            <span className="text-base leading-none">💡</span>
                            <p className="text-xs font-medium text-white-600">
                                O mapa acompanha o endereço digitado — se preferir, arraste o marcador para ajustar manualmente
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button type="button" onClick={handleSubmit} variant="primary" fullWidth disabled={loading}>
                            {loading ? "Cadastrando..." : "Confirmar"}
                        </Button>
                        <Button type="button" onClick={onBack} variant="secondary" fullWidth disabled={loading}>
                            Voltar
                        </Button>
                    </div>
                </div>
            </main>

            {showSuccessModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl animate-fade-in-up">
                        <img src="/assets/fundo-popUp-superior.svg" alt="" className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none opacity-90" />
                        <img src="/assets/fundo-popUp-inferior.svg" alt="" className="absolute -bottom-10 -left-10 w-40 h-40 object-contain pointer-events-none opacity-90" />

                        <div className="relative z-10 flex flex-col items-center text-center pt-4">
                            <div className="w-16 h-16 flex items-center justify-center mb-4">
                                <img src="/assets/icons/icon-relogio.svg" alt="Relógio" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="text-xl font-bold text-green-700 mb-2">Solicitação enviada!</h3>
                            <p className="text-sm text-green-primary leading-relaxed mb-6 px-2">
                                Aguarde a aprovação da <strong>Equipe Óleo Circular</strong> para o cadastro do ponto de coleta. Você receberá um e-mail em breve com a confirmação.
                            </p>
                            <Button onClick={() => navigate("/my-points")} variant="primary" fullWidth>
                                Ir para os meus pontos
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default IdentifyPoint