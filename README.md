# Software Felipe · Frontend de Gestión de Obras

React/TypeScript servido por Nginx. Código de origen: `NebyX1/software-gestion-obras`, commit `5293894`. Backend complementario: [software-felipe-backend](https://github.com/NebyX1/software-felipe-backend).

## Desplegar en Coolify

1. Desplegar primero el backend y verificar que `/api/health/ready` responda HTTP 200.
2. Crear una aplicación desde este repositorio, rama **main**, tipo **Dockerfile**, directorio base `/`, archivo **`/Dockerfile`**. También se incluye `compose.coolify.yaml` para usar Docker Compose.
3. Configurar **`BACKEND_URL=https://api-obras.tudominio.com` como variable de ejecución**. Usar el origen completo del backend, sin `/api`, rutas, credenciales ni parámetros. Su certificado HTTPS debe ser válido.
4. Asignar `https://obras.tudominio.com`, puerto interno **80**, y desplegar.
5. En el backend configurar `FRONTEND_URL=https://obras.tudominio.com`.
6. Abrir el frontend y usar el código privado y una cuenta sintética de la demo.

Nginx envía `/api/`, `/admin` y `/static/` al backend. El navegador opera desde el mismo origen; no requiere exponer secretos ni depender de nombres de contenedor entre proyectos. Nginx admite tanto un backend HTTPS público como un nombre HTTP interno si ambos despliegues comparten una red Docker.

`BACKEND_URL` puede cambiarse con un nuevo despliegue sin recompilar JavaScript. La configuración se valida al iniciar el contenedor; se verifica el certificado TLS del backend. El healthcheck del frontend usa **`/health`**, independiente del estado o reinicio del backend. La salud completa se comprueba en `/api/health/ready`.

## Variables

| Variable | Momento | Valor |
| --- | --- | --- |
| `BACKEND_URL` | Ejecución | Origen del backend. Obligatorio en Coolify para despliegues separados. |
| `VITE_API_URL` | Compilación, opcional | Dejar vacío para el proxy `/api`. Si se requiere acceso directo, admite `https://api.example.com` o `https://api.example.com/api`; configurar CORS en backend. |

No poner claves privadas en variables `VITE_*`. El frontend no necesita volúmenes persistentes. Se preservan las rutas React al recargar y se sirve correctamente el worker PDF `.mjs`.

## Verificación y desarrollo

Requisitos: Node 22.13+.

```sh
npm ci
npm run lint
npm run build
docker build -t software-felipe-frontend .
docker run --rm -p 127.0.0.1:18088:80 -e BACKEND_URL=https://api-obras.tudominio.com software-felipe-frontend
```

Para desarrollo, `npm run dev` usa el puerto 5178 y un backend local en 5008. Pruebas de navegador: instalar Chromium (`npx playwright install chromium`), definir `E2E_URL` con la URL del despliegue de prueba y ejecutar `npm run test:e2e`. Si la demo requiere código privado, definir también `E2E_DEMO_ACCESS_CODE`. Las pruebas crean exclusivamente registros sintéticos en el stack seleccionado.

## Funcionalidades

Panel de obras, documentación, contratos, certificaciones, seguimiento, portal de empresas y pagos ficticios DemoPay. La IA permanece opcional y se configura exclusivamente en el backend. Esta es una demo institucional; no conecta una pasarela bancaria real.

## Verificación de entrega

[Resultados de construcción, pruebas y persistencia](VERIFICACION.md).
