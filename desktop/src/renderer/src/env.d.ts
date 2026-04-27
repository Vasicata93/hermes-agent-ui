/// <reference types="vite/client" />

interface Window {
  hermesAPI?: import('../preload/index').HermesAPI;
}
