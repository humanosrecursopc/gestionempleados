# Kamila HRM - Enterprise Solution (Cloudflare + D1)

Sistema integral de Gestión de Capital Humano y Nómina inteligente para la República Dominicana.

## 🚀 Módulos Implementados

### 1. Gestión de Capital Humano
- **Expediente Digital**: Datos personales, laborales y bancarios.
- **KPIs**: Conteo de activos, altas y bajas del mes.
- **Filtros**: Búsqueda por departamento, cargo y sede (Central / Norte / Remoto).

### 2. Nómina Inteligente (RD 🇩🇴)
- **Cálculo Automático**: 
  - TSS: SFS (3.04%), AFP (2.87%).
  - ISR: Escala progresiva DGII 2024.
  - Aportes Patronales: SFS, AFP, SRL, INFOTEP.
- **Seguridad**: Validación por OTP para aprobación de pagos.

### 3. Control de Asistencia (Biometría)
- **Webhooks**: Integración lista para terminales faciales Hikvision.
- **Mobile**: Registro con Geolocalización y validación antifraude.

### 4. Gestión de Licencias (Sistemas)
- Control de inventario de software (Office 365, AWS, etc.).
- Monitoreo de presupuesto mensual y anual.

### 5. Seguridad y Kill-Switch
- **Middleware de Licencia**: Bloqueo global por falta de pago o revocación.
- **RBAC**: Roles de Admin, RRHH y Operador.
- **Auditoría**: Registro de acciones críticas.

## 🛠️ Tecnologías
- **Backend**: Cloudflare Workers + Hono.
- **Base de Datos**: Cloudflare D1 (SQLite).
- **Lenguaje**: TypeScript.
- **Validación**: Zod.

## 📦 Despliegue

```bash
# Instalar dependencias
pnpm install

# Aplicar migraciones a D1 (Local)
pnpm seedLocalD1

# Aplicar migraciones (Producción)
pnpm predeploy

# Correr en desarrollo
pnpm dev
```

## 🔐 Endpoints Principales

- `GET /api/employees`: Listado de empleados con filtros.
- `POST /api/payroll/calculate/:id`: Calcula nómina con leyes de RD.
- `POST /api/attendance/punch`: Registro de asistencia (App/Web).
- `POST /attendance/webhook/hikvision`: Webhook para terminales físicos.
- `GET /system/status`: Verifica estado de la licencia global.
