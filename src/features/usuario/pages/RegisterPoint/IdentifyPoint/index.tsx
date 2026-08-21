import { useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import HeaderApp from "../../../../../components/layout/HeaderApp"
import Button from "../../../../../components/ui/Button"
import Input from "../../../../../components/ui/Input"
import useToast from "../../../../../hooks/useToast"
import { authService } from "../../../../../services/authService"
import { pontosColetaService, type CriarPontoColetaPayload } from "../../../../../services/pontosColetaService"
import type { PerfilParceiro, EstabelecimentoTag } from "../../../../../constants/perfisParceiros"


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
    { label: "0", value: 0 },
    { label: "20 L", value: 20 },
    { label: "50 L", value: 50 },
    { label: "100 L", value: 100 },
    { label: "1000 L", value: 1000 },
]

const CENTRO_PADRAO: [number, number] = [-15.2483, -40.2481] // mesmo default da LandingPage

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
    // ...
    // única mudança no JSX: trocar todas as ocorrências de `perfil.totalSteps` por `totalSteps`
    // ex: style={{ width: `${(2 / totalSteps) * 100}%` }}
    // e: <p className="text-xs text-white-500 text-center">Passo 2 de {totalSteps}</p>
    const navigate = useNavigate()
    const { addToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [buscandoEndereco, setBuscandoEndereco] = useState(false)

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

    const [posicao, setPosicao] = useState<[number, number]>(CENTRO_PADRAO)
    const [posicaoDefinida, setPosicaoDefinida] = useState(false)

    const formatCep = (value: string): string => {
        const cleaned = value.replace(/\D/g, "").slice(0, 8)
        if (cleaned.length > 5) {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
        }
        return cleaned
    }

    const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

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

                if (novoForm.logradouro && novoForm.cidade) {
                    geocodificarEndereco(`${novoForm.logradouro}, ${novoForm.cidade}`)
                }
            } catch (error) {
                addToast("CEP não encontrado", "error")
            } finally {
                setBuscandoEndereco(false)
            }
        }
        return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
}

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const geocodificarEndereco = async (query: string) => {
        setBuscandoEndereco(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
                { headers: { "User-Agent": "OleoCircularApp/1.0" } }
            )
            const data = await response.json()
            if (data && data.length > 0) {
                const { lat, lon } = data[0]
                setPosicao([parseFloat(lat), parseFloat(lon)])
                setPosicaoDefinida(true)
            }
        } catch (error) {
            console.error("Erro ao geocodificar endereço:", error)
        } finally {
            setBuscandoEndereco(false)
        }
    }

    const handleCepBlur = async () => {
        const cepLimpo = form.cep.replace(/\D/g, "")
        if (cepLimpo.length !== 8) return

        try {
            const endereco = await authService.buscarCep(cepLimpo)
            const novoForm = {
                ...form,
                logradouro: endereco.logradouro || form.logradouro,
                bairro: endereco.bairro || form.bairro,
                cidade: endereco.cidade || form.cidade,
                estado: endereco.estado || form.estado,
            }
            setForm(novoForm)

            const queryEndereco = `${novoForm.logradouro}, ${novoForm.cidade}`
            if (novoForm.logradouro && novoForm.cidade) {
                geocodificarEndereco(queryEndereco)
            }
        } catch (error) {
            addToast("Não foi possível encontrar o endereço para este CEP", "error")
        }
    }

    const handleSubmit = async () => {
        if (!form.nome || !form.cep || !form.logradouro || !form.numero || !form.bairro || !form.cidade || !form.expectativaGeracao) {
            addToast("Preencha todos os campos obrigatórios", "error")
            return
        }

        const payload: CriarPontoColetaPayload = {
            nomePontoColeta: form.nome.trim(),
            categoria: categoria.categoriaId,
            cep: form.cep.replace(/\D/g, ""),
            logradouro: form.logradouro.trim(),
            numero: form.numero.trim(),
            bairro: form.bairro.trim(),
            cidade: form.cidade.trim(),
            estado: form.estado.trim() || undefined,
            expectativaGeracao: Number(form.expectativaGeracao),
            // latitude: posicao[0],
            //longitude: posicao[1],
            // ^ ativa quando o back-end aceitar esses campos
        }       

        try {
            setLoading(true)
            await pontosColetaService.criarPontoColeta(payload)
            addToast("Ponto de coleta enviado para aprovação!", "success")
            navigate("/my-points")
        } catch (error: any) {
            addToast(error.response?.data?.message || "Erro ao cadastrar ponto de coleta", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <HeaderApp />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-8">

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 bg-green-primary text-white rounded-full flex items-center justify-center shadow-md shrink-0"
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

                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-extrabold text-white-500 tracking-widest">
                            IDENTIFICAÇÃO DO PONTO
                        </p>

                        <Input type="text" placeholder="Nome do estabelecimento" name="nome" value={form.nome} onChange={handleChange} />
                        <Input type="text" placeholder="CEP" name="cep" value={form.cep} onChange={handleChange} />
                        <Input type="text" placeholder="Rua" name="logradouro" value={form.logradouro} onChange={handleChange} />
                        <Input type="text" placeholder="Número" name="numero" value={form.numero} onChange={handleChange} />
                        <Input type="text" placeholder="Bairro" name="bairro" value={form.bairro} onChange={handleChange} />
                        <Input type="text" placeholder="Cidade" name="cidade" value={form.cidade} onChange={handleChange} />

                        <select
                            name="expectativaGeracao"
                            value={form.expectativaGeracao}
                            onChange={handleSelectChange}
                            className="w-full px-4 py-3 rounded-xl border border-white-200 bg-white text-black-primary"
                        >
                            <option value="">Selecione um volume</option>
                            {OPCOES_VOLUME.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-extrabold text-white-500 tracking-widest">
                                LOCALIZAÇÃO
                            </p>
                            {buscandoEndereco && (
                                <span className="text-xs text-white-500">Buscando...</span>
                            )}
                        </div>

                        <div className="w-full h-56 rounded-x1 overflow-hidden border border-white-200">
                            <MapContainer
                                center={posicao}
                                zoom={posicaoDefinida ? 16 : 12}
                                zoomControl={false}
                                className="w-full h-full z-0"
                            >
                                <MapCenterController center={posicao} />
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <DraggableMarker position={posicao} onChange={setPosicao} />
                            </MapContainer>
                        </div>
                        <p className="text-xs text-white-500">
                            Arraste o marcador para ajustar a posição exata
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <Button onClick={handleSubmit} loading={loading} variant="primary" fullWidth>
                            Avançar
                        </Button>
                        <Button onClick={onBack} variant="secondary" fullWidth disabled={loading}>
                            Voltar
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default IdentifyPoint