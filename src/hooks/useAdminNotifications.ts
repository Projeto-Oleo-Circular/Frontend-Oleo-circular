import { useCallback, useEffect, useState, useRef } from "react";
import { adminPontosService } from "../services/adminPontosService";
import { adminParceiroService, type Parceiro, type ListarParceirosResponse } from "../services/adminParceiroService";
import { adminSolicitacoesService } from "../services/AdminSolicitacaoService";

export interface AdminNotificationCounts {
  requests: number;
  partners: number;
  points: number;
}

const EMPTY_COUNTS: AdminNotificationCounts = {
  requests: 0,
  partners: 0,
  points: 0,
};

const POLL_INTERVAL_MS = 5_000;

function contarParceirosPendentes(
  response: ListarParceirosResponse | Parceiro[]
): number {
  if (Array.isArray(response)) {
    return response.filter((p) => p.statusAprovacaoParceiro === "PENDENTE").length;
  }
  return response.total ?? response.items?.length ?? 0;
}

export function useAdminNotifications(): AdminNotificationCounts & { 
  refresh: () => Promise<void>;
} {
  const [counts, setCounts] = useState<AdminNotificationCounts>(EMPTY_COUNTS);
  const isFetching = useRef(false);

  const fetchCounts = useCallback(async () => {
    // Evita múltiplas chamadas simultâneas
    if (isFetching.current) return;
    
    isFetching.current = true;
    try {
      const [pontosRes, parceirosRes, solicitacoesRes] = await Promise.all([
        adminPontosService.listarPontos({
          statusAprovacao: "PENDENTE",
          page: 1,
          limit: 1,
        }),
        adminParceiroService.listarParceiros({
          statusAprovacao: "PENDENTE",
          page: 1,
          limit: 1,
        }),
        adminSolicitacoesService.listar({
          status: "AGUARDANDO",
          page: 1,
          limit: 1,
        }),
      ]);

      setCounts({
        requests: solicitacoesRes.total ?? 0,
        points: pontosRes.total ?? 0,
        partners: contarParceirosPendentes(parceirosRes),
      });
    } catch (error) {
      console.error("Erro ao buscar notificações do admin:", error);
    } finally {
      isFetching.current = false;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { ...counts, refresh };
}