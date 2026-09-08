# Prueba Técnica — Fullstack Junior/Mid — Logística

## Desarrollador Fullstack Junior/Mid

**Sector:** Logística / Supply Chain  
**Stack:** NestJS (Backend) + Angular (Frontend) + PostgreSQL  
**Duración estimada:** 4–5 horas (entrega en 72 horas)  
**Formato de entrega:** Repositorio Git (GitHub/GitLab)

## Instrucciones generales

1. Lee toda la prueba antes de comenzar.
2. Crea un monorepo o dos repositorios separados (backend y frontend).
3. Incluye un `README.md` con instrucciones para levantar el proyecto.
4. Usa Git con commits descriptivos.
5. Docker Compose es opcional, pero valorado.
6. Utiliza TypeScript como lenguaje de desarrollo. Se valorará el uso de tipos.

## Contexto del proyecto

Una empresa de logística necesita un sistema interno para registrar envíos, actualizar su estado a lo largo de la cadena logística y permitir que los clientes consulten el estado de sus paquetes mediante un código de seguimiento.

### Flujo de estados

```text
CREADO → EN_ALMACÉN → EN_TRÁNSITO → EN_REPARTO → ENTREGADO
                                           └→ DEVUELTO
(cualquier estado) → CANCELADO
```

# 1. Backend (NestJS)

## 1.1 Descripción

Se espera que construyas una API REST con NestJS y PostgreSQL que dé soporte a la operativa diaria de TransLog. La API será consumida tanto por la aplicación Angular de los operadores como por la vista pública de tracking para clientes finales.

El backend debe cubrir tres áreas funcionales principales:

### Autenticación y usuarios

El sistema debe permitir el registro y login de usuarios mediante JWT. Cada usuario tiene un rol (operador o supervisor) que determina sus permisos.

Los supervisores pueden registrar nuevos usuarios; los operadores solo pueden autenticarse y trabajar con envíos.

### Gestión de envíos

Los operadores autenticados deben poder crear nuevos envíos indicando:

- Las direcciones de origen y destino.
- El nombre del destinatario.
- Un teléfono de contacto opcional.
- El peso del paquete en kilogramos.

Al crearse, el sistema debe generar automáticamente un código de seguimiento único con formato `ENV-YYYYMMDD-XXXX`.

Debe ser posible:

- Listar los envíos con paginación y filtro por estado.
- Consultar el detalle de un envío incluyendo su historial completo de eventos.
- Cancelar un envío siempre que no haya sido entregado previamente.
- Cambiar el estado respetando el flujo lógico definido.
- Registrar cada transición como un evento de seguimiento con fecha, usuario responsable, ubicación y notas.
- Registrar automáticamente la fecha de entrega al marcar un envío como entregado.

### Tracking público

Debe existir un endpoint sin autenticación que permita consultar el estado actual y el historial de un envío a partir de su código de seguimiento. Este endpoint será consumido por la vista pública del frontend.

El diseño del modelo de datos es responsabilidad del candidato. Se valorará que sea coherente, esté normalizado y refleje correctamente el dominio del negocio.

## 1.2 Endpoints

### Autenticación

- `POST /auth/register` — Registrar usuario.
- `POST /auth/login` — Iniciar sesión y obtener JWT.

### Envíos

Estos endpoints requieren autenticación:

- `POST /shipments` — Crear envío y generar `trackingCode`.
- `GET /shipments` — Listar envíos con paginación y filtro por estado.
- `GET /shipments/:id` — Consultar el detalle con historial de eventos.
- `PATCH /shipments/:id/status` — Cambiar estado, validar transiciones y crear `ShipmentEvent`.
- `DELETE /shipments/:id` — Cancelar envío, excepto si ya está entregado.

### Tracking público

No requiere autenticación:

- `GET /tracking/:trackingCode` — Consultar el estado e historial por código de seguimiento.

## 1.3 Reglas de negocio

- Las transiciones de estado deben respetar el flujo definido.
- Cada cambio de estado genera un `ShipmentEvent` con timestamp, ubicación y usuario.
- Al marcar un envío como `DELIVERED`, se registra automáticamente `deliveredAt`.
- No se puede cancelar un envío ya entregado.
- Solo un usuario `SUPERVISOR` puede registrar nuevos usuarios.

## 1.4 Requisitos técnicos

