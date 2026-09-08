# TransLog — Sistema de Gestión Logística y Seguimiento de Envíos

Plataforma Fullstack de gestión logística desarrollada para la prueba técnica. Proporciona una solución integral con arquitectura monorepo, API REST en NestJS, frontend reactivo en Angular v17+ Standalone y base de datos PostgreSQL gestionada mediante Prisma ORM.

---

## 🚀 Credenciales por Defecto (Seed)

Al iniciar el sistema o ejecutar el script de seed, se crea automáticamente un usuario inicial con rol `SUPERVISOR`:

- **Email**: `supervisor@translog.com`
- **Password**: `supervisor123`
- **Rol**: `SUPERVISOR`

> **Nota**: El registro de nuevos usuarios (`POST /auth/register`) está protegido mediante JWT y guard de rol, permitiendo únicamente a usuarios con rol `SUPERVISOR` registrar nuevos operadores o supervisores.

---

## 🛠️ Decisiones Técnicas y de Arquitectura

### 1. Backend (NestJS + Prisma ORM + PostgreSQL)
- **Prisma ORM**: Elegido por su seguridad de tipos estática en TypeScript, facilidad en migraciones declarativas y simplicidad para ejecutar operaciones complejas en transacciones (`prisma.$transaction`).
- **Máquina de Estados de Envíos**: Definida mediante una máquina de estados finitos cerrada en `ShipmentTransitionService`. Garantiza que solo se puedan realizar transiciones válidas:
  - `CREATED` → `IN_WAREHOUSE`, `CANCELLED`
  - `IN_WAREHOUSE` → `IN_TRANSIT`, `CANCELLED`
  - `IN_TRANSIT` → `OUT_FOR_DELIVERY`, `CANCELLED`
  - `OUT_FOR_DELIVERY` → `DELIVERED`, `RETURNED`, `CANCELLED`
  - `DELIVERED`, `RETURNED`, `CANCELLED` → (Estados terminales)
- **Histórico Transaccional (`ShipmentEvent`)**: Cada cambio de estado y la creación inicial de un envío ejecutan en una transacción atómica el cambio de estado en la tabla `Shipment` y la inserción de un registro en `ShipmentEvent` con fecha, ubicación, responsable (`userId`) y notas. Al pasar a `DELIVERED`, se establece automáticamente la fecha `deliveredAt`.
- **Seguridad en Tracking Público**: El endpoint público `GET /tracking/:trackingCode` no requiere autenticación y utiliza un DTO estricto que omite deliberadamente datos sensibles como el teléfono de contacto, identificadores de usuario (`userId`) y credenciales.

### 2. Algoritmo de Asignación de Carga (First Fit Decreasing - Bin Packing)
El endpoint `POST /shipments/assign-vehicles` resuelve el problema de Bin Packing para empaquetar envíos en el menor número de vehículos de carga posible.
- **Flujo**:
  1. Recibe la lista de `shipmentIds` y la capacidad máxima por vehículo `vehicleCapacity`.
  2. Valida que no existan IDs duplicados y que todos los envíos existan en la base de datos.
  3. Verifica que todos los envíos estén en estado `IN_WAREHOUSE`.
  4. Lanza un error descriptivo si el peso de un paquete individual supera la capacidad del vehículo.
  5. Ordena los paquetes en **orden descendente** por peso (`weightKg`).
  6. Asigna cada paquete al **primer vehículo** que disponga de capacidad suficiente (`remainingCapacity >= peso`). Si no cabe en ninguno de los vehículos abiertos, habilita un nuevo vehículo.

### 3. Frontend (Angular v17+ Standalone & Signals)
- **Componentes Standalone**: Arquitectura basada 100% en componentes independientes sin uso de `NgModule`.
- **Sintaxis Moderna Control Flow**: Uso exclusivo de `@if`, `@for` y `@switch` en plantillas.
- **Estado Reactivo con Signals**: Uso de Angular `signal()` para manejar el estado reactivo de las listas, modales, alertas y datos de seguimiento público.
- **Intercepción JWT**: `jwtInterceptor` adjunta automáticamente el token Bearer JWT almacenado a todas las peticiones HTTP que requieren autenticación.
- **Guards de Ruta**: `authGuard` protege las rutas privadas y `roleGuard` restringe la pantalla de registro únicamente al rol `SUPERVISOR`.

---

## 📦 Estructura del Monorepo

```
.
├── apps/
│   ├── api/          # Backend NestJS + Prisma + PostgreSQL
│   └── web/          # Frontend Angular 17+ Standalone
├── docker-compose.yml
└── README.md
```

---

## ⚡ Guía de Arranque Rápido

### Opción A: Levantar con Docker Compose (Recomendado)

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker-compose up --build
```

- **Frontend Angular (Web App)**: `http://localhost:4200`
- **Backend NestJS (API REST)**: `http://localhost:8080`
- **PostgreSQL Database**: `localhost:5433`

---

### Opción B: Ejecución Local en Desarrollo

#### 1. Backend (`apps/api`)

```bash
cd apps/api
npm install

# Iniciar base de datos PostgreSQL (local o Docker)
# Configurar .env con DATABASE_URL

npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

npm run start:dev
```

#### 2. Frontend (`apps/web`)

```bash
cd apps/web
npm install
npm run start
```

Navega a `http://localhost:4200` en tu navegador.

---

## 🧪 Pruebas Unitarias

Para ejecutar la suite de pruebas unitarias del backend (cobertura de reglas de negocio, máquina de estados y algoritmo FFD):

```bash
cd apps/api
npm test
```