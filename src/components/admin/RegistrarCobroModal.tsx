"use client";

import React, { useState } from "react";
import { X, DollarSign, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UnidadBase {
  id: string;
  numero_uf: number;
  piso_depto: string;
  propietario_nombre: string;
}

interface RegistrarCobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidades: UnidadBase[];
  onCobroExitoso: () => void;
}

export default function RegistrarCobroModal({ isOpen, onClose, unidades, onCobroExitoso }: RegistrarCobroModalProps) {
  const [unidadId, setUnidadId] = useState("");
  const [monto, setMonto] = useState("");
  
  // Asumimos el mes actual para simplificar
  const periodoMes = new Date().getMonth() + 1;
  const periodoAnio = new Date().getFullYear();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadId || !monto) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidadId,
          monto,
          periodoMes,
          periodoAnio,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al registrar el cobro");
      }

      setSuccess(true);
      setTimeout(() => {
        onCobroExitoso();
        onClose();
        setSuccess(false);
        setUnidadId("");
        setMonto("");
      }, 1500);

    } catch (err) {
      setError("Ocurrió un error. Verifica los datos e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-slide-up">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>Registrar Cobro Manual</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Cobro registrado exitosamente en la BD!</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Unidad Funcional
            </label>
            <select
              value={unidadId}
              onChange={(e) => setUnidadId(e.target.value)}
              disabled={loading || success}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Seleccionar departamento...</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  UF {u.numero_uf} - {u.piso_depto} ({u.propietario_nombre})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Monto Pagado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="Ej. 45000"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                disabled={loading || success}
                className="w-full h-11 pl-8 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>Guardar e Impactar Saldos</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
