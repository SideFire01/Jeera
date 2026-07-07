
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill for Touch Drag & Drop (Mobile Support)
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";


polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
    holdToDrag: 300, // Make it easier to pick up (default 500ms might be too long)
    dragImageCenterOnTouch: true
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
