# Plan de Implementacion v2 — Prueba Tecnica Fullstack Logistica

## 1. Decisiones de Arquitectura y Estructura
- Monorepo con `apps/api` (NestJS) y `apps/web` (Angular v17+ standalone).
- ORM: Prisma (modelado rapido, migraciones simples, relaciones tipadas).
- Seed de desarrollo crea el primer usuario `SUPERVISOR` (credenciales en `README.md`).
- `docker-compose.yml` y `README.md` en raiz.
- Nombres de estados internos en ingles; la interfaz los traduce al espanol.

## 2. Backend (NestJS + Prisma + PostgreSQL)

### 2.1 Modelo de Datos (Prisma Schema)
- `User`: id (UUID), email (unique), passwordHash, role (`OPERATOR` | `SUPERVISOR`), createdAt.
- `Shipment`: id (UUID), trackingCode (unique, `ENV-YYYYMMDD-XXXX`), originAddress, destinationAddress, recipientName, contactPhone (opcional, regex flexible), weightKg (Float), status (Enum), createdAt, deliveredAt (DateTime?).
- `ShipmentEvent`: id (UUID), shipmentId (FK), status (Enum), occurredAt, location, notes, userId (FK, OBLIGATORIO para eventos creados por usuarios; el evento inicial de creacion se asocia al usuario que crea el envio).

### 2.2 Estados y Mapa de Transiciones
Estados: `CREATED`, `IN_WAREHOUSE`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `RETURNED`, `CANCELLED`.

Mapa cerrado de transiciones validas:
- `CREATED` → `IN_WAREHOUSE`, `CANCELLED`
- `IN_WAREHOUSE` → `IN_TRANSIT`, `CANCELLED`
- `IN_TRANSIT` → `OUT_FOR_DELIVERY`, `CANCELLED`
- `OUT_FOR_DELIVERY` → `DELIVERED`, `RETURNED`, `CANCELLED`
- `DELIVERED` → (terminal, sin transiciones)
- `RETURNED` → (terminal, sin transiciones)
- `CANCELLED` → (terminal, sin transiciones)

Regla de cancelacion documentada: se permite cancelar desde `CREATED`, `IN_WAREHOUSE`, `IN_TRANSIT` y `OUT_FOR_DELIVERY`. No se permite cancelar desde `DELIVERED`, `RETURNED` ni `CANCELLED`.

Cambio de estado + creacion de `ShipmentEvent` en una misma transaccion. Al entregar se establece `deliveredAt`.

### 2.3 Autenticacion y Registro
- `POST /auth/register` requiere autenticacion JWT y rol `SUPERVISOR`.
- No existe auto-registro publico.
- El usuario inicial se crea mediante seed de desarrollo.
- `POST /auth/login` publico, devuelve JWT.
- Role Guard protege endpoints de supervisor.

### 2.4 Tracking Publico
- `GET /tracking/:trackingCode` sin autenticacion.
- DTO publico especifico; el backend decide que campos expone.
- `ShipmentEvent.notes` se almacena internamente y se expone en el tracking publico (el enunciado lo trata como parte del evento).
- Respuesta publica:
  - trackingCode, status, originAddress, destinationAddress, recipientName, createdAt, deliveredAt
  - events: status, occurredAt, location, notes
- Se omiten: contactPhone, userId y cualquier dato de autenticacion.

### 2.5 Algoritmo FFD — `POST /shipments/assign-vehicles`
Flujo:
1. Validar `shipmentIds` y `vehicleCapacity` (capacidad > 0).
2. Rechazar IDs duplicados con `BadRequestException`.
3. Consultar todos los envios por sus identificadores.
4. Comprobar que la cantidad encontrada coincide con la solicitada.
5. Comprobar que todos estan en `IN_WAREHOUSE`.
6. Comprobar que ningun peso supera la capacidad.
7. Ejecutar la funcion pura FFD (ordenar DESC por peso, asignar al primer vehiculo con hueco).
8. Mapear el resultado al DTO de respuesta.

El endpoint no modifica envios; no requiere transaccion de escritura, solo lectura coherente.

## 3. Frontend (Angular v17+ standalone)
- Standalone Components, Reactive Forms, Angular Material.
- Lazy loading en `/login`, `/shipments` y `/tracking`.
- Interceptor HTTP para adjuntar Bearer token JWT.
- Auth Guard y Role Guard.
- Vistas:
  1. Login. El formulario de registro solo es visible/accesible para usuarios con rol `SUPERVISOR`.
  2. Listado de envios con paginacion servidor + filtro por estado.
  3. Detalle de envio con timeline/stepper de historial + formulario modal para cambio de estado.
  4. Vista publica de tracking (fuera del guard de autenticacion).
- Cambio de estado en detalle:
  - Mostrar unicamente transiciones validas (obtenidas del backend o de constante compartida).
  - No mostrar estados invalidos en el selector.
  - Enviar siempre `location` y `notes`.
  - Mostrar loading y errores.

## 4. Tests
### Transiciones
- `CREATED → IN_WAREHOUSE`: valido.
- `CREATED → DELIVERED`: invalido.
- `OUT_FOR_DELIVERY → RETURNED`: valido.
- `DELIVERED → CANCELLED`: invalido.
- `RETURNED → CANCELLED`: invalido.
- Verificar que `deliveredAt` se establece al entregar.

### Cancelacion
- Cancela desde `CREATED`.
- Cancela desde `IN_WAREHOUSE`.
- Rechaza `DELIVERED`.
- Rechaza `RETURNED`.
- Rechaza `CANCELLED`.

### FFD
- Capacidad 100, pesos 70, 45, 30, 25, 20 → Vehiculo 1: 70+30=100; Vehiculo 2: 45+25+20=90; total 2 vehiculos.
- Peso superior a la capacidad.
- Envio inexistente.
- Envio que no esta en `IN_WAREHOUSE`.
- Lista vacia.
- Capacidad cero o negativa.
- IDs duplicados.

## 5. Plan Temporal (prioridad)
1. Scaffold, Prisma, PostgreSQL y seed.
2. Autenticacion y roles.
3. Modelo de envios y eventos.
4. Transiciones, cancelacion y tracking.
5. Algoritmo FFD y tests.
6. Frontend minimo funcional.
7. Docker, README y validacion.

Bonus opcionales solo despues del core: vista frontend de asignacion, dashboard, CSV, CI/CD.
