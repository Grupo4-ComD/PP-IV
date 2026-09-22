-- ==============================================================================
-- PROYECTO: DeveloPet Friendly 🐾 — Consorcio Calle 425 (9 Unidades Funcionales)
-- SCRIPT DE SEED / DATOS DE PRUEBA PARA DESARROLLO (supabase/seed.sql)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. CREACIÓN DE USUARIOS EN AUTH.USERS (SUPABASE AUTH)
-- ------------------------------------------------------------------------------
-- Contraseña unificada para cuentas demo: 'admin123' / 'vecino123'
-- Hash bcrypt generado para 'admin123': $2a$10$wE99Y5iK8qLz0KzR9gE1CeT7M4bBfD2JqU.3N8V.J8H3bCg6Yg8qK

DO $$
DECLARE
    v_admin_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_vecino3_user_id UUID := 'a0000000-0000-0000-0000-000000000003';
BEGIN
    -- Usuario Admin (Paula)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'paula.admin@calle425.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'paula.admin@calle425.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"nombre":"Paula Administradora","rol":"admin"}',
            NOW(),
            NOW()
        );
    END IF;

    -- Usuario Vecino UF 3 (Laura Martínez)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'laura.martinez@calle425.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_vecino3_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'laura.martinez@calle425.com',
            crypt('vecino123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"nombre":"Laura Martínez","rol":"vecino","numero_uf":3}',
            NOW(),
            NOW()
        );
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. INSERTAR LAS 9 UNIDADES FUNCIONALES DEL CONSORCIO CALLE 425 (CON PORCENTUAL M2)
-- ------------------------------------------------------------------------------
-- Distribución oficial según m2 de unidades funcionales:
-- 1 - PB A: 7.60% | 2 - PB B: 7.60% | 3 - PB C: 11.20%
-- 4 - 1° A: 9.20% | 5 - 1° B: 9.20% | 6 - 1° C: 9.50%
-- 7 - 2° A: 15.70% | 8 - 2° B: 15.70% | 9 - 2° C: 14.30% (Total: 100.00%)

ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS porcentual_m2 NUMERIC(5, 2) NOT NULL DEFAULT 11.11;

INSERT INTO public.unidades (numero_uf, piso_depto, propietario_nombre, email, telefono, rol_user, user_id, porcentual_m2)
VALUES
    (1, 'PB A', 'Paula Administradora', 'paula.admin@calle425.com', '+54 9 11 4000-0001', 'admin'::rol_usuario_enum, 'a0000000-0000-0000-0000-000000000001', 7.60),
    (2, 'PB B', 'González, Mario', 'mario.gonzalez@calle425.com', '+54 9 11 4000-0002', 'vecino'::rol_usuario_enum, NULL, 7.60),
    (3, 'PB C', 'Martínez, Laura', 'laura.martinez@calle425.com', '+54 9 11 4000-0003', 'vecino'::rol_usuario_enum, 'a0000000-0000-0000-0000-000000000003', 11.20),
    (4, '1° A', 'Rodríguez, Carlos', 'carlos.rodriguez@calle425.com', '+54 9 11 4000-0004', 'vecino'::rol_usuario_enum, NULL, 9.20),
    (5, '1° B', 'Fernández, Lucía', 'lucia.fernandez@calle425.com', '+54 9 11 4000-0005', 'vecino'::rol_usuario_enum, NULL, 9.20),
    (6, '1° C', 'López, Diego', 'diego.lopez@calle425.com', '+54 9 11 4000-0006', 'vecino'::rol_usuario_enum, NULL, 9.50),
    (7, '2° A', 'Sciulli, Guillermo', 'gsciulli@calle425.com', '+54 9 11 4000-0007', 'vecino'::rol_usuario_enum, NULL, 15.70),
    (8, '2° B', 'Greco, Verónica', 'veronica.greco@calle425.com', '+54 9 11 4000-0008', 'vecino'::rol_usuario_enum, NULL, 15.70),
    (9, '2° C', 'Perea, Braian', 'braian.perea@calle425.com', '+54 9 11 4000-0009', 'vecino'::rol_usuario_enum, NULL, 14.30)
