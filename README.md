# Travel Request API

API REST para la gestión de solicitudes de viaje, desarrollada con **Express 5** y almacenamiento en archivos JSON. Permite el registro y autenticación de usuarios por roles (agente / cliente), y el CRUD completo de solicitudes de viaje.

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Endpoints](#endpoints)
  - [Autenticación](#autenticación)
  - [Solicitudes de viaje](#solicitudes-de-viaje)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelos de datos](#modelos-de-datos)
- [Validaciones](#validaciones)
- [Seguridad](#seguridad)
- [Autor](#autor)

## Arquitectura

```
Cliente (Next.js) ──► Express API ──► Archivos JSON (/data)
                        │
                   Middlewares
                  (JWT, Validación)
```

- **Framework:** Express 5
- **Autenticación:** JWT (jsonwebtoken) + bcrypt
- **Persistencia:** Archivos JSON en disco (`/data`)
- **OAuth:** GitHub (opcional)

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9

## Instalación

```bash
git clone <url-del-repositorio>
cd backenda
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3001
JWT_SECRET=tu_clave_secreta_jwt

# OAuth GitHub (opcional)
GITHUB_CLIENT_ID=tu_client_id
GITHUB_CLIENT_SECRET=tu_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

## Ejecución

```bash
# Producción
npm start

# Desarrollo (con hot-reload)
npm run dev
```

El servidor se iniciará en `http://localhost:3001` (o el puerto definido en `.env`).

## Endpoints

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

### Autenticación

| Método | Ruta                  | Descripción                        | Autenticación |
|--------|-----------------------|------------------------------------|---------------|
| POST   | `/api/auth/register`  | Registro de usuario                | No            |
| POST   | `/api/auth/login`     | Inicio de sesión (retorna JWT)     | No            |
| GET    | `/api/auth/clients`   | Lista de clientes (id, name, dni)  | JWT           |

**Registro** — `POST /api/auth/register`

```json
{
  "email": "usuario@ejemplo.com",
  "password": "Pass123",
  "name": "Nombre Completo",
  "dni": "12345678-5",
  "role": "client"
}
```

**Login** — `POST /api/auth/login`

```json
{
  "email": "usuario@ejemplo.com",
  "password": "Pass123"
}
```

Respuesta exitosa:

```json
{
  "message": "Login exitoso",
  "user": { "id": "...", "name": "...", "email": "...", "role": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Solicitudes de viaje

| Método | Ruta                  | Descripción                                  | Autenticación |
|--------|-----------------------|----------------------------------------------|---------------|
| GET    | `/api/requests`       | Obtener solicitudes (filtradas por rol)       | JWT           |
| POST   | `/api/requests`       | Crear nueva solicitud                        | JWT           |
| PUT    | `/api/requests/:id`   | Actualizar solicitud (preserva id y fecha)   | JWT           |
| DELETE | `/api/requests/:id`   | Eliminar solicitud                           | JWT           |

> **Nota:** Los agentes ven todas las solicitudes. Los clientes solo ven las asociadas a su cuenta.

**Crear solicitud** — `POST /api/requests`

```json
{
  "dni": "12345678-5",
  "passengerName": "Juan Pérez",
  "origin": "Santiago",
  "destination": "Buenos Aires",
  "tripType": "turismo",
  "linkedUserId": "uuid-del-cliente",
  "linkedUserName": "Nombre del Cliente",
  "departureDate": "2026-03-15T10:00:00",
  "returnDate": "2026-03-22T10:00:00",
  "status": "pendiente"
}
```

## Estructura del proyecto

```
backenda/
├── app.js                        # Entrada principal y configuración de Express
├── package.json
├── .env                          # Variables de entorno (no versionado)
├── nodemon.json
│
├── controllers/
│   ├── auth.controller.js        # Handlers de registro, login y clientes
│   └── request.controller.js     # CRUD de solicitudes de viaje
│
├── routes/
│   ├── auth.routes.js            # Rutas /api/auth
│   └── request.routes.js         # Rutas /api/requests
│
├── middleware/
│   ├── auth.js                   # Verificación de JWT (Bearer token)
│   └── validation.js             # Validación de RUT, email, password y solicitudes
│
├── services/
│   └── auth.service.js           # Lógica de negocio: auth local y OAuth GitHub
│
├── utils/
│   ├── jsonStorage.js            # Lectura/escritura asíncrona de JSON
│   └── sileStorage.js            # (Deprecado) Versión síncrona
│
└── data/
    ├── users.json                # Almacén de usuarios
    └── requests.json             # Almacén de solicitudes
```

## Modelos de datos

### Usuario

| Campo       | Tipo     | Descripción                          |
|-------------|----------|--------------------------------------|
| id          | string   | UUID v4                              |
| name        | string   | Nombre completo                      |
| email       | string   | Email (único)                        |
| password    | string   | Hash bcrypt (null en OAuth)          |
| role        | string   | `agent` o `client`                   |
| dni         | string   | RUT chileno formateado (XXXXXXX-X)   |
| createdAt   | string   | Fecha ISO 8601                       |
| githubId    | number   | ID de GitHub (solo OAuth)            |
| avatar      | string   | URL del avatar (solo OAuth)          |

### Solicitud de viaje

| Campo            | Tipo   | Descripción                              |
|------------------|--------|------------------------------------------|
| id               | string | ID numérico auto-incremental             |
| dni              | string | RUT del pasajero                         |
| passengerName    | string | Nombre del pasajero                      |
| origin           | string | Ciudad de origen                         |
| destination      | string | Ciudad de destino                        |
| tripType         | string | Tipo de viaje (ej: turismo)              |
| linkedUserId     | string | UUID del cliente asociado                |
| linkedUserName   | string | Nombre del cliente asociado              |
| departureDate    | string | Fecha de salida (ISO datetime)           |
| returnDate       | string | Fecha de retorno (ISO datetime)          |
| registrationDate | string | Fecha de creación (dd-mm-yyyy hh:mm:ss)  |
| status           | string | Estado: `pendiente`, `finalizado`, etc.  |

## Validaciones

| Campo    | Reglas                                                                 |
|----------|------------------------------------------------------------------------|
| RUT/DNI  | Formato chileno, verificado con algoritmo Módulo 11                    |
| Email    | Formato estándar RFC 5322                                              |
| Password | Mínimo 6 caracteres, al menos 1 mayúscula, 1 minúscula y 1 dígito    |

Las validaciones se ejecutan como middleware antes de llegar al controlador, retornando `400` con el detalle de errores si no se cumplen.

## Seguridad

- **Helmet** — Headers HTTP de seguridad
- **CORS** — Habilitado para peticiones cross-origin
- **bcrypt** — Hash de contraseñas (10 salt rounds)
- **JWT** — Tokens con expiración de 24 horas
- **Filtrado por rol** — Los clientes solo acceden a sus propios datos
- **Validación de entrada** — En todos los endpoints de escritura

## Autor

**LeaGuty**
