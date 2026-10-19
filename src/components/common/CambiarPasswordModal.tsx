"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Lock,
} from "lucide-react";
import PasswordSecurityIndicator from "./PasswordSecurityIndicator";
import { validatePasswordSecurity } from "@/lib/validators/password";

interface CambiarPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CambiarPasswordModal({
  isOpen,
  onClose,
}: CambiarPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const validation = validatePasswordSecurity(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword) {
      setErrorMsg("Ingrese la nueva contraseña.");
      return;
    }

    if (!validation.isValid) {
      setErrorMsg(
        "La contraseña no cumple con todos los requisitos de seguridad: " +
          validation.errors.join(", ")
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor verifíquelas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña.");
      }

      setSuccessMsg("¡Contraseña actualizada con éxito!");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1600);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-800/40">
            <KeyRound className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cambiar Contraseña
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Establece una clave segura para proteger tu cuenta
            </p>
          </div>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nueva Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva clave"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checklist interactivo de seguridad */}
            <PasswordSecurityIndicator password={newPassword} showAlways={true} />
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {confirmPassword && (
              <p
                className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                  passwordsMatch
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400"
                }`}
              >
                {passwordsMatch ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !validation.isValid || !passwordsMatch}
              className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Actualizar Clave</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
