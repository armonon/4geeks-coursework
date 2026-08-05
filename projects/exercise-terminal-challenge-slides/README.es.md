Este proyecto consiste en **slides interactivos** para aprender sobre la línea de comandos.

## 🚀 Instalación, Construcción y Despliegue de los Slides

Para trabajar con este proyecto, sigue los pasos a continuación.

### 1️. Instalar dependencias

Antes de ejecutar cualquier proceso, instala las dependencias necesarias:

```bash
npm install
```
Esto descargará todos los paquetes requeridos para visualizar y modificar los slides correctamente.

### 2️. Construir los slides
Para generar la versión optimizada de los slides para producción, ejecuta:

```bash
npm run build
```

Esto creará una carpeta dist/ con los archivos necesarios para visualizar los slides en un navegador.

Si `dist/` no se genera correctamente, revisa los logs de la terminal y asegúrate de que webpack.config.js esté configurado correctamente.

### 3. Ejecutar en modo desarrollo

Si deseas visualizar los slides localmente antes de desplegarlos, usa:

```bash
npm run start
```

Esto iniciará un servidor local que te permitirá ver los slides en el navegador.

### 4️. Desplegar los slides en GitHub Pages

Para publicar los slides en **GitHub Pages**, ejecuta:

```bash
npm run deploy
```

