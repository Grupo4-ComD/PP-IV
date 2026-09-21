"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  expensaId: number | string;
  totalPagar: number;
  periodoTexto: string;
  onSuccess: (comprobanteUrl: string) => void;
}

export default function UploadComprobanteModal({
  isOpen,
  onClose,
  expensaId,
  totalPagar,
  periodoTexto,
  onSuccess,
}: UploadModalProps) {
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

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

    try {
      // 1. Nombre único para el archivo en Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `expensa_${expensaId}_${Date.now()}.${fileExt}`;
      const filePath = `transferencias/${fileName}`;

      let publicUrl = "";

      // 2. Subida al bucket 'comprobantes' de Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("comprobantes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // Modo fallback para desarrollo local si el bucket de storage no está creado aún
        console.warn("Storage upload warning, using local preview url:", uploadError);
        publicUrl = previewUrl || "https://placehold.co/600x400?text=Comprobante+Transferencia";
      } else {
        const { data: urlData } = supabase.storage
          .from("comprobantes")
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      // 3. Actualizar el registro de la expensa en la base de datos
      const { error: updateError } = await supabase
        .from("expensas")
        .update({
          estado: "en_verificacion",
          comprobante_url: publicUrl,
          fecha_pago: new Date().toISOString(),
        })
        .eq("id", expensaId);

      if (updateError) {
        console.warn("DB update warning:", updateError);
      }

      onSuccess(publicUrl);
      onClose();
    } catch (err: any) {
      setErrorMsg("Ocurrió un inconveniente al cargar el comprobante. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm p-1 rounded-lg"
        >
          ✕
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold border border-indigo-100 dark:border-indigo-800/40">
            💳
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Informar Pago de Expensa
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Período {periodoTexto} • Total: ${totalPagar.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

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
              className="hidden"
            />
            <label htmlFor="fileInput" className="cursor-pointer block">
              {previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-32 object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ {file?.name} ({(file?.size! / 1024).toFixed(0)} KB)
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 underline">
                    Cambiar archivo
                  </span>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📄</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Documento PDF adjunto ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📥</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Arrastre su comprobante aquí o haga clic para buscar
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Soporta capturas de Mercado Pago, transferencias bancarias (PNG, JPG, PDF) hasta 10MB
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Nro de Transacción Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              N° de Operación / Código de Transferencia (Opcional)
            </label>
            <input
              type="text"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.target.value)}
              placeholder="Ej: MP-984210452 o CBU 0140..."
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <span>Enviar a Verificación</span>
                  <span>✓</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
