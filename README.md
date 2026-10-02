# DeveloPet Friendly 🐾
### Plataforma Integral de Gestión Residencial — Consorcio Calle 425

Bienvenidos al repositorio institucional de **DeveloPet Friendly**, la *Software Factory* conformada para el desarrollo del Proyecto Integrador en la materia **Prácticas Profesionalizantes IV (Jueves)**.

---

## 🏫 Información Institucional
* **Institución:** Instituto de Formación Técnica Superior Nº 29 (IFTS 29)
* **Carrera:** Tecnicatura Superior en Desarrollo de Software
* **Ciclo Lectivo:** Segundo Cuatrimestre de 2026
* **Cátedra:** Prácticas Profesionalizantes IV — Comisión Jueves
* **Docentes Evaluadores:** Lic. Kevin Del Bello & Lic. Emir García Ontiveros
* **Cliente / Proyecto:** Consorcio Calle 425 (Administradora Paula)

---

## 👥 Integrantes y Roles del Equipo (Software Factory)

1. **Guillermo Sciulli** (`gsciulli@gmail.com`) — **Líder de Proyecto & Analista Funcional**
   * *Responsabilidades:* Coordinación general del equipo, comunicación con cliente y docentes, relevamiento de requisitos y especificación de reglas de negocio.
2. **Braian Perea** (`braianperea@gmail.com`) — **Diseñador UX/UI & Arquitecto de Base de Datos**
   * *Responsabilidades:* Prototipado interactivo navegable en Stitch/Figma, modelado relacional en PostgreSQL/Prisma ORM y diagramación UML de la solución.
3. **Verónica Greco** (`soyvero9@gmail.com`) — **Desarrolladora Frontend & Maquetación UI**
   * *Responsabilidades:* Maquetación de interfaces responsivas en Next.js 15, Tailwind CSS (Glassmorphism) y componentes del Portal del Vecino y Dashboard.
4. **Mailén Juárez** (`juarezmailen@gmail.com`) — **Responsable de QA / Testing & Aseguramiento de Calidad**
   * *Responsabilidades:* Control de calidad de entregables, matriz de pruebas funcionales, validación de reglas de negocio y confección de minutas/documentación.

---

## 🛠️ Stack Tecnológico Seleccionado
* **Frontend & Framework:** Next.js 15+ (App Router) con React 19 y TypeScript.
* **Estilos & UI:** Tailwind CSS (Maquetado Glassmorphism adaptable e intuitivo).
* **Base de Datos Relacional:** PostgreSQL alojado en la nube mediante **Supabase**.
* **ORM:** Prisma ORM (v5.22.0) para modelado relacional e integridad de datos.
* **Inteligencia Artificial:** API de Google Gemini (RAG) para el Asistente Virtual sobre el Reglamento de Copropiedad.
* **Seguridad & Autenticación:** Tokens JWT (vía `jose`) y Hasheo de credenciales con `bcrypt`.
* **Integración Financiera:** API / Servicio Mock de Mercado Pago (verificación de Alias/CVU, retención del 0,6% y recargo por mora del 7%).
* **Control de Versiones & CI/CD:** GitHub conectado a Vercel para despliegues automatizados.

---

## 🚀 Roadmap del Proyecto & Estado de Situación

* **[x] Hito 1 — Relevamiento Inicial:** Entrevista sincrónica grabada con la administradora Paula. Identificación de las 9 UFs, desglose de expensas (Ordinarias A, Extraordinarias B, Fondo de Reserva) y problemática operativa.
* **[x] Hito 2 — Prototipado Interactivo & Segunda Entrevista:** Desarrollo del prototipo navegable en Stitch/Figma. Demostración sincrónica realizada el **30/09/2026** con validación del 100% de los módulos por parte de la cliente.
* **[x] Hito 3 — Firma de Minuta & Entrega Etapa 2:** Aprobación de la Minuta de Conformidad, confección de la Especificación UML (Casos de Uso, Clases/DER, Secuencia y Actividades) y presentación del Informe Maestro.
* **[ ] Hito 4 — Etapa 3 (En Curso):** Apertura de ramas de desarrollo para codificación ágil de los sprints de software sobre Next.js, Prisma y Supabase.

---

## 📌 Reglas de Negocio Validadas con la Cliente
1. **Prorrateo por Coeficiente:** Distribución de Gastos Ordinarios (A), Extraordinarios (B) y Fondo de Reserva entre las 9 Unidades Funcionales.
2. **Retención de Mercado Pago (0,6%):** Deducción automática de comisiones sobre transferencias imputada como Gasto Ordinario a prorratear.
3. **Recargo por Mora (7%):** Aplicación automática de recargo sobre saldos deudores a partir del día 1 del mes subsiguiente (vencimiento regular fijado el **día 15**).
4. **Carga de Gastos y Período por Defecto:** Selección automática del mes en curso para cargas diarias y **bloqueo/congelamiento de seguridad** tras la emisión de las expensas.
5. **Cronograma Rotativo de Limpieza:** Ciclo de 9 semanas con función de permuta/intercambio y multa automática de **$24.000** ante incumplimiento.
6. **Mesa de Ayuda, Votación & Chatbot IA:** Tiquetera de reclamos, votación de presupuestos con quórum del **30%-40%** y Asistente Virtual 24/7 con la API de Gemini.

---

## 📁 Estructura Oficial de Archivos (Google Drive)
```
📁 PPIV_DeveloPet_Friendly_2C26/
  ├── 📁 Cliente_IFTS/Consorcio_Calle_425/
  │     ├── Presentación visual y propuesta de valor
  │     ├── Enlace al prototipo interactivo (Stitch / Figma)
  │     ├── Grabación de la Demo del 30/09/2026
  │     └── Minuta de Conformidad
  └── 📁 Documentacion_Interna/
        ├── Informe Maestro de Análisis y Diseño (Etapa 2 )
        ├── Especificación de Diagramas UML (Etapa 2 )
        └── Diagramas Editables y Recursos
```
