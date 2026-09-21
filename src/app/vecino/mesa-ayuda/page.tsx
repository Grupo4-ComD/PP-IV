"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Droplets,
  Zap,
  KeyRound,
  Layers,
  MapPin,
  User,
  Wrench,
  MessageSquare,
  Bot,
  Star,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NuevoTicketModal, { TicketItem } from "@/components/vecino/NuevoTicketModal";
import DetalleTicketModal from "@/components/vecino/DetalleTicketModal";
import VecinoSidebar from "@/components/vecino/VecinoSidebar";

export default function MesaAyudaPage() {
  const supabase = createClient();

  const [unidad] = useState({
    id: 3,
    numero_uf: 3,
    piso_depto: "1° B",
    propietario_nombre: "Martínez, Laura",
  });

  // Lista de Tickets
  const [tickets, setTickets] = useState<TicketItem[]>([
    {
      id: 1,
      ticket_code: "#TK-104",
      unidad_id: 3,
      numero_uf: 3,
      titulo: "Falla cerradura electromagnética puerta de ingreso principal",
      descripcion:
        "La cerradura eléctrica emite un zumbido constante y no traba automáticamente al cerrar el blindex exterior. Representa un riesgo inminente de acceso indebido.",
      categoria: "cerrajeria",
      estado: "en_revision",
      prioridad: "urgente",
      ubicacion: "Acceso PB / Entrada General",
      proveedor_asignado: "Cerrajería Integral San Martín (O.T. #8834)",
      fecha_creacion: "Ayer, 16:30 hs",
      comentarios: [
        {
          id: 1,
          autor: "Martínez, Laura (UF 03)",
          rol: "vecino",
          texto: "Notamos que anoche quedó abierta de par en par. Sugiero revisión urgente del electroimán.",
          fecha: "Ayer 16:35 hs",
        },
        {
          id: 2,
          autor: "Paula Admin",
          rol: "admin",
          texto: "Ticket clasificado con prioridad Urgente. Se coordinó visita técnica con Cerrajería San Martín.",
          fecha: "Ayer 17:10 hs",
        },
        {
          id: 3,
          autor: "Cerrajería San Martín",
          rol: "proveedor",
          texto: "Visita pactada para hoy 10:00 hs con repuesto de bobina electromagnética de 300kg.",
          fecha: "Hoy 08:30 hs",
        },
      ],
    },
    {
      id: 2,
      ticket_code: "#TK-098",
      unidad_id: 5,
      numero_uf: 5,
      titulo: "Humedad en cielorraso palier piso 2",
      descripcion:
        "Se detectó una mancha circular de 40cm con desprendimiento de pintura sobre el sector frente a los ascensores. Posible filtración en caño de desagüe pluvial.",
      categoria: "plomeria",
      estado: "abierto",
      prioridad: "media",
      ubicacion: "Palier común 2° piso",
      proveedor_asignado: "HidroServicios SRL (En inspección)",
      fecha_creacion: "04 de Septiembre",
      comentarios: [
        {
          id: 1,
          autor: "Fernández, Lucía (UF 05)",
          rol: "vecino",
          texto: "Empezó a gotear luego de las lluvias del fin de semana.",
          fecha: "04 Sep 11:20 hs",
        },
        {
          id: 2,
          autor: "Paula Admin",
          rol: "admin",
          texto: "Se solicitó presupuesto y diagnóstico con cámara térmica al plomero.",
          fecha: "04 Sep 14:00 hs",
        },
      ],
    },
    {
      id: 3,
      ticket_code: "#TK-092",
      unidad_id: 1,
      numero_uf: 1,
      titulo: "Reemplazo luminaria dicroica LED acceso cochera",
      descripcion:
        "La lámpara del acceso vehicular parpadea intermitentemente impidiendo visibilidad nocturna en portón.",
      categoria: "electricidad",
      estado: "resuelto",
      prioridad: "baja",
      ubicacion: "Rampa Cochera Subsuelo",
      proveedor_asignado: "ElectroSur Instalaciones",
      fecha_creacion: "28 de Agosto",
      comentarios: [
        {
          id: 1,
          autor: "ElectroSur Instalaciones",
          rol: "proveedor",
          texto: "Se reemplazó driver y artefacto LED estanco de 18W. Funcionamiento verificado.",
          fecha: "29 Ago 16:00 hs",
        },
      ],
    },
  ]);

  // Filtros de navegación
  const [tabFiltro, setTabFiltro] = useState<"mis" | "todos" | "resueltos">("mis");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");

  // Modales
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketItem | null>(null);

  // Cargar tickets de Supabase si existen
  useEffect(() => {
    async function loadTickets() {
      try {
        const { data } = await supabase
          .from("tickets_reclamos")
          .select("*, unidades(numero_uf, piso_depto)")
          .order("id", { ascending: false });

        if (data && data.length > 0) {
          const mapped: TicketItem[] = data.map((t: any) => ({
            id: t.id,
            ticket_code: `#TK-${t.id + 100}`,
            unidad_id: t.unidad_id,
            numero_uf: t.unidades?.numero_uf || 3,
            titulo: t.titulo,
            descripcion: t.descripcion,
            categoria: t.categoria || "varios",
            estado: t.estado || "abierto",
            prioridad: "media",
            ubicacion: "Áreas Comunes",
            fecha_creacion: new Date(t.fecha_creacion).toLocaleDateString("es-AR"),
            comentarios: [],
          }));

          setTickets(mapped);
        }
      } catch (err) {
        console.warn("Usando datos locales para mesa de ayuda:", err);
      }
    }
    loadTickets();
  }, []);

  const handleTicketCreated = (newTicket: TicketItem) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleAddComment = (ticketId: number, nuevoComentario: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedComentarios = [
            ...(t.comentarios || []),
            {
              id: Date.now(),
              autor: `${unidad.propietario_nombre} (UF 0${unidad.numero_uf})`,
              rol: "vecino" as const,
              texto: nuevoComentario,
              fecha: "Recién",
            },
          ];
          return { ...t, comentarios: updatedComentarios };
        }
        return t;
      })
    );

    if (ticketSeleccionado && ticketSeleccionado.id === ticketId) {
      setTicketSeleccionado((prev) =>
        prev
          ? {
              ...prev,
              comentarios: [
                ...(prev.comentarios || []),
                {
                  id: Date.now(),
                  autor: `${unidad.propietario_nombre} (UF 0${unidad.numero_uf})`,
                  rol: "vecino",
                  texto: nuevoComentario,
                  fecha: "Recién",
                },
              ],
            }
          : null
      );
    }
  };

  // Filtrado de tickets
  const filteredTickets = tickets.filter((t) => {
    // Filtro por Tab
    if (tabFiltro === "mis" && t.unidad_id !== unidad.id) return false;
    if (tabFiltro === "resueltos" && t.estado !== "resuelto") return false;

    // Filtro por Categoría
    if (filtroCategoria !== "todas" && t.categoria !== filtroCategoria) return false;

    // Búsqueda por texto o código
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitulo = t.titulo.toLowerCase().includes(term);
      const matchDesc = t.descripcion.toLowerCase().includes(term);
      const matchCode = t.ticket_code.toLowerCase().includes(term);
      return matchTitulo || matchDesc || matchCode;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* SIDEBAR REUTILIZABLE CON ICONOS MODERNOS */}
      <VecinoSidebar unidad={unidad} />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOPBAR CON LOGO OFICIAL */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shrink-0 shadow-xs">
              <Image
                src="/logo.png"
                alt="Logo Consorcio 425"
                fill
                sizes="32px"
                className="object-contain p-0.5"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                Calle 425 • Mesa de Ayuda ITIL
              </h1>
              <p className="text-[11px] text-slate-400">
                Service Desk & Mantenimiento Edilicio
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNuevoModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Reclamo</span>
          </button>
        </header>

        {/* MAIN BODY */}
        <main className="p-6 sm:p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* Header de Sección */}
          <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span>ITIL 4 Service Desk • SLA Promedio 4.2h</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Mesa de Ayuda & Mantenimiento Edilicio
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Reporte y haga seguimiento en tiempo real de fallas e incidentes edilicios con asignación formal de proveedores homologados y acuerdos de nivel de servicio.
              </p>
            </div>
          </section>

          {/* METRIC STRIP */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tickets Activos
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">03</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 2 resueltos
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tiempo 1ra Respuesta
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  18 <span className="text-sm font-normal text-slate-400">min</span>
                </span>
                <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> Triaje Activo
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Proveedores Guardia
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  03 <span className="text-sm font-normal text-slate-400">listos</span>
                </span>
                <span className="text-xs text-slate-400">Plom., Elect., Cerra.</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Satisfacción Vecinal
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">98.4%</span>
                <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> 4.9 / 5
                </span>
              </div>
            </div>
          </section>

          {/* BARRA DE FILTROS & TABS */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 w-fit">
              <button
                onClick={() => setTabFiltro("mis")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  tabFiltro === "mis"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Mis Reclamos ({tickets.filter((t) => t.unidad_id === unidad.id).length})
              </button>
              <button
                onClick={() => setTabFiltro("todos")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  tabFiltro === "todos"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Reclamos del Edificio ({tickets.length})
              </button>
              <button
                onClick={() => setTabFiltro("resueltos")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  tabFiltro === "resueltos"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Historial Resueltos ({tickets.filter((t) => t.estado === "resuelto").length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar #TK o palabra..."
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="todas">Todas las categorías</option>
                <option value="plomeria">Plomería</option>
                <option value="electricidad">Electricidad</option>
                <option value="cerrajeria">Cerrajería</option>
                <option value="varios">Varios</option>
              </select>
            </div>
          </section>

          {/* FEED DE TICKETS ITIL */}
          <section className="space-y-4">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                const esMio = t.unidad_id === unidad.id;
                const esUrgente = t.prioridad === "urgente";

                return (
                  <article
                    key={t.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
                  >
                    {/* Top row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {t.ticket_code}
                        </span>
                        <span className="text-slate-400">• {t.fecha_creacion}</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-500 text-[11px] border border-slate-200 dark:border-slate-800">
                          <User className="w-3 h-3" />
                          <span>UF 0{t.numero_uf} {esMio && "(Vos)"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold capitalize border border-indigo-100 dark:border-indigo-900">
                          {t.categoria === "plomeria" ? (
                            <Droplets className="w-3 h-3" />
                          ) : t.categoria === "electricidad" ? (
                            <Zap className="w-3 h-3" />
                          ) : t.categoria === "cerrajeria" ? (
                            <KeyRound className="w-3 h-3" />
                          ) : (
                            <Layers className="w-3 h-3" />
                          )}
                          <span>{t.categoria}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {esUrgente && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Urgente</span>
                          </span>
                        )}

                        {t.estado === "resuelto" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resuelto</span>
                          </span>
                        ) : t.estado === "en_revision" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En Curso / Asignado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Pendiente de Triaje</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>Sector: {t.ubicacion || "Áreas Comunes"}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t.titulo}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {t.descripcion}
                      </p>
                    </div>

                    {/* Footer con Proveedor y Botón */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      {t.proveedor_asignado ? (
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                          <Wrench className="w-4 h-4" />
                          <span>{t.proveedor_asignado}</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">
                          En proceso de asignación técnica por administración
                        </div>
                      )}

                      <button
                        onClick={() => setTicketSeleccionado(t)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ver Seguimiento ({t.comentarios?.length || 0} comentarios)</span>
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No se encontraron tickets con este criterio
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cambie de pestaña o cree un nuevo ticket si detectó algún inconveniente.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* MODAL CREAR TICKET */}
      <NuevoTicketModal
        isOpen={showNuevoModal}
        onClose={() => setShowNuevoModal(false)}
        unidadId={unidad.id}
        numeroUf={unidad.numero_uf}
        onTicketCreated={handleTicketCreated}
      />

      {/* MODAL DETALLE DE TICKET */}
      <DetalleTicketModal
        ticket={ticketSeleccionado}
        onClose={() => setTicketSeleccionado(null)}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
