// Prevent error: Cannot set property fetch of #<Window> which has only a getter
try {
  let currentFetch = window.fetch;
  (window as any).__customFetch = currentFetch;

  const globalProxy = new Proxy(window, {
    set(target, prop, value) {
      if (prop === "fetch") {
        (window as any).__customFetch = value;
        currentFetch = value;
        return true;
      }
      return Reflect.set(target, prop, value);
    },
    get(target, prop) {
      if (prop === "fetch") {
        return (window as any).__customFetch || currentFetch;
      }
      if (prop === "global" || prop === "globalThis" || prop === "self") {
        return globalProxy;
      }
      const val = Reflect.get(target, prop);
      if (typeof val === "function") {
        return val.bind(target);
      }
      return val;
    },
  });

  // Define global proxy properties
  try {
    Object.defineProperty(window, "global", {
      configurable: true,
      enumerable: true,
      get() {
        return globalProxy;
      },
    });
  } catch (e) {}

  // Walk the entire prototype chain of window to find where fetch is declared
  // and redefine it as configurable and writable (with getter and setter)
  let proto = window;
  while (proto) {
    try {
      const desc = Object.getOwnPropertyDescriptor(proto, "fetch");
      if (desc && desc.configurable) {
        Object.defineProperty(proto, "fetch", {
          configurable: true,
          enumerable: true,
          get() {
            return (window as any).__customFetch || currentFetch;
          },
          set(val) {
            (window as any).__customFetch = val;
            currentFetch = val;
          },
        });
      }
    } catch (e) {
      // ignore individual prototype errors
    }
    proto = Object.getPrototypeOf(proto);
  }

  // Also make sure window.fetch itself is configurable/writable if possible
  try {
    const winDesc = Object.getOwnPropertyDescriptor(window, "fetch");
    if (!winDesc || winDesc.configurable) {
      Object.defineProperty(window, "fetch", {
        configurable: true,
        enumerable: true,
        get() {
          return (window as any).__customFetch || currentFetch;
        },
        set(val) {
          (window as any).__customFetch = val;
          currentFetch = val;
        },
      });
    }
  } catch (e2) {
    // ignore
  }

  // Also define global.fetch fallback if global exists
  if (typeof globalThis !== "undefined") {
    try {
      const globalDesc = Object.getOwnPropertyDescriptor(globalThis, "fetch");
      if (!globalDesc || globalDesc.configurable) {
        Object.defineProperty(globalThis, "fetch", {
          configurable: true,
          enumerable: true,
          get() {
            return (window as any).__customFetch || currentFetch;
          },
          set(val) {
            (window as any).__customFetch = val;
            currentFetch = val;
          },
        });
      }
    } catch (e3) {
      // ignore
    }
  }
} catch (e) {
  console.warn("General failure in fetch property patch:", e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
