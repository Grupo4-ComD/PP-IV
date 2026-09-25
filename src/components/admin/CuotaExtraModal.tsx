import React, { useState } from "react";
import { X, Users } from "lucide-react";

interface CuotaExtraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CuotaExtraModal({ isOpen, onClose }: CuotaExtraModalProps) {
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [concepto, setConcepto] = useState("");
  const [montoTotal, setMontoTotal] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ periodo, concepto, montoTotal });
    alert("Cuota extraordinaria distribuida (mock)");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cuota Extra (Todos)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-500 mb-4 bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-100 dark:border-purple-900/50">
            Se distribuirá el "Monto Total" entre todas las unidades según su porcentaje de copropiedad (m2).
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Período</label>
              <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo</label>
              <input type="text" placeholder="Ej: Pintura frente" value={concepto} onChange={(e) => setConcepto(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monto Total a Distribuir $</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" />
            </div>

            <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition mt-4">
              Distribuir por %
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
