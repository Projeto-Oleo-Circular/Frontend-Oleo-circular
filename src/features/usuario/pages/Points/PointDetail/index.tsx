import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import HeaderApp from "../../../../../components/layout/HeaderApp"
import Button from "../../../../../components/ui/Button"
import Input from "../../../../../components/ui/Input"
import Dropdown from "../../../../../components/ui/Dropdown"
import useToast from "../../../../../hooks/useToast"
import { authService } from "../../../../../services/authService"
import { pontosColetaService, type PontoColeta } from "../../../../../services/pontosColetaService"
import { getCategoriaCor } from "../../../../../constants/categoriaCores"
import { getCategoriaIdPorLabel } from "../../../../../constants/perfisParceiros"
import { getStatusPontoInfo } from "../../../../../constants/statusPonto"

const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const OPCOES_VOLUME = [
    { label: "0", value: "0" },
    { label: "20 L", value: "20" },
    { label: "50 L", value: "50" },
    { label: "100 L", value: "100" },
    { label: "1000 L", value: "1000" },
]

const CENTRO_PADRAO: [number, number] = [-15.2483, -40.2481]

function MapCenterController({ center }: { center: [number, number] }) {
    const map = useMap()
    map.flyTo(center, 16, { duration: 1 })
    return null
}

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

function buildQuery(form: { logradouro: string; numero: string; bairro: string; cidade: string; estado: string }): string {
    const ruaComNumero = form.numero ? `${form.logradouro}, ${form.numero}` : form.logradouro
    return [ruaComNumero, form.bairro, form.cidade, form.estado].filter(Boolean).join(", ")
}

function PointDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { addToast } = useToast()

    const [ponto, setPonto] = useState<PontoColeta | null>(null)
    const [loading, setLoading] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [buscandoEndereco, setBuscandoEndereco] = useState(false)

    const [editando, setEditando] = useState(false)
    const [modalExclusaoAberta, setModalExclusaoAberta] = useState(false)
    const [excluindo, setExcluindo] = useState(false)

    const lastQueryRef = useRef<string>("")
    const debounceTimerRef = useRef<number | null>(null)

    const [form, setForm] = useState({
        nome: "",
        cep: "",
        logradouro: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        expectativaGeracao: "",
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
    })

    const [posicao, setPosicao] = useState<[number, number]>(CENTRO_PADRAO)
    const [posicaoDefinida, setPosicaoDefinida] = useState(false)

    useEffect(() => {
        const carregar = async () => {
            if (!id) return
            try {
                const data = await pontosColetaService.buscarPontoPorId(Number(id))
                setPonto(data)
                setForm({
                    nome: data.nomePontoColeta || "",
                    cep: data.cep || "",
                    logradouro: data.logradouro || "",
                    numero: data.numero || "",
                    bairro: data.bairro || "",
                    cidade: data.cidade || "",
                    estado: data.estado || "",
                    expectativaGeracao: String(data.expectativaGeracao || ""),
                })
            } catch (error) {
                addToast("Erro ao carregar dados do ponto", "error")
            } finally {
                setLoading(false)
            }
        }
        carregar()

        const state = location.state as { editar?: boolean; abrirExclusao?: boolean } | null
            if (state?.editar) setEditando(true)
            if (state?.abrirExclusao) setModalExclusaoAberta(true)
        }, [id])

    const formatCep = (value: string): string => {
        const cleaned = value.replace(/\D/g, "").slice(0, 8)
        if (cleaned.length > 5) {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
        }
        return cleaned
    }

    const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        if (fieldErrors[name as keyof typeof fieldErrors]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }))
        }
        if (name === "cep") {
            const formatted = formatCep(value)
            setForm((prev) => ({ ...prev, cep: formatted }))

            const cepLimpo = value.replace(/\D/g, "")
            if (cepLimpo.length === 8) {
                setBuscandoEndereco(true)
                try {
                    const endereco = await authService.buscarCep(cepLimpo)
                    const novoForm = {
                        ...form,
                        cep: formatted,
                        logradouro: endereco.logradouro || form.logradouro,
                        bairro: endereco.bairro || form.bairro,
                        cidade: endereco.cidade || form.cidade,
                        estado: endereco.estado || form.estado,
                    }
                    setForm(novoForm)

                    setFieldErrors((prev) => ({
                        ...prev,
                        cep: "",
                        logradouro: "",
                        bairro: "",
                        cidade: "",
                        estado: "",
                    }))
                } catch (error) {
                    setFieldErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }))
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

    const geocodificarCoordenadas = async (lat: number, lng: number) => {
        // Marca a posição atual como já sincronizada antes de atualizar o form,
        // pra o useEffect de digitação não disparar de novo pro mesmo endereço
        setBuscandoEndereco(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { "User-Agent": "OleoCircularApp/1.0" } }
            )
            const data = await response.json()
            if (data && data.address) {
                const addr = data.address
                const novoEndereco = {
                    logradouro: addr.road || addr.pedestrian || form.logradouro,
                    numero: form.numero,
                    bairro: addr.suburb || addr.neighbourhood || form.bairro,
                    cidade: addr.city || addr.town || addr.village || form.cidade,
                    estado: normalizarUF(addr.state) || form.estado,
                }
                lastQueryRef.current = buildQuery(novoEndereco)

                setForm((prev) => ({
                    ...prev,
                    ...novoEndereco,
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
            if (editando) {
                geocodificarCoordenadas(novaPosicao[0], novaPosicao[1])
            }
        }

        useEffect(() => {
            if (!editando) return
            if (!form.logradouro || !form.cidade || !form.estado) return

            const query = buildQuery(form)
            if (!query || query === lastQueryRef.current) return

            if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)

            debounceTimerRef.current = window.setTimeout(async () => {
                setBuscandoEndereco(true)
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
                    setBuscandoEndereco(false)
                }
            }, 800)

            return () => {
                if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)
            }
    }, [editando, form.logradouro, form.numero, form.bairro, form.cidade, form.estado])


    const validateForm = (): boolean => {
        let hasError = false
        const errors = {
            nome: "",
            cep: "",
            logradouro: "",
            numero: "",
            bairro: "",
            cidade: "",
            estado: "",
            expectativaGeracao: "",
        }

        if (!form.nome.trim()) {
            errors.nome = "Nome do estabelecimento é obrigatório"
            hasError = true
        }

        const cleanedCep = form.cep.replace(/\D/g, "")
        if (!cleanedCep) {
            errors.cep = "CEP é obrigatório"
            hasError = true
        } else if (cleanedCep.length !== 8) {
            errors.cep = "CEP deve conter 8 dígitos"
            hasError = true
        }

        if (!form.logradouro.trim()) {
            errors.logradouro = "Rua é obrigatória"
            hasError = true
        }

        if (!form.numero.trim()) {
            errors.numero = "Número é obrigatório"
            hasError = true
        }

        if (!form.bairro.trim()) {
            errors.bairro = "Bairro é obrigatório"
            hasError = true
        }

        if (!form.cidade.trim()) {
            errors.cidade = "Cidade é obrigatória"
            hasError = true
        }

        if (!form.expectativaGeracao) {
            errors.expectativaGeracao = "Selecione uma expectativa de geração"
            hasError = true
        }

        setFieldErrors(errors)
        return !hasError
    }

    const handleSalvar = async () => {
        if (!ponto) return

        if (!validateForm()) {
            return
        }

        try {
            setSalvando(true)
            const atualizado = await pontosColetaService.atualizarPontoColeta(ponto.id, {
                nomePontoColeta: form.nome.trim(),
                cep: form.cep.replace(/\D/g, ""),
                logradouro: form.logradouro.trim(),
                numero: form.numero.trim(),
                bairro: form.bairro.trim(),
                cidade: form.cidade.trim(),
                estado: normalizarUF(form.estado.trim()),
                expectativaGeracao: Number(form.expectativaGeracao),
                
            })
            setPonto(atualizado)
            setEditando(false)
            addToast("Ponto atualizado com sucesso!", "success")
        } catch (error: any) {
            addToast(error.response?.data?.message || "Erro ao salvar alterações", "error")
        } finally {
            setSalvando(false)
        }
    }

    const handleCancelarEdicao = () => {
        if (!ponto) return
        setForm({
            nome: ponto.nomePontoColeta || "",
            cep: ponto.cep || "",
            logradouro: ponto.logradouro || "",
            numero: ponto.numero || "",
            bairro: ponto.bairro || "",
            cidade: ponto.cidade || "",
            estado: ponto.estado || "",
            expectativaGeracao: String(ponto.expectativaGeracao || ""),
            
        })
        setFieldErrors({
            nome: "",
            cep: "",
            logradouro: "",
            numero: "",
            bairro: "",
            cidade: "",
            estado: "",
            expectativaGeracao: "",
        })
        setEditando(false)
    }

    const handleExcluir = async () => {
        if (!ponto) return
        try {
            setExcluindo(true)
            await pontosColetaService.excluirPontoColeta(ponto.id)
            addToast("Ponto excluído com sucesso", "success")
            navigate("/my-points")
        } catch (error: any) {
            addToast(error.response?.data?.message || "Erro ao excluir ponto", "error")
            setExcluindo(false)
            setModalExclusaoAberta(false)
        }
    }

    if (loading || !ponto) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const categoriaId = getCategoriaIdPorLabel(ponto.categoria || "")
    const cor = getCategoriaCor(categoriaId ?? -1)
    const status = getStatusPontoInfo(ponto.statusAprovacaoPontoColeta)

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background relative">
            <HeaderApp />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={() => navigate("/my-points")}
                            className="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-green-primary">Detalhes do Ponto</h1>
                    </div>

                    <div className={`rounded-2xl p-5 flex flex-col items-center text-center gap-2 ${cor.bg}`}>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white ${cor.text}`}>
                            {ponto.categoria}
                        </span>
                        <h2 className="text-lg font-bold text-black-primary">{ponto.nomePontoColeta}</h2>
                        <p className="text-xs text-white-600 flex items-center gap-1">
                            {ponto.logradouro}, {ponto.bairro}, {ponto.cidade} - {ponto.estado}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                            {status.label}
                        </span>
                    </div>

                    <div>
                        <div className={!editando ? "pointer-events-none opacity-60" : ""}>
                            <Dropdown
                                placeholder="Expectativa de geração (L)"
                                options={OPCOES_VOLUME}
                                value={form.expectativaGeracao}
                                onChange={handleVolumeChange}
                            />
                        </div>
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
                            disabled={!editando}
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
                            disabled={!editando || buscandoEndereco}
                            error={fieldErrors.cep}
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
                            disabled={!editando || buscandoEndereco}
                            error={fieldErrors.estado}
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
                            disabled={!editando || buscandoEndereco}
                            error={fieldErrors.cidade}
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
                            disabled={!editando || buscandoEndereco}
                            error={fieldErrors.logradouro}
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
                            disabled={!editando || buscandoEndereco}
                            error={fieldErrors.bairro}
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
                            disabled={!editando}
                            error={fieldErrors.numero}
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-white-200 overflow-hidden mt-2">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white-100">
                            <div className="flex items-center gap-2">
                                <img 
                                    src="/assets/icons/icon-local.svg" 
                                    alt="Localização" 
                                    className="w-5 h-5" 
                                />
                                <span className="text-xs font-bold text-white-600 tracking-wider">
                                    LOCALIZAÇÃO
                                </span>
                            </div>
                    
                            <div className="flex items-center gap-1 text-white-400 text-xs font-medium">
                                <img 
                                    src="/assets/icons/icon-longLat.svg" 
                                    alt="Coordenadas" 
                                    className="w-4 h-4 opacity-60" 
                                />
                                <span>
                                {posicao[0].toFixed(5)}, {posicao[1].toFixed(5)}
                                </span>
                            </div>
                        </div>
                    
                        <div className="w-full h-64">
                            <MapContainer
                                center={posicao}
                                zoom={posicaoDefinida ? 16 : 12}
                                zoomControl={false}
                                attributionControl={false}
                                className="w-full h-full z-0"
                            >
                                <MapCenterController center={posicao} />
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <DraggableMarker position={posicao} onChange={handlePosicaoChange} />
                            </MapContainer>
                        </div>
                    
                        <div className="flex items-center gap-2 px-4 py-3 border-t border-white-100 bg-white">
                            <span className="text-base leading-none">💡</span>
                                <p className="text-xs font-medium text-white-600">
                                    Arraste o marcador azul para ajustar a posição exata
                                </p>
                            </div>
                        </div>

                    <div className="flex flex-col gap-3">
                        {!editando ? (
                            <>
                                <Button onClick={() => setEditando(true)} variant="primary" fullWidth>
                                    Editar ponto
                                </Button>
                                <Button onClick={() => setModalExclusaoAberta(true)} variant="danger" fullWidth>
                                    Excluir ponto
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={handleSalvar} loading={salvando} variant="primary" fullWidth>
                                    Salvar alterações
                                </Button>
                                <Button onClick={handleCancelarEdicao} variant="secondary" fullWidth disabled={salvando}>
                                    Cancelar
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {modalExclusaoAberta && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl animate-fade-in-up">
                        <img
                            src="/assets/fundo-popUp-superior.svg"
                            alt=""
                            className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none opacity-90"
                        />
                        <img
                            src="/assets/fundo-popUp-inferior.svg"
                            alt=""
                            className="absolute -bottom-10 -left-10 w-40 h-40 object-contain pointer-events-none opacity-90"
                        />

                        <div className="relative z-10 flex flex-col gap-4 pt-2">
                            <div>
                                <h3 className="text-xl font-bold text-green-primary mb-2">Excluir Ponto</h3>
                                <p className="text-sm text-white-600 leading-relaxed">
                                    Tem certeza que deseja excluir este ponto de coleta?
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleExcluir}
                                    loading={excluindo}
                                    variant="danger"
                                    fullWidth
                                >
                                    Excluir
                                </Button>
                                <Button
                                    onClick={() => setModalExclusaoAberta(false)}
                                    variant="outline"
                                    fullWidth
                                    disabled={excluindo}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PointDetail