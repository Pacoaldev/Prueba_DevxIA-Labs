# Plan de Implementacion — Prueba Tecnica Fullstack Logistica (Ajustado)

## 1. Decisiones de Arquitectura y Estructura

- **Monorepo** con `apps/api` (NestJS) y `apps/web` (Angular v17+ standalone).
- **ORM**: Prisma (modelado rapido, migraciones simples, relaciones tipadas).
- **Seed**: ejecutable en dev con usuario `SUPERVISOR` inicial (credenciales en `README.md`).
- `docker-compose.yml` y `README.md` en raiz.

## 2. Backend (NestJS + Prisma + PostgreSQL)

### 2.1 Modelo de Datos (Prisma Schema)
- `User`: id (UUID), email (unique), passwordHash, role (`OPERATOR` | `SUPERVISOR`), createdAt.
- `Shipment`: id (UUID), trackingCode (unique, `ENV-YYYYMMDD-XXXX`), originAddress, destinationAddress, recipientName, contactPhone (opcional, regex flexible), weightKg (Float), status (Enum), createdAt, deliveredAt (DateTime?).
- `ShipmentEvent`: id (UUID), shipmentId (FK), status (Enum), timestamp, location, notes (opcional), userId (FK, opcional).

### 2.2 Estados y Mapa de Transiciones
Estados permitidos: `CREATED`, `IN_WAREHOUSE`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `RETURNED`, `CANCELLED`.

Mapa cerrado de transiciones validas:
- `CREATED` → `IN_WAREHOUSE`, `CANCELLED`
- `IN_WAREHOUSE` → `IN_TRANSIT`, `CANCELLED`
- `IN_TRANSIT` → `OUT_FOR_DELIVERY`, `CANCELLED`
- `OUT_FOR_DELIVERY` → `DELIVERED`, `RETURNED`, `CANCELLED`
- `DELIVERED` → (Estado terminal, sin transiciones)
- `RETURNED` → (Estado terminal, sin transiciones)
- `CANCELLED` → (Estado terminal, sin transiciones)

### 2.3 Reglas de Negocio
1. **Transacciones**: el cambio de estado y la creacion de `ShipmentEvent` ocurren dentro de un `prisma.$transaction`.
2. **DELIVERED**: setea `deliveredAt = now()` automaticamente.
3. **Cancelar**: permitido desde cualquier estado excepto `DELIVERED` y `RETURNED`.
4. **Auth Guards**: JWT Guard global/local, Role Guard para `/auth/register` (solo `SUPERVISOR`).
5. **Tracking Publico**: DTO estricto que oculta `userId`, emails, notas internas y hashes.

### 2.4 Algoritmo First Fit Decreasing (FFD) — `POST /shipments/assign-vehicles`
- Recibe `shipmentIds[]` y `vehicleCapacity`.
- Obtiene pesos reales de DB via Prisma.
- Valida que todos existan y esten en estado `IN_WAREHOUSE`.
- Si algun peso > `vehicleCapacity`, lanza BadRequestException descriptiva.
- Ordena por peso DESC y asigna al primer vehiculo donde quepa.
- Retorna lista de vehiculos, pesos totales y capacidad restante.

### 2.5 Tests Obligatorios
- Test unitario: servicio de transiciones de estado (casos validos e invalidos).
- Test unitario: regla de cancelacion de envios.
- Test unitario: algoritmo FFD (casos normales, excede capacidad, estados invalidos).

## 3. Frontend (Angular v17+ Standalone)

- Architecture: `apps/web` con Standalone Components, Reactive Forms, Angular Material.
- Lazy loading en rutas principales (`/login`, `/shipments`, `/tracking`, `/tracking`).
- Interceptor HTTP para adjuntar Bearer token JWT.
- Auth Guard y Role Guard.
- Vistas:
  1. Login + Registro (Registro visible/accesible solo si el usuario logueado es `SUPERVISOR`).
  2. Listado de envios con paginacion servidor + filtro por estado.
  3. Detalle de envio con timeline/stepper de historial + formulario modal para cambio de estado.
  4. Vista publica de tracking (sin auth).

## 4. Estrategia de Trabajo Incremental

- **Bloque 1**: Scaffold Monorepo + Prisma schema + Seed `SUPERVISOR`.
- **Bloque 2**: Auth Module (register, login, JWT, guards).
- **Bloque 3**: Shipments Module (CRUD, transacciones, mapa de estados, tests unitarios).
- **Bloque 4**: Algoritmo FFD + test unitario FFD.
- **Bloque 5**: Tracking publico + DTO seguro.
- **Bloque 6**: Frontend Angular (Auth + Shipments + Tracking).
- **Bloque 7**: Docker Compose + README + Validacion final.