ON CONFLICT (numero_uf) DO UPDATE SET
    piso_depto = EXCLUDED.piso_depto,
    propietario_nombre = EXCLUDED.propietario_nombre,
    email = EXCLUDED.email,
    telefono = EXCLUDED.telefono,
    rol_user = EXCLUDED.rol_user,
    porcentual_m2 = EXCLUDED.porcentual_m2,
    user_id = COALESCE(EXCLUDED.user_id, public.unidades.user_id);


-- ------------------------------------------------------------------------------
-- 3. EXPENSAS DE PRUEBA (MES ANTERIOR Y MES ACTUAL)
-- ------------------------------------------------------------------------------
-- Período Mes Anterior: Agosto 2026 (Mes 8) - Escenarios de pago al día vs Mora (7%)
-- Período Mes Actual: Septiembre 2026 (Mes 9) - Expensas vigentes

-- 3.1. Mes Anterior (Agosto 2026)
INSERT INTO public.expensas (
    unidad_id, periodo_mes, periodo_anio, monto_ordinario, recargo_mora, total_pagar,
    fecha_vencimiento, estado, comprobante_url, fecha_pago
)
SELECT
    u.id,
    8,
    2026,
    48500.00,
    -- UF 2 y UF 6 simulan mora del 7% ($3.395,00)
    CASE WHEN u.numero_uf IN (2, 6) THEN 3395.00 ELSE 0.00 END,
    CASE WHEN u.numero_uf IN (2, 6) THEN 51895.00 ELSE 48500.00 END,
    '2026-08-15'::DATE,
    CASE WHEN u.numero_uf IN (2, 6) THEN 'pendiente'::estado_expensa_enum ELSE 'pagado'::estado_expensa_enum END,
    CASE WHEN u.numero_uf NOT IN (2, 6) THEN 'https://storage.calle425.com/comprobantes/expensa_ago2026_uf_' || u.numero_uf || '.pdf' ELSE NULL END,
    CASE WHEN u.numero_uf NOT IN (2, 6) THEN '2026-08-12 14:30:00-03'::TIMESTAMPTZ ELSE NULL END
FROM public.unidades u
ON CONFLICT (unidad_id, periodo_mes, periodo_anio) DO UPDATE SET
    monto_ordinario = EXCLUDED.monto_ordinario,
    recargo_mora = EXCLUDED.recargo_mora,
    total_pagar = EXCLUDED.total_pagar,
    estado = EXCLUDED.estado,
    comprobante_url = EXCLUDED.comprobante_url,
    fecha_pago = EXCLUDED.fecha_pago;

-- 3.2. Mes Actual (Septiembre 2026)
INSERT INTO public.expensas (
    unidad_id, periodo_mes, periodo_anio, monto_ordinario, recargo_mora, total_pagar,
    fecha_vencimiento, estado, comprobante_url, fecha_pago
)
SELECT
    u.id,
    9,
    2026,
    52000.00,
    0.00,
    52000.00,
    '2026-09-25'::DATE,
    -- UF 1, UF 3 y UF 7 pagaron en término; las demás siguen pendientes en plazo legal
    CASE WHEN u.numero_uf IN (1, 3, 7) THEN 'pagado'::estado_expensa_enum ELSE 'pendiente'::estado_expensa_enum END,
    CASE WHEN u.numero_uf IN (1, 3, 7) THEN 'https://storage.calle425.com/comprobantes/expensa_sep2026_uf_' || u.numero_uf || '.pdf' ELSE NULL END,
    CASE WHEN u.numero_uf IN (1, 3, 7) THEN '2026-09-18 10:15:00-03'::TIMESTAMPTZ ELSE NULL END
FROM public.unidades u
ON CONFLICT (unidad_id, periodo_mes, periodo_anio) DO UPDATE SET
    monto_ordinario = EXCLUDED.monto_ordinario,
    recargo_mora = EXCLUDED.recargo_mora,
    total_pagar = EXCLUDED.total_pagar,
    estado = EXCLUDED.estado,
    comprobante_url = EXCLUDED.comprobante_url,
    fecha_pago = EXCLUDED.fecha_pago;


-- ------------------------------------------------------------------------------
-- 4. CRONOGRAMA DE LIMPIEZA ROTATIVA (4 PRÓXIMAS SEMANAS: UF 1 A UF 4)
-- ------------------------------------------------------------------------------
DELETE FROM public.limpieza_rotativa WHERE semana_inicio >= '2026-09-01';

