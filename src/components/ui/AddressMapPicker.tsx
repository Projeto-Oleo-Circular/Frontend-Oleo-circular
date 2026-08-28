import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet-src.esm";

// Corrige os ícones padrão do Leaflet em projetos com Vite/Webpack.
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

/**
 * Retorna a sigla do estado.
 *
 * O Nominatim normalmente retorna:
 * ISO3166-2-lvl4: "BR-BA"
 */
function getStateCode(address: NominatimAddress): string {
  const isoCode = address["ISO3166-2-lvl4"];

  if (isoCode) {
    return isoCode.split("-").pop()?.toUpperCase() || "";
  }

  if (address.state_code) {
    return address.state_code.toUpperCase();
  }

  return address.state || "";
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

  /*
   * Mantém a versão atualizada do onChange sem precisar
   * reconstruir o mapa quando o componente pai renderizar.
   */
  const onChangeRef = useRef(onChange);

  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [locatingAddress, setLocatingAddress] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /**
   * Converte coordenadas em endereço.
   */
  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<void> => {
    setLocatingAddress(true);
    setSearchError("");

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: latitude.toString(),
        lon: longitude.toString(),
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            "Accept-Language": "pt-BR",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao consultar o endereço");
      }

      const data = await response.json();
      const address: NominatimAddress = data.address || {};

      onChangeRef.current({
        latitude,
        longitude,

        logradouro:
          address.road ||
          address.pedestrian ||
          address.residential ||
          "",

        numero: address.house_number || "",

        bairro:
          address.suburb ||
          address.neighbourhood ||
          address.village ||
          "",

        cidade:
          address.city ||
          address.town ||
          address.municipality ||
          address.county ||
          "",

        estado: getStateCode(address),
        cep: address.postcode || "",
      });
    } catch (error) {
      console.error("Erro na geocodificação reversa:", error);

      // Mesmo que o endereço não seja encontrado, salva as coordenadas.
      onChangeRef.current({
        latitude,
        longitude,
      });

      setSearchError(
        "A localização foi marcada, mas não foi possível encontrar o endereço."
      );
    } finally {
      setLocatingAddress(false);
    }
  };

  /**
   * Inicializa o mapa apenas uma vez.
   */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const hasCoordinates =
      value.latitude !== null &&
      value.longitude !== null &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude);

    const initialCenter: [number, number] = hasCoordinates
      ? [value.latitude as number, value.longitude as number]
      : defaultCenter;

    const initialZoom = hasCoordinates ? 17 : 4;

    const map = L.map(mapContainerRef.current).setView(
      initialCenter,
      initialZoom
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    const marker = L.marker(initialCenter, {
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLatLng();

      void reverseGeocode(
        position.lat,
        position.lng
      );
    });

    map.on("click", (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;

      marker.setLatLng([lat, lng]);
      map.panTo([lat, lng]);

      void reverseGeocode(lat, lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    /*
     * Evita mapa parcialmente cinza quando ele é renderizado
     * dentro de modal, aba ou elemento flexível.
     */
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      window.clearTimeout(resizeTimer);

      marker.off();
      map.off();
      map.remove();

      markerRef.current = null;
      mapRef.current = null;
    };

    // O mapa deve ser criado somente uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Converte o endereço pesquisado em coordenadas.
   */
  const handleSearch = async (): Promise<void> => {
    const query = searchText.trim();

    if (!query || searching) {
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        q: query,
        countrycodes: "br",
        limit: "1",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "Accept-Language": "pt-BR",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar endereço");
      }

      const results: NominatimSearchResult[] =
        await response.json();

      if (!results.length) {
        setSearchError(
          "Endereço não encontrado. Tente informar rua, número, cidade e estado."
        );
        return;
      }

      const result = results[0];
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      const address = result.address || {};

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error("Coordenadas inválidas");
      }

      mapRef.current?.setView(
        [latitude, longitude],
        17
      );

      markerRef.current?.setLatLng([
        latitude,
        longitude,
      ]);

      onChangeRef.current({
        latitude,
        longitude,

        logradouro:
          address.road ||
          address.pedestrian ||
          address.residential ||
          "",

        numero: address.house_number || "",

        bairro:
          address.suburb ||
          address.neighbourhood ||
          address.village ||
          "",

        cidade:
          address.city ||
          address.town ||
          address.municipality ||
          address.county ||
          "",

        estado: getStateCode(address),
        cep: address.postcode || "",
      });
    } catch (error) {
      console.error("Erro ao pesquisar endereço:", error);

      setSearchError(
        "Não foi possível buscar o endereço agora."
      );
    } finally {
      setSearching(false);
    }
  };

  /**
   * Atualiza o marcador quando as coordenadas forem
   * modificadas externamente pelo componente pai.
   */
  useEffect(() => {
    if (
      value.latitude === null ||
      value.longitude === null ||
      !Number.isFinite(value.latitude) ||
      !Number.isFinite(value.longitude) ||
      !markerRef.current ||
      !mapRef.current
    ) {
      return;
    }

    const currentPosition =
      markerRef.current.getLatLng();

    const latitudeChanged =
      Math.abs(currentPosition.lat - value.latitude) >
      0.000001;

    const longitudeChanged =
      Math.abs(currentPosition.lng - value.longitude) >
      0.000001;

    if (latitudeChanged || longitudeChanged) {
      markerRef.current.setLatLng([
        value.latitude,
        value.longitude,
      ]);

      mapRef.current.setView(
        [value.latitude, value.longitude],
        17
      );
    }
  }, [value.latitude, value.longitude]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSearch();
            }
          }}
          placeholder="Digite rua, número, cidade e estado"
          aria-label="Pesquisar endereço no mapa"
          className="flex-1 border border-white-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-primary"
        />

        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching || !searchText.trim()}
          className="px-4 py-2 rounded-lg bg-green-primary text-white text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {searchError && (
        <p
          role="alert"
          className="text-red-500 text-xs mb-2"
        >
          {searchError}
        </p>
      )}

      <p className="text-xs text-black-100 mb-2">
        Clique no mapa ou arraste o marcador para
        preencher o endereço automaticamente.
      </p>

      {locatingAddress && (
        <p className="text-xs text-green-primary mb-2">
          Localizando endereço...
        </p>
      )}

      <div
        ref={mapContainerRef}
        style={{
          height: `${height}px`,
          width: "100%",
        }}
        className="rounded-xl overflow-hidden border border-white-100"
      />
    </div>
  );
}

export default AddressMapPicker;