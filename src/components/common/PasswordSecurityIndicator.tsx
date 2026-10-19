"use client";

import React from "react";
import { Check, X, ShieldAlert, ShieldCheck } from "lucide-react";
import { validatePasswordSecurity } from "@/lib/validators/password";

interface PasswordSecurityIndicatorProps {
  password: string;
  showAlways?: boolean;
}

export default function PasswordSecurityIndicator({
  password,
  showAlways = false,
}: PasswordSecurityIndicatorProps) {
  if (!password && !showAlways) return null;

  const validation = validatePasswordSecurity(password);

  const requirements = [
    { label: "Mínimo 6 caracteres", met: validation.hasMinLength },
    { label: "Una mayúscula (A-Z)", met: validation.hasUppercase },
    { label: "Una minúscula (a-z)", met: validation.hasLowercase },
    { label: "Un número (0-9)", met: validation.hasNumber },
    { label: "Un carácter especial (!@#$%...)", met: validation.hasSpecialChar },
  ];

  const getStrengthColor = () => {
    if (validation.score <= 2) return "bg-rose-500";
    if (validation.score <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = () => {
    if (validation.score === 5) return "Contraseña Segura";
    if (validation.score >= 3) return "Seguridad Media";
    return "Contraseña Débil";
  };

  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs space-y-2 mt-2 transition-all">
      {/* Barra de progreso de fortaleza */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {validation.isValid ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            )}
            Requisitos de seguridad:
          </span>
          <span
            className={
              validation.isValid
                ? "text-emerald-600 dark:text-emerald-400"
                : validation.score >= 3
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(validation.score / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Lista de Requisitos Interactiva */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              req.met
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                req.met
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
              }`}
            >
              {req.met ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5" />}
            </span>
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
