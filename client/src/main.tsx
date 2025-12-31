import { createRoot } from 'react-dom/client'
import './index.css'
import '@livekit/components-styles'
import App from './App.tsx'
import ReduxProvider from './components/ReduxProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <ReduxProvider>
      <App />
    </ReduxProvider>
)
