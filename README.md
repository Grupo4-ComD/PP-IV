# DeveloPet Friendly 🐾
### Plataforma Integral de Gestión Residencial — Consorcio Calle 425

> **Estado del Proyecto:** ✅ **Finalizado y Desplegado en Producción**  
> Proyecto Integrador culminado con éxito 
**Prácticas Profesionalizantes IV**.

---

## 🏫 Información Institucional
* **Institución:** Instituto de Formación Técnica Superior Nº 29 (IFTS 29)
* **Carrera:** Tecnicatura Superior en Desarrollo de Software
* **Ciclo Lectivo:** Segundo Cuatrimestre de 2026
* **Materia:** Prácticas Profesionalizantes IV 
* **Docentes Evaluadores:** Lic. Kevin Del Bello & Lic. Emir García Ontiveros
* **Cliente / Proyecto:** Consorcio Calle 425 (Administradora Paula)

---

## 👥 Integrantes y Roles del Equipo (Software Factory)

1. **Guillermo Sciulli**  — **Líder de Proyecto & Analista Funcional**
   * *Responsabilidades:* Coordinación general del equipo, comunicación con cliente y docentes, relevamiento de requisitos y especificación de reglas de negocio.
2. **Braian Perea**  — **Diseñador UX/UI & Arquitecto de Base de Datos**
   * *Responsabilidades:* Prototipado interactivo navegable en Figma, modelado relacional en PostgreSQL/Prisma ORM y diagramación UML/DER de la solución.
3. **Verónica Greco**  — **Desarrolladora Frontend & Maquetación UI**
   * *Responsabilidades:* Maquetación de interfaces responsivas en Next.js (App Router), Tailwind CSS (*Glassmorphism*) y vistas del Portal del Vecino y Administrador.
4. **Mailén Juárez**  — **Responsable de QA / Testing & Aseguramiento de Calidad**
   * *Responsabilidades:* Control de calidad de entregables, matriz de pruebas funcionales, validación de reglas de negocio y aseguramiento de la entrega final.

---

## 🛠️ Stack Tecnológico

* **Frontend & Framework:** Next.js (App Router) con React y TypeScript.
* **Estilos & UI:** Tailwind CSS (Maquetado *Glassmorphism* adaptable, soporte Dark/Light mode) y Lucide Icons.
* **Base de Datos Relacional:** PostgreSQL alojado en la nube mediante **Supabase** (soporte de connection pooling y direct connection).
* **ORM:** Prisma ORM para modelado relacional fuertemente tipado, migraciones y transacciones ACID.
* **Inteligencia Artificial:** Google Gemini API (modelo RAG con streaming vía Vercel AI SDK) para el Asistente Virtual sobre el Reglamento de Copropiedad (con motor de reglas de respaldo local).
* **Seguridad & Autenticación:** Sesiones basadas en cookies seguras HttpOnly con Supabase SSR Auth, control de acceso basado en roles (RBAC) y hasheo de credenciales con `bcrypt`.
* **Integración Financiera:** Módulo de conciliación con deducción automática de comisión de Mercado Pago (0,6%) y cálculo de recargo por mora (7%).
* **Generación de Reportes:** Exportación de cupones de expensas y balances en formato PDF (`jspdf` y `jspdf-autotable`).
* **CI/CD & Hosting:** GitHub integrado con Vercel para despliegues automatizados y Edge Network.

---

## 📌 Reglas de Negocio Implementadas y Validadas

1. **Prorrateo por Coeficiente m²:** Distribución de Gastos Ordinarios, Extraordinarios y Fondo de Reserva entre las 9 Unidades Funcionales según su porcentual legal exacto.
2. **Retención de Mercado Pago (0,6%):** Deducción automática de comisiones sobre transferencias imputada como Gasto Ordinario a prorratear.
3. **Recargo por Mora (7%):** Aplicación automática de recargo punitorio sobre saldos deudores a partir del día subsiguiente al vencimiento regular (fijado el **día 15**).
4. **Congelamiento Inmutable de Período (RF-08):** Bloqueo de seguridad contable tras el cierre y emisión de expensas, impidiendo alteraciones o reemisiones retroactivas.
5. **Cronograma Rotativo de Limpieza:** Ciclo continuo de 9 semanas con función peer-to-peer de solicitud de permuta y multa automática de **$24.000** ante incumplimiento (compensando a la UF sustituta).
6. **Mesa de Ayuda ITIL 4 & Votación de Obras:** Tiquetera de reclamos clasificada por incidente, solicitud o problema con control de SLAs (4h a 96h), CSAT y votación ponderada de presupuestos con quórum mínimo del **30%–40%**.
7. **Asistente Virtual 24/7:** Chatbot interactivo con conocimiento del Reglamento de Copropiedad que responde citando cláusulas y deriva a la Mesa de Ayuda ante incidencias edilicias.

---

## 🚀 Puesta en Marcha Local (Desarrollo y Auditoría)

### 1. Clonación e Instalación
```bash
git clone https://github.com/Grupo4-ComD/PP-IV
npm install
```

### 2. Variables de Entorno
Copia el archivo de plantilla `.env` en la raíz del proyecto,


### 3. Base de Datos y Sembrado Inicial (Seeds)
```bash
# Sincronizar el esquema relacional de Prisma con PostgreSQL
npx prisma db push

# Poblar datos iniciales (las 9 UFs, usuarios, gastos y mantenimientos)
node seed.js
node migrar.js
node seed_mantenimientos.js
```

### 4. Servidor de Desarrollo
```bash
npm run dev
```
La aplicación quedará disponible en `http://localhost:3000`.

---

## 🚦 Roadmap del Proyecto & Estado de Cumplimiento

* [x] **Hito 1 — Relevamiento Inicial:** Entrevista sincrónica grabada con la administradora Paula. Identificación de las 9 UFs, desglose de expensas y problemática operativa.
* [x] **Hito 2 — Prototipado Interactivo & Segunda Entrevista:** Prototipo navegable en Figma validado al 100% por la cliente en la demo del 30/09/2026.
* [x] **Hito 3 — Firma de Minuta & Entrega Etapa 2:** Minuta de Conformidad, especificación UML completa e Informe Maestro de Análisis y Diseño.
* [x] **Hito 4 — Arquitectura, Base de Datos y Desarrollo Core (Etapa 3):** Implementación integral en Next.js, Prisma ORM, Supabase, Mesa ITIL 4 y Gemini AI.
* [x] **Hito 5 — Cierre, Homologación y Despliegue en Producción (Finalizado):** Validación completa de la matriz de pruebas funcionales (QA), auditoría de seguridad y despliegue continuo en producción (Vercel & Supabase Cloud).
