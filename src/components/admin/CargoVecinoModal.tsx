import React, { useState } from "react";
import { X, UserPlus } from "lucide-react";

interface Unidad {
  id: string;
  numero_uf: number;
  piso_depto: string;
}

interface CargoVecinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidades: Unidad[];
  onCargoExitoso?: () => void;
}

export default function CargoVecinoModal({ isOpen, onClose, unidades, onCargoExitoso }: CargoVecinoModalProps) {
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [unidadId, setUnidadId] = useState("");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");

  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadId || !concepto || !monto) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/cargos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodo, unidadId, concepto, monto })
      });
      
      if (res.ok) {
        if (onCargoExitoso) onCargoExitoso();
        onClose();
        setUnidadId("");
        setConcepto("");
        setMonto("");
      } else {
        alert("Error al aplicar cargo");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cargo a Vecino</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Período</label>
                <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unidad</label>
                <select value={unidadId} onChange={(e) => setUnidadId(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                  <option value="">Seleccionar...</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>UF {u.numero_uf} ({u.piso_depto})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo / Concepto</label>
              <input type="text" placeholder="Ej: Reparación caño interno" value={concepto} onChange={(e) => setConcepto(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monto $</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition mt-4 disabled:opacity-50">
              {loading ? "Aplicando..." : "Aplicar Cargo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