-- Semana 1: UF 1 (Paula Admin) - Cumplida
INSERT INTO public.limpieza_rotativa (unidad_id_asignada, semana_inicio, semana_fin, estado, observaciones)
SELECT id, '2026-09-01'::DATE, '2026-09-07'::DATE, 'cumplido'::estado_limpieza_enum, 'Limpieza general de hall de entrada y pasillos cumplida en tiempo y forma.'
FROM public.unidades WHERE numero_uf = 1;

-- Semana 2: UF 2 (Mario González) - Incumplida / Multada (Sustituida por UF 3)
INSERT INTO public.limpieza_rotativa (unidad_id_asignada, semana_inicio, semana_fin, estado, unidad_id_sustituta, observaciones)
SELECT 
    u2.id,
    '2026-09-08'::DATE,
    '2026-09-14'::DATE,
    'multado'::estado_limpieza_enum,
    u3.id,
    'No se realizó el aseo programado del piso 1 y terraza; guardia cubierta por la UF 3.'
FROM public.unidades u2, public.unidades u3
WHERE u2.numero_uf = 2 AND u3.numero_uf = 3;

-- Registrar la multa imputada a UF 2 acreditada a UF 3 ($24.000)
INSERT INTO public.multas (unidad_id_infractora, monto, acreditado_a_unidad_id, fecha_imputacion, motivo, pagada)
SELECT
    u2.id,
    24000.00,
    u3.id,
    '2026-09-15 09:00:00-03'::TIMESTAMPTZ,
    'Multa por incumplimiento de guardia de limpieza rotativa — Imputada a UF 2 a favor de UF 3',
    FALSE
FROM public.unidades u2, public.unidades u3
WHERE u2.numero_uf = 2 AND u3.numero_uf = 3
ON CONFLICT DO NOTHING;

-- Semana 3: UF 3 (Laura Martínez) - Cumplida
INSERT INTO public.limpieza_rotativa (unidad_id_asignada, semana_inicio, semana_fin, estado, observaciones)
SELECT id, '2026-09-15'::DATE, '2026-09-21'::DATE, 'cumplido'::estado_limpieza_enum, 'Turno regular completado con desinfección de barandas y terraza.'
FROM public.unidades WHERE numero_uf = 3;

-- Semana 4: UF 4 (Carlos Rodríguez) - Próxima guardia
INSERT INTO public.limpieza_rotativa (unidad_id_asignada, semana_inicio, semana_fin, estado, observaciones)
SELECT id, '2026-09-22'::DATE, '2026-09-28'::DATE, 'cumplido'::estado_limpieza_enum, 'Guardia de limpieza rotativa en curso.'
FROM public.unidades WHERE numero_uf = 4;


-- ------------------------------------------------------------------------------
-- 5. MESA DE AYUDA: 2 TICKETS CON PRESUPUESTOS Y VOTACIONES DE CONSENSO
-- ------------------------------------------------------------------------------

-- Limpiar tickets demo existentes para evitar duplicados en seed repetido
DELETE FROM public.tickets_reclamos WHERE titulo IN (
    'Filtración de agua en montante principal y sala de bombas',
    'Reparación y automatización del portón de cochera'
);

