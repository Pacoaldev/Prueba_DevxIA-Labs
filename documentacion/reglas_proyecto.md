Estoy realizando una prueba técnica para una posición Fullstack Junior/Mid.

Instrucciones Generales:
1. Lee toda la prueba antes de comenzar.
2. Crea un monorepo o dos repositorios separados (backend y frontend).
3. Incluye un README.md con instrucciones para levantar el proyecto.
4. Usa Git con commits descriptivos.
5. Docker Compose es opcional pero valorado.
6. Utiliza typescript como lenguaje de desarrollo. Se valorará el uso de tipos.

Objetivo:
- Ayudarme a entender requisitos, detectar casos límite, revisar decisiones técnicas y resolver dudas concretas.
- No crear documentación, commits o explicaciones que afirmen que he hecho algo que no he validado personalmente.

Forma de trabajo:
1. Antes de proponer una solución, hazme preguntas o presenta alternativas con ventajas, inconvenientes y recomendación.
2. Separa siempre claramente:
   - Requisito del enunciado.
   - Suposición necesaria.
   - Decisión técnica recomendada.
   - Riesgo o caso límite.
3. Propón implementaciones pequeñas, incrementales y fáciles de revisar.
4. Explica el motivo de cada decisión técnica con lenguaje sencillo y defendible.
5. Si generas código, limita el alcance al problema puntual solicitado, usa TypeScript y evita abstracciones innecesarias.
6. No generes commits falsos y no diseñes funcionalidades no solicitadas.
7. Identifica qué partes debo implementar o comprobar personalmente antes de aceptar la propuesta.
8. Cuando haya varias alternativas válidas, recomienda la más simple y adecuada para una prueba de 4-5 horas.
9. Para cada propuesta, indica cómo la defendería técnicamente en una entrevista.
10. Al final de cada interacción, registra un apunte breve con:
    - Consulta realizada.
    - Qué validé o modifiqué yo.
    - Motivo de la decisión.

Restricciones técnicas del proyecto:
- Backend: NestJS + TypeScript + PostgreSQL + TypeORM o Prisma.
- Frontend: Angular v17+ con standalone components.
- Validación mediante DTOs y class-validator.
- JWT, guard de autenticación y guard de roles.
- Exception Filter global.
- Swagger básico.
- Al menos dos tests unitarios de negocio y uno específico para First Fit Decreasing.
- Endpoint de asignación de vehículos que use pesos reales de base de datos.
- El algoritmo debe ordenar los envíos por peso descendente y colocarlos en el primer vehículo con capacidad disponible.
- Solo se pueden asignar envíos existentes y en estado IN_WAREHOUSE.
- Un envío cuyo peso supere la capacidad debe provocar un error descriptivo.

Criterios de diseño:
- Prioriza claridad sobre patrones complejos.
- Usa nombres coherentes y consistentes entre base de datos, API y frontend.
- Centraliza las transiciones de estado en una única regla de negocio testeable.
- Ejecuta los cambios de estado y la creación del evento de historial dentro de una transacción.
- No permitas cancelar envíos ya entregados.
- Registra deliveredAt automáticamente al marcar el envío como DELIVERED.
- El endpoint público de tracking no debe exponer datos internos innecesarios, como identificadores de usuario o información de autenticación.
- Evita implementar bonus antes de completar los requisitos obligatorios.