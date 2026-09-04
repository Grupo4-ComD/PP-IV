# DeveloPet Friendly 🐾
## Plataforma Integral de Gestión Residencial — Consorcio Calle 425

Bienvenidos al repositorio institucional de **DeveloPet Friendly**, la Software Factory conformada para el desarrollo del Proyecto Integrador en la materia **Prácticas Profesionalizantes IV (Jueves)** de la Tecnicatura Superior en Desarrollo de Software.

> 🏫 **Institución:** Instituto de Formación Técnica Superior Nº 29 (IFTS 29)  
> 🗓️ **Ciclo Lectivo:** Segundo Cuatrimestre de 2026  
> 👨‍🏫 **Docentes Evaluadores:** Prof. Emir & Prof. Kevin

---

## 👥 Integrantes y Roles del Equipo

De acuerdo con los estándares profesionales y la sinergia organizativa recomendada por la cátedra, nuestro equipo se estructura bajo los siguientes roles específicos:

*   **G — Coordinador de Proyecto & Analista Funcional:** Gestión del ciclo de vida, ingeniería de requerimientos, enlace formal con el cliente y redacción de minutas de acuerdo.
*   **V — Diseñador UX/UI & Desarrollador Frontend:** Diseño del sistema de diseño, prototipado interactivo en Figma y maquetación de interfaces responsivas y accesibles.
*   **B — Desarrollador de Software Backend:** Arquitectura de base de datos relacional, diseño del motor contable, integración de APIs y seguridad criptográfica.
*   **M — Administrador de Sistemas & DevOps:** Configuración de entornos en la nube, control de acceso, pipelines de despliegue continuo (CI/CD) y soporte técnico.

---

## 🛠️ Stack Tecnológico Seleccionado

Para garantizar la robustez, consistencia transaccional y escalabilidad del servicio, hemos seleccionado un conjunto de tecnologías modernas de estándar industrial:

*   **Frontend & Framework:** [Next.js 15+ (App Router)](https://nextjs.org/) con React.
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Maquetado Glassmorphism adaptable).
*   **Base de Datos Relacional:** [PostgreSQL](https://www.postgresql.org/) (Alojada en la nube mediante Supabase).
*   **Mapeador Objeto-Relacional (ORM):** [Prisma ORM](https://www.prisma.io/).
*   **Seguridad y Autenticación:** Tokens JWT (vía `jose`) y Hasheo de credenciales con `bcrypt`.
*   **Control de Versiones & CI/CD:** GitHub conectado a [Vercel](https://vercel.com/) para despliegues automatizados basados en ramas de desarrollo.

---

Este repositorio ha sido inicializado con la **arquitectura e infraestructura base del proyecto** (instalación limpia de dependencias, configuración de entornos locales/nube y el pipeline de despliegue automatizado en Vercel). 


El desarrollo de los módulos de negocio se iniciará estrictamente de acuerdo al siguiente Roadmap:
1.  **Hito 1 (En curso):** Entrevista de Relevamiento de Requisitos Sincrónica Grabada con la administradora.
2.  **Hito 2:** Diseño, refinamiento y aprobación por parte de la administradora del **Prototipo Interactivo en Figma** (maquetado sobre la interfaz real capturada).
3.  **Hito 3:** Firma de la Minuta de Conformidad de Requerimientos y apertura de ramas de desarrollo para codificación ágil de los sprints.

---

## 📂 Estructura Base del Repositorio 

---

🚀 Guía de Inicialización Local
Clonar el repositorio:

Instalar dependencias base:
npm install

Copiar el archivo de variables de entorno:
cp .env.example .env

Levantar el entorno de desarrollo:
npm run dev