- TypeORM o Prisma con PostgreSQL.
- Validación de DTOs con `class-validator`.
- Guard de autenticación JWT y guard de rol.
- Exception Filter global.
- Swagger básico mediante decoradores en los controllers.
- Al menos dos tests unitarios de la lógica de negocio.

## 1.5 Desafío algorítmico: asignación de carga

Este ejercicio evalúa la capacidad de resolver un problema lógico con estructuras de datos básicas. Debe implementarse como un endpoint funcional del API.

### Endpoint

`POST /shipments/assign-vehicles`

### Contexto

La empresa tiene vehículos de reparto con una capacidad máxima de carga en kilogramos. Se necesita distribuir un conjunto de envíos en el menor número de vehículos posible.

### Entrada

```json
{
  "shipmentIds": ["uuid-1", "uuid-2", "uuid-3"],
  "vehicleCapacity": 100
}
```

### Ejemplo de salida esperada

```json
{
  "vehicles": [
    {
      "vehicleNumber": 1,
      "shipments": [
        {
          "shipmentId": "uuid-4",
          "trackingCode": "ENV-...",
          "weight": 45.0
        },
        {
          "shipmentId": "uuid-1",
          "trackingCode": "ENV-...",
          "weight": 32.5
        }
      ],
      "totalWeight": 77.5,
      "remainingCapacity": 22.5
    },
    {
      "vehicleNumber": 2
    }
  ],
  "totalVehiclesUsed": 3,
  "totalWeight": 267.5
}
```

### Requisitos

1. Implementar First Fit Decreasing: ordenar los envíos por peso descendente y asignar cada uno al primer vehículo donde quepa.
2. Obtener los pesos reales desde la base de datos.
3. Validar que todos los `shipmentIds` existan y estén en estado `IN_WAREHOUSE`.
4. Si un envío excede la capacidad del vehículo, retornar un error descriptivo.
5. Incluir al menos un test unitario específico para la lógica del algoritmo.

> Este problema se conoce como Bin Packing. No se busca la solución óptima; se evalúa la capacidad de descomponer el problema, elegir una estructura de datos y escribir código limpio y testeable.

# 2. Frontend (Angular)

## 2.1 Configuración

- Angular v17+ con standalone components.
- Angular Material o PrimeNG.
- Lazy loading en rutas.

## 2.2 Vistas requeridas

### Login y registro

- Formularios con validaciones reactivas.
- Gestión de sesión mediante JWT en storage.
- Route Guard e interceptor HTTP.

### Listado de envíos

Tabla con:

- Código de seguimiento.
- Destinatario.
- Destino.
- Estado con badge de color.
- Fecha.
- Paginación en servidor.
- Filtro por estado.
- Botón para crear un nuevo envío mediante formulario en modal o página independiente.

### Detalle del envío

- Datos del envío.
- Timeline o stepper con el historial de eventos.
- Acción para cambiar el estado, mostrando únicamente transiciones válidas.
- Campos de ubicación y notas.

### Tracking público

Página sin login donde el usuario pueda introducir su código y consultar el estado actual e historial del envío.

## 2.3 Requisitos técnicos

- Reactive Forms con validaciones.
- Servicios para la comunicación con el API.
- Loading states y manejo de errores mediante feedback visual, como toasts o snackbars.
- Estructura modular con standalone components.

## Puntos bonus opcionales

No son obligatorios, pero demuestran un nivel superior:

- Docker Compose que levante todo con un solo comando.
- Vista de asignación de vehículos en el frontend: seleccionar envíos, ejecutar el algoritmo y mostrar el resultado con barras de capacidad.
- Dashboard básico, solo para `SUPERVISOR`, con tarjetas del total de envíos por estado.
- Exportación CSV del listado de envíos.
- Pipeline CI/CD básico con GitHub Actions para lint y tests.
- Integración de Swagger en el backend.

# Formato de entrega

1. Repositorio Git con acceso al evaluador.
2. `README.md` con:
   - Descripción del proyecto.
   - Decisiones técnicas.
   - Explicación breve del algoritmo implementado.
   - Instrucciones para levantar el entorno.
3. Historial de commits limpio y descriptivo.
4. Si usas Docker, debe levantarse con un solo comando.

¡Mucha suerte! Si tienes dudas sobre los requerimientos, consúltalas antes de comenzar.
