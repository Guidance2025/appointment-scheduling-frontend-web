import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { PopUpModalProvider } from './helper/message/pop/up/provider/PopUpModalProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <PopUpModalProvider>
    <App />
   </PopUpModalProvider>
  </StrictMode>,
)
