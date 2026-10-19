"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  X,
  Loader2,
  Percent,
  Building2,
  ArrowRight,
} from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  expensaId: number | string;
  unidadId?: number | string;
  periodoMes?: number;
  periodoAnio?: number;
  totalPagar: number;
  periodoTexto: string;
  onSuccess: (comprobanteUrl: string) => void;
}

export default function UploadComprobanteModal({
  isOpen,
  onClose,
  expensaId,
  unidadId,
  periodoMes,
  periodoAnio,
  totalPagar,
  periodoTexto,
  onSuccess,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  // Regla de Negocio: Deducción 0,6% Mercado Pago
  const comisionMp = Number((totalPagar * 0.006).toFixed(2));
  const netoAcreditado = Number((totalPagar - comisionMp).toFixed(2));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg(null);
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMsg("Formato no soportado. Por favor adjunte archivo PNG, JPG o PDF.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg("El archivo es demasiado grande (máximo 10 MB).");
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Por favor seleccione el comprobante de transferencia o pago.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Subida segura al servidor (/api/upload-comprobante -> Supabase Storage bucket 'comprobantes')
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("expensaId", String(expensaId));

      const uploadRes = await fetch("/api/upload-comprobante", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(uploadErr.error || "Error al subir el comprobante al servidor.");
      }

      const { url: publicUrl } = await uploadRes.json();
      if (!publicUrl) {
        throw new Error("No se obtuvo la URL pública del comprobante.");
      }

      // 3. Conexión a la API /api/pagos para persistencia contable y conciliación (Card BP)
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidadId,
          expensaId,
          monto: totalPagar,
          montoBruto: totalPagar,
          periodoMes,
          periodoAnio,
          comprobanteUrl: publicUrl,
          origen: "vecino",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo registrar el pago en la base de datos");
      }

      setSuccessMsg("¡Comprobante recibido con éxito! La administración lo conciliará a la brevedad.");
      onSuccess(publicUrl);

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error("Error al enviar comprobante:", err);
      setErrorMsg(err.message || "Ocurrió un inconveniente al cargar el comprobante. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-800/40">
            <CreditCard className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Carga Digital de Comprobante
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Período {periodoTexto} • Total: ${totalPagar.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        {/* Alerta de Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tarjeta Informativa: Alias y Deducción 0,6% MP */}
        <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Alias bancario oficial:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">
              consorciorpena1454
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>Deducción Mercado Pago (0,6%):</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">
              -${comisionMp.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
            <span>Neto a conciliar en consorcio:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              ${netoAcreditado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Zona Drag & Drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                : file
                ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40"
            }`}
          >
            <input
              type="file"
              id="fileInput"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              disabled={loading || Boolean(successMsg)}
              className="hidden"
            />
            <label htmlFor="fileInput" className="cursor-pointer block">
              {previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-28 object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {file?.name} ({file ? (file.size / 1024).toFixed(0) : 0} KB)
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 underline">
                    Cambiar archivo
                  </span>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Documento PDF adjunto ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 stroke-[2]" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Arrastre su comprobante aquí o haga clic para buscar
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Capturas de Mercado Pago o transferencias bancarias (PNG, JPG, PDF)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Nro de Transacción Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              N° de Operación / Referencia de Transferencia (Opcional)
            </label>
            <input
              type="text"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.target.value)}
              disabled={loading || Boolean(successMsg)}
              placeholder="Ej: MP-984210452 o CBU 0140..."
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading || !file || Boolean(successMsg)}
              className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando a API...</span>
                </>
              ) : (
                <>
                  <span>Enviar a Verificación</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