-- ------------------------------------------------------------------------------
-- 5.1. TICKET 1: Plomería (Aprobado por Consenso: 4 votos >= 33.3%)
-- ------------------------------------------------------------------------------
WITH nuevo_ticket_1 AS (
    INSERT INTO public.tickets_reclamos (
        unidad_id, titulo, descripcion, categoria, estado, fecha_creacion
    )
    SELECT
        u.id,
        'Filtración de agua en montante principal y sala de bombas',
        'Se detectó pérdida de presión de agua y humedad constante en el subsuelo. Urge recambio de tramo de caño maestro y sellado termofusión de 2 pulgadas.',
        'plomeria'::categoria_ticket_enum,
        'en_revision'::estado_ticket_enum,
        NOW() - INTERVAL '3 days'
    FROM public.unidades u
    WHERE u.numero_uf = 3
    RETURNING id
),
presupuestos_t1 AS (
    INSERT INTO public.presupuestos_votacion (
        ticket_id, proveedor_nombre, monto_total, detalle, pdf_url, votos_favor, estado
    )
    SELECT
        t.id,
        'Hidro-Soluciones La Plata S.R.L.',
        185000.00,
        'Recambio integral de tramo termofusión de 2 pulgadas, 2 llaves de paso esféricas italianas y mano de obra con 12 meses de garantía escrita.',
        'https://storage.calle425.com/presupuestos/hidro_soluciones_tk01.pdf',
        4,
        'aprobado'::estado_presupuesto_enum
    FROM nuevo_ticket_1 t
    UNION ALL
    SELECT
        t.id,
        'Plomería Integral 24hs',
        210000.00,
        'Reparación de tramo galvanizado mediante acople rápido y sellador epoxi de alta resistencia.',
        'https://storage.calle425.com/presupuestos/plomeria_integral_tk01.pdf',
        1,
        'rechazado'::estado_presupuesto_enum
    FROM nuevo_ticket_1 t
    RETURNING id, proveedor_nombre, ticket_id
)
-- Registrar los votos individuales de los vecinos para el Presupuesto Ganador (4 votos: UF 1, UF 3, UF 4, UF 7)
INSERT INTO public.votos_vecinos (presupuesto_id, unidad_id, fecha_voto)
SELECT
    p.id,
    u.id,
    NOW() - INTERVAL '1 day'
FROM presupuestos_t1 p
CROSS JOIN public.unidades u
WHERE p.proveedor_nombre = 'Hidro-Soluciones La Plata S.R.L.'
  AND u.numero_uf IN (1, 3, 4, 7)
UNION ALL
-- 1 voto para la opción alternativa (UF 2)
SELECT
    p.id,
    u.id,
    NOW() - INTERVAL '2 days'
FROM presupuestos_t1 p
CROSS JOIN public.unidades u
WHERE p.proveedor_nombre = 'Plomería Integral 24hs'
  AND u.numero_uf IN (2);


-- ------------------------------------------------------------------------------
-- 5.2. TICKET 2: Cerrajería (En votación activa: 2 votos = 22.2% < 30%)
-- ------------------------------------------------------------------------------
WITH nuevo_ticket_2 AS (
    INSERT INTO public.tickets_reclamos (
        unidad_id, titulo, descripcion, categoria, estado, fecha_creacion
    )
    SELECT
        u.id,
        'Reparación y automatización del portón de cochera',
        'El motor de apertura del portón vehicular principal emite zumbidos anormales y se traba en el recorrido nocturno de cierre.',
        'cerrajeria'::categoria_ticket_enum,
        'abierto'::estado_ticket_enum,
        NOW() - INTERVAL '1 day'
    FROM public.unidades u
    WHERE u.numero_uf = 4
    RETURNING id
),
presupuestos_t2 AS (
    INSERT INTO public.presupuestos_votacion (
        ticket_id, proveedor_nombre, monto_total, detalle, pdf_url, votos_favor, estado
    )
    SELECT
        t.id,
        'Portones Automáticos Sur',
        95000.00,
        'Sustitución de cremallera de acero, cambio de bujes del motor y provisión de 10 controles remotos de código rotativo.',
        'https://storage.calle425.com/presupuestos/portones_sur_tk02.pdf',
        2,
        'en_votacion'::estado_presupuesto_enum
    FROM nuevo_ticket_2 t
    UNION ALL
    SELECT
        t.id,
        'Cerrajería y Automatización Centro',
        115000.00,
        'Mantenimiento general, lubricación industrial de guías y reemplazo de placa receptora monofásica.',
        'https://storage.calle425.com/presupuestos/cerrajeria_centro_tk02.pdf',
        0,
        'en_votacion'::estado_presupuesto_enum
    FROM nuevo_ticket_2 t
    RETURNING id, proveedor_nombre, ticket_id
)
-- Registrar los 2 votos existentes para 'Portones Automáticos Sur' (UF 3 y UF 5)
INSERT INTO public.votos_vecinos (presupuesto_id, unidad_id, fecha_voto)
SELECT
    p.id,
    u.id,
    NOW() - INTERVAL '4 hours'
FROM presupuestos_t2 p
CROSS JOIN public.unidades u
WHERE p.proveedor_nombre = 'Portones Automáticos Sur'
  AND u.numero_uf IN (3, 5);

COMMIT;
