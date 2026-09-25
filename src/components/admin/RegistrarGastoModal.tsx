import React, { useState } from "react";
import { X, TrendingDown } from "lucide-react";

interface RegistrarGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrarGastoModal({ isOpen, onClose }: RegistrarGastoModalProps) {
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("A");
  const [usaFondo, setUsaFondo] = useState(false);
  const [noRestaCaja, setNoRestaCaja] = useState(false);
  const [comprobante, setComprobante] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect with API
    let finalConcepto = concepto;
    if (usaFondo) finalConcepto += " [FONDO]";
    if (noRestaCaja) finalConcepto += " _sd";

    console.log({ periodo, concepto: finalConcepto, monto, tipo, comprobante });
    alert("Gasto registrado (mock)" + (comprobante ? " con comprobante adjunto" : " sin comprobante"));
    onClose();
  };

  const gastosFijos = ["Edenor", "Aysa", "Seguro", "Internet", "Impuestos Caja"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Gasto</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {gastosFijos.map(gf => (
              <button 
                key={gf} 
                onClick={() => setConcepto(gf)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                + {gf}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Período</label>
              <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Concepto</label>
              <input type="text" placeholder="Ej: Arreglo de cañería" value={concepto} onChange={(e) => setConcepto(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={usaFondo} onChange={(e) => setUsaFondo(e.target.checked)} className="rounded text-rose-600 focus:ring-rose-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Usar Fondo Reserva</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={noRestaCaja} onChange={(e) => setNoRestaCaja(e.target.checked)} className="rounded text-rose-600 focus:ring-rose-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">No restar de caja (_sd)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monto $</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                  <option value="A">Ordinario (A)</option>
                  <option value="B">Extraordinario (B)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Adjuntar Comprobante (Opcional)</label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={(e) => setComprobante(e.target.files ? e.target.files[0] : null)} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-400 cursor-pointer" 
              />
            </div>

            <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md transition mt-4">
              Registrar Gasto
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
