"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Building2,
  Wrench,
  User,
  Send,
  ShieldCheck,
} from "lucide-react";
import { TicketItem } from "./NuevoTicketModal";

interface DetalleTicketModalProps {
  ticket: TicketItem | null;
  onClose: () => void;
  onAddComment: (ticketId: number, nuevoComentario: string) => void;
}

export default function DetalleTicketModal({
  ticket,
  onClose,
  onAddComment,
}: DetalleTicketModalProps) {
  const [comentarioTexto, setComentarioTexto] = useState("");

  if (!ticket) return null;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentarioTexto.trim()) return;
    onAddComment(ticket.id, comentarioTexto.trim());
    setComentarioTexto("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del Ticket */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {ticket.ticket_code}
            </span>
            <span className="text-xs text-slate-400">• {ticket.fecha_creacion}</span>
            <span className="text-xs text-slate-400">• UF 0{ticket.numero_uf}</span>

            {ticket.estado === "resuelto" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resuelto
              </span>
            ) : ticket.estado === "en_revision" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200">
                <Clock className="w-3.5 h-3.5" />
                En Revisión / Asignado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Abierto
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {ticket.titulo}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Sector: {ticket.ubicacion || "Áreas Comunes"} • Categoría: </span>
            <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
              {ticket.categoria}
            </span>
          </p>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="py-4 space-y-5 overflow-y-auto flex-1 pr-1">
          {/* Descripción Inicial */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Descripción del Incidente
            </span>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {ticket.descripcion}
            </p>
          </div>

          {/* Tarjeta de Proveedor Asignado (si aplica) */}
          {ticket.proveedor_asignado && (
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                    Proveedor Homologado Asignado
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {ticket.proveedor_asignado}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                SLA Activo
              </span>
            </div>
          )}

          {/* Historial de Avances y Comentarios */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Línea de Tiempo & Comentarios de Seguimiento
            </h4>

            <div className="space-y-3">
              {ticket.comentarios && ticket.comentarios.length > 0 ? (
                ticket.comentarios.map((c) => {
                  const esAdmin = c.rol === "admin";
                  const esProveedor = c.rol === "proveedor";

                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        esAdmin
                          ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-800/40 ml-2"
                          : esProveedor
                          ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40 ml-2"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {esAdmin ? (
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          ) : esProveedor ? (
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{c.autor}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{c.fecha}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {c.texto}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Aún no hay comentarios en este ticket.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Input para agregar comentario */}
        <form
          onSubmit={handleSubmitComment}
          className="pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex gap-2"
        >
          <input
            type="text"
            value={comentarioTexto}
            onChange={(e) => setComentarioTexto(e.target.value)}
            placeholder="Escribir un mensaje o consulta a la administración..."
            className="flex-1 h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!comentarioTexto.trim()}
            className="inline-flex items-center gap-1.5 px-4 h-10 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow transition disabled:opacity-50 cursor-pointer"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
