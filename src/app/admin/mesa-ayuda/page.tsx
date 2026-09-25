"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  Wrench,
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Vote,
  FileText,
  UploadCloud,
  Send,
  X,
  Search,
  Filter,
  Layers,
  Droplets,
  Zap,
  KeyRound,
  Loader2,
  Building2,
  ShieldAlert,
} from "lucide-react";

interface Ticket {
  id: number;
  unidad_id: number;
  titulo: string;
  descripcion: string;
  categoria: "plomeria" | "electricidad" | "cerrajeria" | "varios";
  estado: "abierto" | "en_revision" | "resuelto";
  fecha_creacion: string;
  unidades?: {
    numero_uf: number;
    piso_depto: string;
    propietario_nombre: string;
  };
  presupuestos?: {
    id: number;
    proveedor_nombre: string;
    monto_total: number;
    estado: string;
    votos_favor: number;
  }[];
}

export default function AdminMesaAyudaPage() {
  const supabase = createClient();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  // Modal para Asignar Proveedor & Cargar Presupuesto a Votación
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [detallePresupuesto, setDetallePresupuesto] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [submittingBudget, setSubmittingBudget] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Cargar tickets de Supabase
  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tickets_reclamos")
          .select(`
            id,
            unidad_id,
            titulo,
            descripcion,
            categoria,
            estado,
            fecha_creacion,
            unidades (
              numero_uf,
              piso_depto,
              propietario_nombre
            )
          `)
          .order("id", { ascending: false });

        if (data && !error) {
          setTickets(data as any);
        }
      } catch (err) {
        console.warn("Error cargando tickets:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [supabase]);

  // Manejar creación de presupuesto y envío a votación de vecinos
  const handleGuardarPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSeleccionado || !proveedorNombre || !montoTotal) return;

    setSubmittingBudget(true);
    setModalSuccess(null);

    try {
      const { error: errorPresupuesto } = await supabase
        .from("presupuestos_votacion")
        .insert({
          ticket_id: ticketSeleccionado.id,
          proveedor_nombre: proveedorNombre,
          monto_total: parseFloat(montoTotal) || 0,
          detalle: detallePresupuesto,
          pdf_url: pdfUrl || `https://storage.calle425.com/presupuestos/${proveedorNombre.toLowerCase().replace(/\s+/g, "_")}.pdf`,
          estado: "en_votacion",
          votos_favor: 0,
        });

      // Actualizar estado del ticket a 'en_revision'
      await supabase
        .from("tickets_reclamos")
        .update({ estado: "en_revision" })
        .eq("id", ticketSeleccionado.id);

      // Actualizar estado local
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketSeleccionado.id ? { ...t, estado: "en_revision" } : t
        )
      );

      setModalSuccess("¡Presupuesto publicado con éxito para la votación de las 9 UFs!");
      setTimeout(() => {
        setTicketSeleccionado(null);
        setProveedorNombre("");
        setMontoTotal("");
        setDetallePresupuesto("");
        setPdfUrl("");
        setModalSuccess(null);
      }, 1500);
    } catch (err) {
      console.warn("Error guardando presupuesto:", err);
    } finally {
      setSubmittingBudget(false);
    }
  };

  // Cambiar estado directo del ticket
  const handleCambiarEstado = async (ticketId: number, nuevoEstado: "abierto" | "en_revision" | "resuelto") => {
    try {
      await supabase
        .from("tickets_reclamos")
        .update({ estado: nuevoEstado })
        .eq("id", ticketId);

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, estado: nuevoEstado } : t))
      );
    } catch (err) {
      console.warn("Error actualizando ticket:", err);
    }
  };

  const ticketsFiltrados = tickets.filter((t) => {
    const matchEstado = filtroEstado === "todos" || t.estado === filtroEstado;
    const matchCat = filtroCategoria === "todos" || t.categoria === filtroCategoria;
    const matchBusqueda =
      busqueda === "" ||
      t.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.unidades?.propietario_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.unidades?.piso_depto.toLowerCase().includes(busqueda.toLowerCase());

    return matchEstado && matchCat && matchBusqueda;
  });

  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case "plomeria":
        return <Droplets className="w-3.5 h-3.5 text-sky-500" />;
      case "electricidad":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "cerrajeria":
        return <KeyRound className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Admin */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl">
        {/* Header Stitch 08 */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" />
              <span>Gestión ITIL • Consorcio Calle 425</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mesa de Ayuda & Proveedores
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gestione incidentes edilicios, asigne cotizaciones y publique presupuestos para votación comunitaria.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/expensas/generar"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
            >
              <Vote className="w-4 h-4 text-emerald-500" />
              <span>Ver Votaciones Activas</span>
            </Link>
          </div>
        </header>

        {/* KPIs ITIL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Incidentes</span>
              <LifeBuoy className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {tickets.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Histórico Consorcio</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abiertos s/ Asignar</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
              {tickets.filter((t) => t.estado === "abierto").length}
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Requieren cotización</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Votación Vecinal</span>
              <Vote className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-sky-600 font-mono">
              {tickets.filter((t) => t.estado === "en_revision").length}
            </div>
            <span className="text-[11px] text-sky-700 dark:text-sky-400 mt-1">Esperando consenso</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resueltos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
              {tickets.filter((t) => t.estado === "resuelto").length}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Conformidad firmada</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar reclamo o UF..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierto">Abiertos</option>
              <option value="en_revision">En Revisión / Votación</option>
              <option value="resuelto">Resueltos</option>
            </select>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
            >
              <option value="todos">Todas las Categorías</option>
              <option value="plomeria">Plomería</option>
              <option value="electricidad">Electricidad</option>
              <option value="cerrajeria">Cerrajería</option>
              <option value="varios">Varios</option>
            </select>
          </div>
        </div>

        {/* Listado de Incidentes ITIL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="space-y-4">
            {ticketsFiltrados.map((ticket) => (
              <div
                key={ticket.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="space-y-2 min-w-0 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono">
                      TK-{ticket.id.toString().padStart(3, "0")}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                      {getCategoriaIcon(ticket.categoria)}
                      <span>{ticket.categoria}</span>
                    </span>

                    <span className="text-xs text-slate-500 font-medium">
                      UF {ticket.unidades?.numero_uf || ticket.unidad_id} ({ticket.unidades?.piso_depto}) • {ticket.unidades?.propietario_nombre}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {ticket.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {ticket.descripcion}
                  </p>
                </div>

                {/* Acciones y Estado */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  {/* Badge Estado */}
                  <div>
                    {ticket.estado === "abierto" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Abierto</span>
                      </span>
                    )}
                    {ticket.estado === "en_revision" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300">
                        <Vote className="w-3.5 h-3.5" />
                        <span>En Votación</span>
                      </span>
                    )}
                    {ticket.estado === "resuelto" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resuelto</span>
                      </span>
                    )}
                  </div>

                  {/* Botón para Asignar Presupuesto */}
                  {ticket.estado !== "resuelto" && (
                    <button
                      type="button"
                      onClick={() => {
                        setTicketSeleccionado(ticket);
                        setProveedorNombre("");
                        setMontoTotal("");
                        setDetallePresupuesto("");
                        setPdfUrl("");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cargar Cotización</span>
                    </button>
                  )}

                  {/* Toggle a Resuelto */}
                  {ticket.estado !== "resuelto" ? (
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado(ticket.id, "resuelto")}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 text-xs font-medium transition cursor-pointer"
                      title="Marcar como resuelto"
                    >
                      Cerrar Incidente
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado(ticket.id, "abierto")}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-500 hover:text-slate-700 text-xs transition cursor-pointer"
                    >
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal para Cargar Presupuesto de Proveedor y Enviar a Votación */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setTicketSeleccionado(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono">
                TK-{ticketSeleccionado.id.toString().padStart(3, "0")}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Asignar Cotización de Proveedor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {ticketSeleccionado.titulo}
              </p>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleGuardarPresupuesto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Empresa o Proveedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Hidro-Soluciones La Plata S.R.L."
                  value={proveedorNombre}
                  onChange={(e) => setProveedorNombre(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto Total Cotizado ($ ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="185000"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    className="w-full h-10 pl-8 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detalle del Trabajo y Garantía
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descripción de los materiales, mano de obra y meses de garantía..."
                  value={detallePresupuesto}
                  onChange={(e) => setDetallePresupuesto(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enlace al PDF o Comprobante Adjunto (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://storage.calle425.com/presupuestos/cotizacion.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketSeleccionado(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingBudget}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {submittingBudget ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Vote className="w-3.5 h-3.5" />
                      <span>Publicar a Votación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
