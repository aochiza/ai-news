import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Разрешает доступ извне контейнера
    port: 5173,      // Порт, на котором будет работать Vite внутри контейнера
    strictPort: true,// Не позволит Vite использовать другой порт, если 5173 занят
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true,
  }
});