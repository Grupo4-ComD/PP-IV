-- ==============================================================================
-- PROYECTO: DeveloPet Friendly 🐾 — Consorcio Calle 425
-- MIGRACIÓN DDL: Integración Mesa de Ayuda bajo ITIL 4 y Períodos Finalizados
-- ==============================================================================

-- 1. TIPOS ENUMERADOS ADICIONALES (ITIL 4)
DO $$ BEGIN
    CREATE TYPE tipo_ticket_itil_enum AS ENUM ('incidente', 'solicitud_servicio', 'problema');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prioridad_itil_enum AS ENUM ('critica', 'alta', 'media', 'baja');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_ticket_itil_enum AS ENUM (
        'abierto', 'asignado', 'en_diagnostico', 'esperando_presupuesto', 
        'en_votacion_consorcio', 'en_ejecucion', 'resuelto', 'cerrado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_periodo_enum AS ENUM ('abierto', 'cerrado_bloqueado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA: PERIODOS FINALIZADOS (CONGELAMIENTO MENSUAL - RF-08)
CREATE TABLE IF NOT EXISTS public.periodos_finalizados (
    id BIGSERIAL PRIMARY KEY,
    periodo_mes INT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
    periodo_anio INT NOT NULL CHECK (periodo_anio >= 2024),
    total_ordinarias NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_ordinarias >= 0),
    total_extraordinarias NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_extraordinarias >= 0),
    total_fondo_reserva NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_fondo_reserva >= 0),
    total_retencion_mp NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_retencion_mp >= 0),
    estado estado_periodo_enum NOT NULL DEFAULT 'abierto',
    fecha_cierre TIMESTAMPTZ,
    cerrado_por VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_periodo_cierre UNIQUE (periodo_mes, periodo_anio)
);

-- Vincular Expensas con PeriodoFinalizado si no está vinculada
ALTER TABLE public.expensas 
    ADD COLUMN IF NOT EXISTS periodo_finalizado_id BIGINT REFERENCES public.periodos_finalizados(id) ON DELETE SET NULL;

-- 3. AJUSTES EN GASTOS (PERIODO CONTABLE)
ALTER TABLE public.gastos
    ADD COLUMN IF NOT EXISTS periodo_mes INT,
    ADD COLUMN IF NOT EXISTS periodo_anio INT;

-- 4. AJUSTES EN PAGOS VECINOS (DESGLOSE 0.6% MERCADO PAGO)
ALTER TABLE public.pagos_vecinos
    ADD COLUMN IF NOT EXISTS monto_bruto NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS retencion_mp NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS monto_neto NUMERIC(12, 2) DEFAULT 0.00;

-- 5. MEJORAS EN MESA DE AYUDA (ITIL 4)
ALTER TABLE public.tickets_reclamos
    ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS tipo tipo_ticket_itil_enum NOT NULL DEFAULT 'incidente',
    ADD COLUMN IF NOT EXISTS prioridad prioridad_itil_enum NOT NULL DEFAULT 'media',
    ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(150),
    ADD COLUMN IF NOT EXISTS proveedor_asignado VARCHAR(150),
    ADD COLUMN IF NOT EXISTS sla_horas_limite INT NOT NULL DEFAULT 48,
    ADD COLUMN IF NOT EXISTS fecha_primera_respuesta TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS calificacion_csat INT CHECK (calificacion_csat BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS comentario_cierre TEXT;

-- Generar ticket_code por defecto a los existentes
UPDATE public.tickets_reclamos
SET ticket_code = 'TK-' || LPAD(id::text, 4, '0')
WHERE ticket_code IS NULL;

-- 6. TABLA: HISTORIAL DE ACTIVIDAD / TRAZABILIDAD ITIL 4
CREATE TABLE IF NOT EXISTS public.tickets_historial (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES public.tickets_reclamos(id) ON DELETE CASCADE,
    autor_nombre VARCHAR(150) NOT NULL,
    autor_rol rol_usuario_enum NOT NULL,
    mensaje TEXT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AJUSTES EN PRESUPUESTOS (QUÓRUM 30%-40% POR COEFICIENTE)
ALTER TABLE public.presupuestos_votacion
    ADD COLUMN IF NOT EXISTS coeficiente_favor NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS quorum_alcanzado BOOLEAN NOT NULL DEFAULT FALSE;

-- 8. TRIGGER REFINADO PARA CÁLCULO DE QUÓRUM PONDERADO POR COEFICIENTE
CREATE OR REPLACE FUNCTION public.calcular_quorum_presupuesto_itil()
RETURNS TRIGGER AS $$
DECLARE
    v_coef_total NUMERIC(5, 2) := 0.00;
    v_umbral_minimo CONSTANT NUMERIC := 30.00; -- 30% del coeficiente
BEGIN
    -- Sumar los coeficientes de las unidades que votaron a favor
    SELECT COALESCE(SUM(u.coeficiente_prorrateo), 0)
    INTO v_coef_total
    FROM public.votos_vecinos vv
    INNER JOIN public.unidades u ON vv.unidad_id = u.id
    WHERE vv.presupuesto_id = NEW.presupuesto_id;

    -- Actualizar presupuesto con votos, coeficiente y quórum
    UPDATE public.presupuestos_votacion
    SET votos_favor = (SELECT COUNT(*) FROM public.votos_vecinos WHERE presupuesto_id = NEW.presupuesto_id),
        coeficiente_favor = v_coef_total,
        quorum_alcanzado = (v_coef_total >= v_umbral_minimo),
        estado = CASE WHEN v_coef_total >= v_umbral_minimo THEN 'aprobado'::estado_presupuesto_enum ELSE estado END,
        updated_at = NOW()
    WHERE id = NEW.presupuesto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calcular_quorum_itil ON public.votos_vecinos;
CREATE TRIGGER trg_calcular_quorum_itil
AFTER INSERT OR DELETE ON public.votos_vecinos
FOR EACH ROW
EXECUTE FUNCTION public.calcular_quorum_presupuesto_itil();

-- 9. PERMISOS RLS
ALTER TABLE public.periodos_finalizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de periodos finalizados"
    ON public.periodos_finalizados FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Lectura de historial para vecinos del consorcio"
    ON public.tickets_historial FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Inserción de comentarios para usuarios autenticados"
    ON public.tickets_historial FOR INSERT
    TO authenticated
    WITH CHECK (true);
