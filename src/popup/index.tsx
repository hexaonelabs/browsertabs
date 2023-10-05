import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './Popup'
import '../theme/vendor';
import './index.css'
import { IonApp } from '@ionic/react';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

ReactDOM.createRoot(document.querySelector('app-root') as HTMLElement).render(
  <IonApp>
    <App />
  </IonApp>
)
