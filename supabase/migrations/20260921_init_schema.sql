-- ==============================================================================
-- PROYECTO: DeveloPet Friendly 🐾 — Consorcio Calle 425 (9 Unidades Funcionales)
-- SCRIPT DDL COMPLETO PARA POSTGRESQL / SUPABASE
-- Incluye: Tablas, Restricciones, Triggers, Funciones Almacenadas y Políticas RLS
-- ==============================================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ==============================================================================
CREATE TYPE rol_usuario_enum AS ENUM ('vecino', 'admin');
CREATE TYPE estado_expensa_enum AS ENUM ('pendiente', 'en_verificacion', 'pagado');
CREATE TYPE categoria_gasto_enum AS ENUM ('ordinario', 'fondo_comun', 'comision_pasarela');
CREATE TYPE estado_limpieza_enum AS ENUM ('cumplido', 'incumplido', 'multado');
CREATE TYPE categoria_ticket_enum AS ENUM ('plomeria', 'electricidad', 'cerrajeria', 'varios');
CREATE TYPE estado_ticket_enum AS ENUM ('abierto', 'en_revision', 'resuelto');
CREATE TYPE estado_presupuesto_enum AS ENUM ('en_votacion', 'aprobado', 'rechazado');

-- ==============================================================================
-- 2. TABLAS PRINCIPALES
-- ==============================================================================

