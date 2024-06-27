// worker.js
self.onmessage = function (e) {
    const { type, data } = e.data;

    if (type === 'processChunk') {
        // Enviar cada chunk de respuesta de vuelta al hilo principal
        self.postMessage({ type: 'reply', data: data });
    } else if (type === 'complete') {
        // Señalar la finalización del procesamiento
        self.postMessage({ type: 'complete', data: "" });
    }
};
