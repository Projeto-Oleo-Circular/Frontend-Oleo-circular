// components/modal/ConcluirSolicitacaoModal.tsx
import { useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button";

interface ConcluirSolicitacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (volumeColetado: number) => Promise<void>;
  loading?: boolean;
  solicitacaoId: number;
}

export function ConcluirSolicitacaoModal({ isOpen, onClose, onSubmit, loading, solicitacaoId }: ConcluirSolicitacaoModalProps) {
  const [volumeColetado, setVolumeColetado] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!volumeColetado) return;
    await onSubmit(Number(volumeColetado));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-down">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-green-primary">Concluir coleta — #{solicitacaoId}</h2>
          <button onClick={onClose} className="text-red-primary hover:text-red-hover cursor-pointer" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block mb-4">
          <span className="text-sm text-gray-700 font-medium">Volume coletado (litros)</span>
          <input
            type="number"
            min={1}
            placeholder="Ex: 50"
            value={volumeColetado}
            onChange={(e) => setVolumeColetado(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-green-primary"
          />
        </label>

        <div className="flex gap-3">
          <Button variant="danger" size="sm" onClick={onClose} disabled={loading} fullWidth>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            onClick={handleSubmit}
            disabled={!volumeColetado || loading}
            fullWidth
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}