-- 2.1. UNIDADES FUNCIONALES
CREATE TABLE IF NOT EXISTS public.unidades (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    numero_uf INT NOT NULL UNIQUE CHECK (numero_uf BETWEEN 1 AND 9),
    piso_depto VARCHAR(10) NOT NULL,
    propietario_nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    rol_user rol_usuario_enum NOT NULL DEFAULT 'vecino',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2. EXPENSAS
CREATE TABLE IF NOT EXISTS public.expensas (
    id BIGSERIAL PRIMARY KEY,
    unidad_id BIGINT NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    periodo_mes INT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
    periodo_anio INT NOT NULL CHECK (periodo_anio >= 2024),
    monto_ordinario NUMERIC(12, 2) NOT NULL CHECK (monto_ordinario >= 0),
    recargo_mora NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (recargo_mora >= 0),
    total_pagar NUMERIC(12, 2) NOT NULL CHECK (total_pagar >= 0),
    fecha_vencimiento DATE NOT NULL,
    estado estado_expensa_enum NOT NULL DEFAULT 'pendiente',
    comprobante_url TEXT,
    fecha_pago TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_unidad_periodo UNIQUE (unidad_id, periodo_mes, periodo_anio)
);

-- 2.3. GASTOS DEL CONSORCIO
CREATE TABLE IF NOT EXISTS public.gastos (
    id BIGSERIAL PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    categoria categoria_gasto_enum NOT NULL DEFAULT 'ordinario',
    fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE,
    deduccion_mp_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0.60 CHECK (deduccion_mp_porcentaje >= 0),
    comprobante_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4. CRONOGRAMA DE LIMPIEZA ROTATIVA
CREATE TABLE IF NOT EXISTS public.limpieza_rotativa (
    id BIGSERIAL PRIMARY KEY,
    unidad_id_asignada BIGINT NOT NULL REFERENCES public.unidades(id) ON DELETE RESTRICT,
    semana_inicio DATE NOT NULL,
    semana_fin DATE NOT NULL,
    estado estado_limpieza_enum NOT NULL DEFAULT 'cumplido',
    unidad_id_sustituta BIGINT REFERENCES public.unidades(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_semanas CHECK (semana_fin >= semana_inicio)
);

-- 2.5. MULTAS
CREATE TABLE IF NOT EXISTS public.multas (
    id BIGSERIAL PRIMARY KEY,
    unidad_id_infractora BIGINT NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL DEFAULT 24000.00 CHECK (monto > 0),
    acreditado_a_unidad_id BIGINT REFERENCES public.unidades(id) ON DELETE SET NULL,
    fecha_imputacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo VARCHAR(255) NOT NULL DEFAULT 'Incumplimiento de turno de limpieza rotativa',
    pagada BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.6. TICKETS DE RECLAMOS / INCIDENCIAS (ITIL 4)
CREATE TABLE IF NOT EXISTS public.tickets_reclamos (
    id BIGSERIAL PRIMARY KEY,
    unidad_id BIGINT NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria categoria_ticket_enum NOT NULL DEFAULT 'varios',
    estado estado_ticket_enum NOT NULL DEFAULT 'abierto',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_resolucion TIMESTAMPTZ
);

-- 2.7. PRESUPUESTOS PARA VOTACIÓN
CREATE TABLE IF NOT EXISTS public.presupuestos_votacion (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES public.tickets_reclamos(id) ON DELETE CASCADE,
    proveedor_nombre VARCHAR(150) NOT NULL,
    monto_total NUMERIC(12, 2) NOT NULL CHECK (monto_total > 0),
    detalle TEXT NOT NULL,
    pdf_url TEXT,
    votos_favor INT NOT NULL DEFAULT 0 CHECK (votos_favor >= 0),
    estado estado_presupuesto_enum NOT NULL DEFAULT 'en_votacion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8. VOTOS DE LOS VECINOS
CREATE TABLE IF NOT EXISTS public.votos_vecinos (
    id BIGSERIAL PRIMARY KEY,
    presupuesto_id BIGINT NOT NULL REFERENCES public.presupuestos_votacion(id) ON DELETE CASCADE,
    unidad_id BIGINT NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    fecha_voto TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_presupuesto_unidad UNIQUE (presupuesto_id, unidad_id)
);

-- ==============================================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_unidades_user_id ON public.unidades(user_id);
CREATE INDEX IF NOT EXISTS idx_expensas_unidad_periodo ON public.expensas(unidad_id, periodo_anio, periodo_mes);
CREATE INDEX IF NOT EXISTS idx_limpieza_fechas ON public.limpieza_rotativa(semana_inicio, semana_fin);
CREATE INDEX IF NOT EXISTS idx_tickets_unidad_estado ON public.tickets_reclamos(unidad_id, estado);
CREATE INDEX IF NOT EXISTS idx_votos_presupuesto ON public.votos_vecinos(presupuesto_id);

-- ==============================================================================
-- 4. LÓGICA ALMACENADA: FUNCIONES Y TRIGGERS
-- ==============================================================================

-- 4.1. FUNCIÓN Y TRIGGER: CALCULAR MORA AUTOMÁTICA EN EXPENSAS (7% sobre saldo impago)
CREATE OR REPLACE FUNCTION public.calcular_mora_expensas()
RETURNS TRIGGER AS $$
DECLARE
    v_ultimo_dia_mes DATE;
BEGIN
    -- Si el estado no está pagado
    IF NEW.estado != 'pagado' THEN
        -- Calcular el último día del mes del período vencido
        v_ultimo_dia_mes := (MAKE_DATE(NEW.periodo_anio, NEW.periodo_mes, 1) + INTERVAL '1 month - 1 day')::DATE;

        -- Si la fecha actual supera el último día del mes del período vencido
        IF CURRENT_DATE > v_ultimo_dia_mes THEN
            -- Aplica recargo del 7% sobre el monto ordinario
            NEW.recargo_mora := ROUND(NEW.monto_ordinario * 0.07, 2);
            NEW.total_pagar := NEW.monto_ordinario + NEW.recargo_mora;
        ELSE
            NEW.recargo_mora := 0.00;
            NEW.total_pagar := NEW.monto_ordinario;
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calcular_mora_expensas
BEFORE INSERT OR UPDATE ON public.expensas
FOR EACH ROW
EXECUTE FUNCTION public.calcular_mora_expensas();


-- 4.2. FUNCIÓN: APLICAR MULTA DE LIMPIEZA ($24.000) E IMPUTAR CRÉDITO A UF SUSTITUTA
CREATE OR REPLACE FUNCTION public.aplicar_multa_limpieza(
    p_unidad_infractora BIGINT,
    p_unidad_sustituta BIGINT,
    p_limpieza_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_multa_id BIGINT;
    v_monto_multa NUMERIC(12, 2) := 24000.00;
BEGIN
    -- Validar que no sea la misma unidad
    IF p_unidad_infractora = p_unidad_sustituta THEN
        RAISE EXCEPTION 'La unidad infractora y sustituta no pueden ser la misma UF.';
    END IF;

    -- Registrar la multa imputada a la unidad infractora
    INSERT INTO public.multas (
        unidad_id_infractora,
        monto,
        acreditado_a_unidad_id,
        fecha_imputacion,
        motivo,
        pagada
    )
    VALUES (
        p_unidad_infractora,
        v_monto_multa,
        p_unidad_sustituta,
        NOW(),
        'Multa por incumplimiento de guardia de limpieza — Acreditada a UF sustituta',
        FALSE
    )
    RETURNING id INTO v_multa_id;

    -- Si se pasó el ID de la guardia, actualizar su estado a 'multado'
    IF p_limpieza_id IS NOT NULL THEN
        UPDATE public.limpieza_rotativa
        SET estado = 'multado',
            unidad_id_sustituta = p_unidad_sustituta
        WHERE id = p_limpieza_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'multa_id', v_multa_id,
        'monto_multa', v_monto_multa,
        'unidad_infractora', p_unidad_infractora,
        'unidad_acreditada', p_unidad_sustituta,
        'mensaje', 'Multa de $24.000 generada y crédito asignado a la UF sustituta exitosamente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.3. FUNCIÓN Y TRIGGER: VERIFICAR UMBRAL DE CONSENSO EN PRESUPUESTOS (30% - 40% de 9 UFs => 3 o 4 votos)
CREATE OR REPLACE FUNCTION public.verificar_umbral_presupuesto()
RETURNS TRIGGER AS $$
DECLARE
    v_total_votos INT;
    v_total_ufs CONSTANT NUMERIC := 9.0;
    v_porcentaje NUMERIC;
BEGIN
    -- Contar los votos a favor actuales para el presupuesto votado
    SELECT COUNT(*) INTO v_total_votos
    FROM public.votos_vecinos
    WHERE presupuesto_id = NEW.presupuesto_id;

    -- Calcular el porcentaje alcanzado sobre las 9 Unidades Funcionales
    v_porcentaje := (v_total_votos / v_total_ufs) * 100.0;

    -- Actualizar contador de votos y estado del presupuesto
    -- Umbral de consenso: a partir de 3 votos (33.33% >= 30%) queda aprobado
    IF v_total_votos >= 3 THEN
        UPDATE public.presupuestos_votacion
        SET votos_favor = v_total_votos,
            estado = 'aprobado',
            updated_at = NOW()
        WHERE id = NEW.presupuesto_id;
    ELSE
        UPDATE public.presupuestos_votacion
        SET votos_favor = v_total_votos,
            updated_at = NOW()
        WHERE id = NEW.presupuesto_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_verificar_umbral_presupuesto
AFTER INSERT ON public.votos_vecinos
FOR EACH ROW
EXECUTE FUNCTION public.verificar_umbral_presupuesto();


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) Y POLÍTICAS DE SEGURIDAD
-- ==============================================================================

-- 5.1. Activar RLS en todas las tablas
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limpieza_rotativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_reclamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos_votacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos_vecinos ENABLE ROW LEVEL SECURITY;

-- 5.2. Función auxiliar para verificar si el usuario autenticado es Admin (Paula)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.unidades
        WHERE user_id = auth.uid()
          AND rol_user = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3. Función auxiliar para obtener el ID de unidad del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_unidad_id()
RETURNS BIGINT AS $$
DECLARE
    v_unidad_id BIGINT;
BEGIN
    SELECT id INTO v_unidad_id
    FROM public.unidades
    WHERE user_id = auth.uid()
    LIMIT 1;

    RETURN v_unidad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- POLÍTICAS: UNIDADES
-- ------------------------------------------------------------------------------
-- Vecinos ven su propia unidad; Admin ve todas las unidades
CREATE POLICY "Ver Unidades: Propia o Admin"
ON public.unidades FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR public.is_admin()
);

-- Solo Admin puede insertar/modificar unidades
CREATE POLICY "Gestionar Unidades: Solo Admin"
ON public.unidades FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: EXPENSAS
-- ------------------------------------------------------------------------------
-- Vecinos ven solo sus expensas; Admin ve todas
CREATE POLICY "Ver Expensas: Propia o Admin"
ON public.expensas FOR SELECT
TO authenticated
USING (
    unidad_id = public.get_current_unidad_id() OR public.is_admin()
);

-- Vecino puede actualizar comprobante_url y estado 'en_verificacion' de su propia expensa
CREATE POLICY "Adjuntar Comprobante Pago: Vecino"
ON public.expensas FOR UPDATE
TO authenticated
USING (unidad_id = public.get_current_unidad_id())
WITH CHECK (unidad_id = public.get_current_unidad_id());

-- Solo Admin puede emitir, modificar y liquidar expensas
CREATE POLICY "Gestionar Expensas: Solo Admin"
ON public.expensas FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: GASTOS
-- ------------------------------------------------------------------------------
-- Todos los residentes autenticados pueden ver la rendición de cuentas de gastos
CREATE POLICY "Ver Gastos: Todos los Residentes"
ON public.gastos FOR SELECT
TO authenticated
USING (TRUE);

-- Solo Admin puede cargar gastos del consorcio
CREATE POLICY "Cargar Gastos: Solo Admin"
ON public.gastos FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: LIMPIEZA ROTATIVA
-- ------------------------------------------------------------------------------
-- Todos los residentes pueden consultar el cronograma de limpieza
CREATE POLICY "Ver Limpieza: Todos los Residentes"
ON public.limpieza_rotativa FOR SELECT
TO authenticated
USING (TRUE);

-- Residentes pueden solicitar permutas en sus turnos asignados
CREATE POLICY "Modificar Turno Asignado: Vecino"
ON public.limpieza_rotativa FOR UPDATE
TO authenticated
USING (
    unidad_id_asignada = public.get_current_unidad_id() OR public.is_admin()
)
WITH CHECK (
    unidad_id_asignada = public.get_current_unidad_id() OR public.is_admin()
);

-- Admin puede gestionar y reasignar cualquier turno
CREATE POLICY "Gestionar Limpieza: Solo Admin"
ON public.limpieza_rotativa FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: MULTAS
-- ------------------------------------------------------------------------------
-- Residentes ven multas que les fueron imputadas o acreditadas a su favor
CREATE POLICY "Ver Multas: Imputada, Acreditada o Admin"
ON public.multas FOR SELECT
TO authenticated
USING (
    unidad_id_infractora = public.get_current_unidad_id()
    OR acreditado_a_unidad_id = public.get_current_unidad_id()
    OR public.is_admin()
);

-- Solo Admin puede aplicar o condonar multas directamente
CREATE POLICY "Gestionar Multas: Solo Admin"
ON public.multas FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: TICKETS DE RECLAMOS
-- ------------------------------------------------------------------------------
-- Residentes ven todos los reclamos comunes o sus propios tickets; Admin ve todo
CREATE POLICY "Ver Tickets: Todos los Residentes"
ON public.tickets_reclamos FOR SELECT
TO authenticated
USING (TRUE);

-- Residentes pueden crear tickets para su unidad
CREATE POLICY "Crear Ticket: Vecinos"
ON public.tickets_reclamos FOR INSERT
TO authenticated
WITH CHECK (unidad_id = public.get_current_unidad_id() OR public.is_admin());

-- Admin puede actualizar el estado/resolución de los tickets
CREATE POLICY "Gestionar Tickets: Solo Admin"
ON public.tickets_reclamos FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: PRESUPUESTOS Y VOTACIONES
-- ------------------------------------------------------------------------------
-- Todos los residentes pueden ver los presupuestos en votación
CREATE POLICY "Ver Presupuestos: Todos los Residentes"
ON public.presupuestos_votacion FOR SELECT
TO authenticated
USING (TRUE);

-- Solo Admin puede subir presupuestos de proveedores
CREATE POLICY "Subir Presupuestos: Solo Admin"
ON public.presupuestos_votacion FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Vecinos pueden ver todos los votos emitidos
CREATE POLICY "Ver Votos: Todos los Residentes"
ON public.votos_vecinos FOR SELECT
TO authenticated
USING (TRUE);

-- Cada vecino solo puede emitir su propio voto con su UF
CREATE POLICY "Emitir Voto: Vecino con su UF"
ON public.votos_vecinos FOR INSERT
TO authenticated
WITH CHECK (
    unidad_id = public.get_current_unidad_id()
);

-- ==============================================================================
-- 6. SEED DATA INICIAL (9 UNIDADES FUNCIONALES DEL CONSORCIO CALLE 425)
-- ==============================================================================
INSERT INTO public.unidades (numero_uf, piso_depto, propietario_nombre, email, telefono, rol_user)
VALUES
    (1, 'PB A', 'Paula Administradora', 'admin@calle425.com', '+54 9 11 4000-0001', 'admin'),
    (2, 'PB B', 'González, Mario', 'mario.gonzalez@calle425.com', '+54 9 11 4000-0002', 'vecino'),
    (3, '1° A', 'Martínez, Laura', 'laura.martinez@calle425.com', '+54 9 11 4000-0003', 'vecino'),
    (4, '1° B', 'Rodríguez, Carlos', 'carlos.rodriguez@calle425.com', '+54 9 11 4000-0004', 'vecino'),
    (5, '2° A', 'Fernández, Lucía', 'lucia.fernandez@calle425.com', '+54 9 11 4000-0005', 'vecino'),
    (6, '2° B', 'López, Diego', 'diego.lopez@calle425.com', '+54 9 11 4000-0006', 'vecino'),
    (7, '3° A', 'Sciulli, Guillermo', 'gsciulli@calle425.com', '+54 9 11 4000-0007', 'vecino'),
    (8, '3° B', 'Greco, Verónica', 'veronica.greco@calle425.com', '+54 9 11 4000-0008', 'vecino'),
    (9, '4° A', 'Perea, Braian', 'braian.perea@calle425.com', '+54 9 11 4000-0009', 'vecino')
ON CONFLICT (numero_uf) DO NOTHING;
