-- ==============================================================================
-- PROYECTO: DeveloPet Friendly 🐾 — Consorcio Calle 425
-- MIGRACIÓN: TABLA DE CONFIGURACIÓN DEL CONSORCIO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.configuracion_consorcio (
    id BIGSERIAL PRIMARY KEY,
    tasa_interes_mora NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    comision_pasarela_mp NUMERIC(5, 2) NOT NULL DEFAULT 0.60,
    monto_multa_limpieza NUMERIC(12, 2) NOT NULL DEFAULT 24000.00,
    umbral_consenso_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 33.33,
    dias_vencimiento_expensas INT NOT NULL DEFAULT 15,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar configuración inicial por defecto (ID = 1)
INSERT INTO public.configuracion_consorcio (id, tasa_interes_mora, comision_pasarela_mp, monto_multa_limpieza, umbral_consenso_porcentaje, dias_vencimiento_expensas)
VALUES (1, 7.00, 0.60, 24000.00, 33.33, 15)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.configuracion_consorcio ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
CREATE POLICY "Ver Configuracion: Todos los Autenticados"
ON public.configuracion_consorcio FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Modificar Configuracion: Solo Admin"
ON public.configuracion_consorcio FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
