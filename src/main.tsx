import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { trackVisualViewport } from './services/visualViewport';

trackVisualViewport();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const scope = import.meta.env.BASE_URL;
    navigator.serviceWorker.register(`${scope}service-worker.js`, { scope }).then((registration) => {
      // A home screen app can remain open in the background for days.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => {});
        }
      });
    }).catch((error) => console.warn('オフライン用の準備ができませんでした。', error));
  });
}
