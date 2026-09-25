import React, { useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";

interface AjusteCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AjusteCajaModal({ isOpen, onClose }: AjusteCajaModalProps) {
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [motivo, setMotivo] = useState("");
  const [monto, setMonto] = useState("");
  const [accion, setAccion] = useState("ingreso");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ periodo, motivo, monto, accion });
    alert("Caja ajustada manualmente (mock)");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ajuste Manual de Caja</h2>
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Acción</label>
                <select value={accion} onChange={(e) => setAccion(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold">
                  <option value="ingreso">SUMAR (Ingreso)</option>
                  <option value="egreso">RESTAR (Egreso)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo del Ajuste</label>
              <input type="text" placeholder="Ej: Corrección de error bancario" value={motivo} onChange={(e) => setMotivo(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monto $</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" />
            </div>

            <button type="submit" className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition mt-4 ${accion === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
              Aplicar {accion === 'ingreso' ? 'Ingreso' : 'Descuento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
