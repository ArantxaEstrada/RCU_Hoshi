# Deploy a Render

## Configuración en Render Dashboard

### 1. Crear Web Service
- **Root Directory**: dejar vacío (usa la raíz del repositorio)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node 18+

### 2. Variables de Entorno
Agregar en la sección "Environment" de Render:

```
SUPABASE_URL=https://fsahqwpkawiytathuawb.supabase.co
SUPABASE_ANON=tu_token_anon_key_de_supabase
SESSION_SECRET=tu-clave-secreta-segura-para-produccion
PORT=3000
```

**Importante**:
- NO subir el archivo `.env` a GitHub (ya está en `.gitignore`)
- Cambiar `SESSION_SECRET` a algo único y seguro para producción

### 3. Monitoreo
- Health check disponible en: `https://tu-app.onrender.com/health`
- Devuelve: `{"status":"ok","timestamp":"..."}`

### 4. Deploy
Render hace deploy automático cuando haces push a la rama configurada (main o dev1).

Si necesitas deploy manual:
```powershell
git add .
git commit -m "Deploy to Render"
git push origin dev1
```

O usa "Manual Deploy" en el Dashboard de Render.

## Solución de Problemas

### Error: ENOENT FrontEnd/Views
- Verificar que las rutas en `server.js` usen `import.meta.url`
- Confirmar que `package.json` tenga `"type": "module"`

### Warning: MemoryStore
- Normal en desarrollo
- Para producción, usar Redis o connect-pg-simple con PostgreSQL

### Variables de entorno no cargan
- Configurarlas en Render Dashboard (no en archivo .env)
- Render no lee archivos .env, solo variables de entorno del sistema
