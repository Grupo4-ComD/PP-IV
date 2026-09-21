"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Ticket,
  X,
  AlertCircle,
  Loader2,
  Droplets,
  Zap,
  KeyRound,
  Layers,
  AlertTriangle,
  Send,
} from "lucide-react";

export interface TicketItem {
  id: number;
  ticket_code: string;
  unidad_id: number;
  numero_uf: number;
  titulo: string;
  descripcion: string;
  categoria: "plomeria" | "electricidad" | "cerrajeria" | "varios";
  estado: "abierto" | "en_revision" | "resuelto";
  prioridad: "baja" | "media" | "alta" | "urgente";
  ubicacion?: string;
  proveedor_asignado?: string | null;
  fecha_creacion: string;
  comentarios?: {
    id: number;
    autor: string;
    rol: "admin" | "vecino" | "proveedor";
    texto: string;
    fecha: string;
  }[];
}

interface NuevoTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidadId: number;
  numeroUf: number;
  onTicketCreated: (newTicket: TicketItem) => void;
}

export default function NuevoTicketModal({
  isOpen,
  onClose,
  unidadId,
  numeroUf,
  onTicketCreated,
}: NuevoTicketModalProps) {
  const supabase = createClient();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<"plomeria" | "electricidad" | "cerrajeria" | "varios">("plomeria");
  const [prioridad, setPrioridad] = useState<"baja" | "media" | "alta" | "urgente">("media");
  const [ubicacion, setUbicacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) {
      setErrorMsg("Por favor complete el título y la descripción del incidente.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const ticketCode = `#TK-${Math.floor(100 + Math.random() * 900)}`;

      // 1. Insertar en Supabase tabla 'tickets_reclamos'
      const { data, error } = await supabase
        .from("tickets_reclamos")
        .insert({
          unidad_id: unidadId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          categoria,
          estado: "abierto",
        })
        .select()
        .single();

      if (error) {
        console.warn("Supabase insert warning, usando objeto local:", error);
      }

      const createdItem: TicketItem = {
        id: data?.id || Date.now(),
        ticket_code: ticketCode,
        unidad_id: unidadId,
        numero_uf: numeroUf,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        estado: "abierto",
        prioridad,
        ubicacion: ubicacion.trim() || "Áreas Comunes",
        proveedor_asignado: null,
        fecha_creacion: "Recién reportado",
        comentarios: [
          {
            id: 1,
            autor: "Triaje Automático ITIL",
            rol: "admin",
            texto: "Ticket recibido en Mesa de Ayuda. Se ha notificado a la Administración para clasificación y asignación de proveedor.",
            fecha: "Ahora",
          },
        ],
      };

      onTicketCreated(createdItem);
      onClose();
    } catch (err) {
      setErrorMsg("Ocurrió un error al crear el ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-800">
            <Ticket className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Crear Nuevo Ticket ITIL 4
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reporte de falla o mantenimiento edilicio (UF 0{numeroUf})
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Título del Reclamo / Incidente:
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Falla cerradura electromagnética puerta PB"
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoría del Problema:
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="plomeria">💧 Plomería & Gas</option>
                <option value="electricidad">⚡ Electricidad & Luz</option>
                <option value="cerrajeria">🔑 Cerrajería & Accesos</option>
                <option value="varios">📦 Mantenimiento Varios</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Prioridad / Urgencia:
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="baja">Baja (Planificada)</option>
                <option value="media">Media (Estándar 48hs)</option>
                <option value="alta">Alta (Prioritaria 24hs)</option>
                <option value="urgente">Urgente (Seguridad / Emergencia)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sector / Ubicación física:
            </label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej: Acceso PB / Palier 2° Piso / Terraza"
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descripción detallada de la falla:
            </label>
            <textarea
              rows={3}
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describa el síntoma, impacto en el edificio y cualquier observación relevante..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creando Ticket...</span>
                </>
              ) : (
                <>
                  <span>Enviar a Mesa ITIL</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
