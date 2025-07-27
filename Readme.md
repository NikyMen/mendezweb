# Repuestos Mendez

Aplicación web para gestión de usuarios con Express.js.

## Configuración para Vercel

Este proyecto está configurado para ser desplegado en Vercel. Se han realizado las siguientes modificaciones para asegurar su correcto funcionamiento en un entorno serverless:

1. Creación de archivo `vercel.json` para configurar el despliegue
2. Estructura de carpetas adaptada para serverless con `/api`
3. Exportación de la aplicación Express como módulo
4. Configuración de rutas absolutas para archivos

## Instrucciones para desplegar en Vercel

1. Asegúrate de tener una cuenta en [Vercel](https://vercel.com)
2. Conecta tu repositorio de GitHub, GitLab o Bitbucket
3. Importa este proyecto
4. Vercel detectará automáticamente la configuración
5. Haz clic en "Deploy"

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Estructura del proyecto

- `/api`: Punto de entrada para Vercel
- `/db`: Almacenamiento local de datos
- `/views`: Plantillas EJS
- `index.js`: Aplicación Express principal
- `user-repository.js`: Lógica de gestión de usuarios
- `config.js`: Configuración de la aplicación
- `vercel.json`: Configuración para despliegue en Vercel