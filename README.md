# Buscador de ETFs y Fondos de Inversión

Aplicación web creada con Next.js para facilitar la búsqueda, comparación y análisis de fondos de inversión y ETFs. Ofrece visualizaciones interactivas y generación de informes con IA.

## Características Principales

- 🔍 **Búsqueda avanzada** de fondos de inversión, fondos indexados y ETFs
- 📊 **Visualización interactiva** de datos con gráficos comparativos
- 📝 **Generación de informes** con IA mediante OpenAI
- 📱 **Diseño responsivo** adaptado a dispositivos móviles y desktop
- 🔄 **Filtrado dinámico** por múltiples criterios
- 📋 **Exportación de datos** en diferentes formatos (CSV, Excel, PDF)

## Estructura del Proyecto

```
buscador-ETFs/
├── src/
│   ├── app/              # Rutas y API endpoints (Next.js App Router)
│   │   ├── api/          # Endpoints de la API
│   │   │   ├── funds/           # API para búsqueda de fondos
│   │   │   ├── generate-report/ # API para generación de informes con IA
│   │   │   └── ...
│   │   └── ...
│   ├── components/       # Componentes de React
│   │   ├── FundTable.tsx       # Tabla de fondos con filtros
│   │   ├── FundCharts.tsx      # Visualizaciones y gráficos
│   │   ├── ReportGenerator.tsx # Generación de informes
│   │   └── ...
│   ├── data/             # Datos estáticos (archivos CSV)
│   ├── types/            # Definiciones de tipos TypeScript
│   ├── store/            # Estado global (Zustand)
│   └── ...
└── ...
```

## Backend y API

El backend de la aplicación está construido utilizando el sistema de rutas API de Next.js, ofreciendo una serie de endpoints para diferentes funcionalidades:

### API de Fondos (`/api/funds`)

Proporciona acceso a los datos de fondos de inversión, con las siguientes características:

- Lectura de datos desde archivos CSV
- Filtrado por múltiples criterios (ISIN, categoría, divisa, nivel de riesgo, etc.)
- Paginación y ordenación de resultados
- Exportación de datos en formato CSV

```typescript
// Ejemplo de solicitud a la API de fondos
GET /api/funds?dataSource=fondos-gestion-activa&page=1&limit=20&category=Renta%20Variable
```

### API de Generación de Informes (`/api/generate-report`)

Genera informes detallados de fondos utilizando inteligencia artificial:

- Integración con la API de OpenAI (GPT-4)
- Análisis comparativo de fondos seleccionados
- Visualización de datos mediante gráficos Mermaid
- Formato Markdown para facilitar la lectura

```typescript
// Ejemplo de solicitud para generar un informe
POST /api/generate-report
Body: { funds: [...] }
```

## Generación de Informes con IA

El sistema de generación de informes es una de las características principales de la aplicación:

### Flujo de trabajo

1. El usuario selecciona fondos para analizar
2. Se envía una solicitud a `/api/generate-report` con los datos de los fondos
3. El backend procesa la información y crea un prompt estructurado para OpenAI
4. La IA genera un informe detallado con análisis, comparativas y visualizaciones
5. El informe se renderiza con formato Markdown en el componente `ReportGenerator`

### Características del sistema de informes

- **Análisis completo**: Evaluación de rendimiento, riesgo, comisiones y otros factores
- **Visualizaciones integradas**: Gráficos Mermaid para mostrar:
  - Comparativa de rentabilidades
  - Relación riesgo-rentabilidad
  - Distribución de comisiones
- **Recomendaciones éticas**: La IA no proporciona recomendaciones definitivas de compra/venta, sino que deja la decisión final al usuario y su asesor
- **Exportación de informes**: Posibilidad de descargar o imprimir los informes generados

## Visualización de Datos

El componente `FundCharts` proporciona visualizaciones interactivas de los fondos seleccionados:

- **Gráfico de rentabilidades**: Comparativa de rendimientos a 1 año
- **Gráfico de riesgo/rentabilidad**: Muestra la relación entre riesgo y retorno
- **Gráfico de comisiones**: Análisis de las comisiones de gestión

Todas las visualizaciones se generan utilizando la biblioteca Mermaid, lo que permite una integración perfecta con los informes generados.

## Tecnologías Utilizadas

- **Frontend**:
  - Next.js 14 (React)
  - TypeScript
  - TailwindCSS
  - Zustand (gestión de estado)
  - Tanstack React Table
  - Mermaid (visualización de datos)
  - React Markdown

- **Backend**:
  - Next.js API Routes
  - OpenAI API
  - Node.js

- **Procesamiento de datos**:
  - PapaParse (CSV)
  - XLSX (Excel)

## Instalación y Configuración

### Requisitos previos

- Node.js 18.0 o superior
- NPM o Yarn

### Pasos para la instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/buscador-ETFs.git
cd buscador-ETFs
```

2. Instalar dependencias:
```bash
npm install
# o
yarn install
```

3. Configurar variables de entorno:
Crear un archivo `.env.local` con las siguientes variables:
```
OPENAI_API_KEY=tu_api_key_de_openai
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
```

5. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador

## Despliegue

La aplicación está preparada para ser desplegada en cualquier plataforma que soporte Next.js, como Vercel, Netlify o servicios de hosting tradicionales.

```bash
# Construir para producción
npm run build
# o
yarn build

# Iniciar en modo producción
npm run start
# o
yarn start
```

## Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Sube tu rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Distribuido bajo la licencia MIT. Consulta `LICENSE` para más información.

## Contacto

Nombre del Proyecto: [Buscador de ETFs](https://github.com/tu-usuario/buscador-ETFs)

---

Desarrollado con ❤️ para ayudar a inversores a tomar decisiones informadas. 