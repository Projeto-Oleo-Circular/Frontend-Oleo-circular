import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet-src.esm";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface AddressMapValue {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
  latitude: number | null;
  longitude: number | null;
}

interface AddressMapPickerProps {
  value: AddressMapValue;
  onChange: (data: Partial<AddressMapValue>) => void;
  defaultCenter?: [number, number];
  height?: number;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  residential?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  city?: string;
  town?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  "ISO3166-2-lvl4"?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

const DEFAULT_CENTER: [number, number] = [-14.235, -51.9253];

function getStateCode(address: NominatimAddress): string {
  const isoCode = address["ISO3166-2-lvl4"];
  if (isoCode) return isoCode.split("-").pop()?.toUpperCase() || "";
  if (address.state_code) return address.state_code.toUpperCase();
  return address.state || "";
}

function buildQuery(value: AddressMapValue): string {
  const ruaComNumero = value.numero ? `${value.logradouro}, ${value.numero}` : value.logradouro;
  return [ruaComNumero, value.bairro, value.cidade, value.estado].filter(Boolean).join(", ");
}

function AddressMapPicker({
  value,
  onChange,
  defaultCenter = DEFAULT_CENTER,
  height = 320,
}: AddressMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  const [locatingAddress, setLocatingAddress] = useState(false);
  const [syncingFromInputs, setSyncingFromInputs] = useState(false);
  const [syncError, setSyncError] = useState("");

  // Evita chamadas repetidas pro mesmo endereço já buscado
  const lastQueryRef = useRef<string>("");
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<void> => {
    setLocatingAddress(true);
    setSyncError("");

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: latitude.toString(),
        lon: longitude.toString(),
        addressdetails: "1",
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { "Accept-Language": "pt-BR" },
      });

      if (!response.ok) throw new Error("Erro ao consultar o endereço");

      const data = await response.json();
      const address: NominatimAddress = data.address || {};
      const enderecoEncontrado = `${address.road || address.pedestrian || address.residential || ""}, ${address.house_number || ""}, ${address.suburb || address.neighbourhood || address.village || ""}, ${address.city || address.town || address.municipality || address.county || ""}, ${getStateCode(address)}`;

      // Marca esse endereço como já sincronizado, pra não disparar o geocoding direto de novo
      lastQueryRef.current = buildQuery({
        ...value,
        logradouro: address.road || address.pedestrian || address.residential || "",
        numero: address.house_number || "",
        bairro: address.suburb || address.neighbourhood || address.village || "",
        cidade: address.city || address.town || address.municipality || address.county || "",
        estado: getStateCode(address),
      });

      onChangeRef.current({
        latitude,
        longitude,
        logradouro: address.road || address.pedestrian || address.residential || "",
        numero: address.house_number || "",
        bairro: address.suburb || address.neighbourhood || address.village || "",
        cidade: address.city || address.town || address.municipality || address.county || "",
        estado: getStateCode(address),
        cep: address.postcode || "",
      });
    } catch (error) {
      console.error("Erro na geocodificação reversa:", error);
      onChangeRef.current({ latitude, longitude });
      setSyncError("A localização foi marcada, mas não foi possível encontrar o endereço.");
    } finally {
      setLocatingAddress(false);
    }
  };

  // Inicializa o mapa uma única vez
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const hasCoordinates =
      value.latitude !== null && value.longitude !== null &&
      Number.isFinite(value.latitude) && Number.isFinite(value.longitude);

    const initialCenter: [number, number] = hasCoordinates
      ? [value.latitude as number, value.longitude as number]
      : defaultCenter;
    const initialZoom = hasCoordinates ? 17 : 4;

    const map = L.map(mapContainerRef.current).setView(initialCenter, initialZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(initialCenter, { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      void reverseGeocode(position.lat, position.lng);
    });

    map.on("click", (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
      void reverseGeocode(lat, lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100);

    return () => {
      window.clearTimeout(resizeTimer);
      marker.off();
      map.off();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 👇 NOVO: sincroniza mapa quando os campos de endereço mudam nos inputs
  useEffect(() => {
    if (!value.logradouro || !value.cidade || !value.estado) return;

    const query = buildQuery(value);
    if (!query || query === lastQueryRef.current) return;

    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = window.setTimeout(async () => {
      setSyncingFromInputs(true);
      setSyncError("");

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          q: query,
          countrycodes: "br",
          limit: "1",
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { "Accept-Language": "pt-BR" },
        });

        if (!response.ok) throw new Error("Erro ao geocodificar endereço");

        const results: NominatimSearchResult[] = await response.json();
        if (!results.length) {
          setSyncError("Endereço digitado não foi encontrado no mapa.");
          return;
        }

        const latitude = Number(results[0].lat);
        const longitude = Number(results[0].lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        lastQueryRef.current = query;

        mapRef.current?.setView([latitude, longitude], 17);
        markerRef.current?.setLatLng([latitude, longitude]);

        // Só manda lat/lng pro pai — não sobrescreve o que o usuário está digitando
        onChangeRef.current({ latitude, longitude });
      } catch (error) {
        console.error("Erro ao sincronizar endereço digitado com o mapa:", error);
      } finally {
        setSyncingFromInputs(false);
      }
    }, 800); // debounce: espera parar de digitar

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [value.logradouro, value.numero, value.bairro, value.cidade, value.estado]);

  // Atualiza marcador quando lat/lng mudam externamente (ex: prop controlada de fora)
  useEffect(() => {
    if (
      value.latitude === null || value.longitude === null ||
      !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude) ||
      !markerRef.current || !mapRef.current
    ) return;

    const currentPosition = markerRef.current.getLatLng();
    const latitudeChanged = Math.abs(currentPosition.lat - value.latitude) > 0.000001;
    const longitudeChanged = Math.abs(currentPosition.lng - value.longitude) > 0.000001;

    if (latitudeChanged || longitudeChanged) {
      markerRef.current.setLatLng([value.latitude, value.longitude]);
      mapRef.current.setView([value.latitude, value.longitude], 17);
    }
  }, [value.latitude, value.longitude]);

  return (
    <div className="w-full">
      <p className="text-xs text-black-100 mb-2">
        O mapa acompanha automaticamente o endereço digitado. Se preferir, também é possível clicar
        no mapa ou arrastar o marcador para ajustar a posição manualmente.
      </p>

      {syncingFromInputs && (
        <p className="text-xs text-green-primary mb-2">Localizando endereço no mapa...</p>
      )}
      {locatingAddress && (
        <p className="text-xs text-green-primary mb-2">Identificando endereço da posição marcada...</p>
      )}
      {syncError && (
        <p role="alert" className="text-red-500 text-xs mb-2">{syncError}</p>
      )}

      <div
        ref={mapContainerRef}
        style={{ height: `${height}px`, width: "100%" }}
        className="rounded-xl overflow-hidden border border-white-100"
      />
    </div>
  );
}

export default AddressMapPicker;