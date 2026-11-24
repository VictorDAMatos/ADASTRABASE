import { contextBridge, ipcRenderer } from 'electron' // <--- ADICIONADO: ipcRenderer
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // O NOSSO MOTOR DE DOBRA: Envia o pedido de download para o processo Principal
  downloadTrack: (query: string) => ipcRenderer.invoke('download-track', query)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api) // A nossa função fica exposta na window.api
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}