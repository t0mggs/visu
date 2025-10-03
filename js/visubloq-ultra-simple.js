/**
 * VisuBloq Ultra Simple - 100% Frontend, Sin Backend
 * PDF generado en navegador + Blob URL + Auto-copy
 * Enlace aparece SOLO cuando se carga la imagen final
 */

class VisuBloqUltraSimple {
    constructor() {
        this.shopifyProductUrl = 'https://visubloq.com/products/visubloq-personalizado';
        this.currentPdfBlob = null;
        this.currentPdfUrl = null;
        this.linkBarVisible = false;
        this.init();
    }

    init() {
        this.setupPDFInterception();
        this.setupImageCompletionListener();
        this.injectModalCSS();
        this.injectLinkBarCSS();
    }

    setupPDFInterception() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.interceptPDFButton());
        } else {
            this.interceptPDFButton();
        }
    }

    setupImageCompletionListener() {
        // Interceptar enableInteraction para detectar cuando se completa la imagen
        if (typeof window.enableInteraction === 'function') {
            const originalEnableInteraction = window.enableInteraction;
            window.enableInteraction = () => {
                originalEnableInteraction();
                this.onImageCompleted();
            };
        } else {
            // Si aún no existe, intentar más tarde
            setTimeout(() => this.setupImageCompletionListener(), 500);
        }
    }

    onImageCompleted() {
        // Solo mostrar si hay una imagen procesada (step4Canvas tiene contenido)
        const step4Canvas = document.getElementById('step-4-canvas');
        if (step4Canvas && step4Canvas.width > 0 && step4Canvas.height > 0) {
            console.log('🧱 VisuBloq: Imagen completada, mostrando enlace PDF');
            this.showPDFLinkBar();
        }
    }

    showPDFLinkBar() {
        if (this.linkBarVisible) return; // Ya está visible
        
        this.linkBarVisible = true;
        
        // Crear la barra de enlace PDF
        const linkBar = document.createElement('div');
        linkBar.id = 'visubloq-pdf-link-bar';
        linkBar.innerHTML = `
            <div class="pdf-link-content">
                <div class="pdf-link-icon">🧱</div>
                <div class="pdf-link-text">
                    <strong>PDF Generado</strong>
                    <span>Copia este enlace para el checkout</span>
                </div>
                <div class="pdf-link-actions">
                    <button id="copy-pdf-link-btn" class="copy-btn">📋 Copiar Enlace</button>
                    <button id="close-pdf-bar-btn" class="close-btn">✕</button>
                </div>
            </div>
            <div class="pdf-link-url" id="pdf-link-display">
                Generando enlace PDF...
            </div>
        `;
        
        // Insertar al final del body
        document.body.appendChild(linkBar);
        
        // Generar el PDF y actualizar el enlace
        this.generatePDFLink().then(url => {
            document.getElementById('pdf-link-display').textContent = url;
            this.currentPdfUrl = url;
        });
        
        // Eventos
        document.getElementById('copy-pdf-link-btn').addEventListener('click', () => {
            if (this.currentPdfUrl) {
                this.copyToClipboard(this.currentPdfUrl);
            }
        });
        
        document.getElementById('close-pdf-bar-btn').addEventListener('click', () => {
            this.hidePDFLinkBar();
        });
        
        // Auto-ocultar después de 30 segundos
        setTimeout(() => {
            if (this.linkBarVisible) {
                this.hidePDFLinkBar();
            }
        }, 30000);
    }

    hidePDFLinkBar() {
        const linkBar = document.getElementById('visubloq-pdf-link-bar');
        if (linkBar) {
            linkBar.style.animation = 'slideUp 0.3s ease-in forwards';
            setTimeout(() => {
                linkBar.remove();
                this.linkBarVisible = false;
            }, 300);
        }
    }

    async generatePDFLink() {
        try {
            console.log('🧱 Generando PDF para enlace...');
            
            // Usar step4Canvas que contiene la imagen final
            const step4Canvas = document.getElementById('step-4-canvas');
            if (step4Canvas && step4Canvas.width > 0) {
                return new Promise((resolve) => {
                    step4Canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        this.currentPdfBlob = blob;
                        resolve(url);
                    }, 'image/png', 0.95);
                });
            }
            
            return 'Error: No se pudo generar el PDF';
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            return 'Error generando PDF';
        }
    }

    interceptPDFButton() {
        // Buscar el botón de generar PDF
        const pdfButton = document.getElementById('download-instructions-button');
        if (!pdfButton) {
            // Reintentar en 1 segundo si no se encuentra
            setTimeout(() => this.interceptPDFButton(), 1000);
            return;
        }

        console.log('🧱 VisuBloq Ultra Simple: Botón PDF encontrado');

        // Interceptar el click para mostrar modal tradicional
        pdfButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handlePDFGeneration();
        });
    }

    async handlePDFGeneration() {
        console.log('🧱 Iniciando generación PDF tradicional...');
        
        try {
            this.showLoadingOverlay();
            
            // Generar PDF blob
            const pdfBlob = await this.generatePDFBlob();
            if (!pdfBlob) {
                throw new Error('No se pudo generar el PDF');
            }
            
            // Crear URL del blob
            const pdfUrl = URL.createObjectURL(pdfBlob);
            this.currentPdfBlob = pdfBlob;
            this.currentPdfUrl = pdfUrl;
            
            // Mostrar modal con el PDF
            this.showPDFModal(pdfUrl);
            
        } catch (error) {
            console.error('Error en generación PDF:', error);
            alert('Error generando PDF. Por favor, intenta de nuevo.');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    async generatePDFBlob() {
        try {
            // Usar step4Canvas como base para el PDF
            const step4Canvas = document.getElementById('step-4-canvas');
            if (!step4Canvas || step4Canvas.width === 0) {
                throw new Error('Canvas no disponible');
            }

            return new Promise((resolve, reject) => {
                step4Canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('No se pudo crear blob del canvas'));
                    }
                }, 'image/png', 0.95);
            });
            
        } catch (error) {
            console.error('Error generando blob PDF:', error);
            return null;
        }
    }

    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess();
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess();
        } catch (err) {
            alert('No se pudo copiar automáticamente. Por favor, copia manualmente el enlace.');
        }
        
        document.body.removeChild(textArea);
    }

    showCopySuccess() {
        // Cambiar temporalmente el texto del botón
        const copyBtn = document.getElementById('copy-pdf-link-btn');
        if (copyBtn) {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ ¡Copiado!';
            copyBtn.style.background = '#28a745';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
            }, 2000);
        }
    }

    showPDFModal(pdfUrl) {
        // Crear modal
        const modal = document.createElement('div');
        modal.id = 'visubloq-pdf-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🧱 VisuBloq PDF Generado</h3>
                    <button class="close-btn" onclick="this.closest('#visubloq-pdf-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="success-message">
                        <div class="success-icon">✅</div>
                        <div class="success-text">
                            <h4>¡PDF Generado Exitosamente!</h4>
                            <p>Tu enlace PDF está listo. Cópialo para usarlo en Shopify checkout.</p>
                        </div>
                    </div>
                    
                    <div class="pdf-preview">
                        <h5>Vista Previa:</h5>
                        <div class="preview-container">
                            <canvas id="pdf-preview-canvas"></canvas>
                        </div>
                    </div>
                    
                    <div class="pdf-link-section">
                        <label>🔗 Enlace PDF:</label>
                        <div class="link-container">
                            <input type="text" id="pdf-link-input" value="${pdfUrl}" readonly>
                            <button class="copy-button" onclick="visuBloqUltraSimple.copyLink()">📋 Copiar</button>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <a href="${pdfUrl}" download="visubloq-instructions.png" class="download-btn">
                            📥 Descargar PDF
                        </a>
                        <a href="${this.shopifyProductUrl}" target="_blank" class="shopify-btn">
                            🛒 Ir a Shopify
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Generar preview del PDF
        setTimeout(() => this.generatePreview(), 100);
        
        // Cerrar con escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    generatePreview() {
        const canvas = document.getElementById('pdf-preview-canvas');
        const step4Canvas = document.getElementById('step-4-canvas');
        
        if (canvas && step4Canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = (300 * step4Canvas.height) / step4Canvas.width;
            
            ctx.drawImage(step4Canvas, 0, 0, canvas.width, canvas.height);
        }
    }

    copyLink() {
        const input = document.getElementById('pdf-link-input');
        if (input) {
            input.select();
            input.setSelectionRange(0, 99999);
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(input.value).then(() => {
                    this.showCopyNotification();
                });
            } else {
                document.execCommand('copy');
                this.showCopyNotification();
            }
        }
    }

    showCopyNotification() {
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = '✅ Enlace copiado al portapapeles!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'visubloq-loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <h3>Generando tu PDF VisuBloq...</h3>
                <p>Esto puede tomar unos segundos</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('visubloq-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    injectLinkBarCSS() {
        const style = document.createElement('style');
        style.textContent = `
            #visubloq-pdf-link-bar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
                z-index: 10000;
                max-width: 90vw;
                animation: slideDown 0.3s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .pdf-link-content {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 10px;
            }
            
            .pdf-link-icon {
                font-size: 24px;
                background: rgba(255,255,255,0.2);
                padding: 8px;
                border-radius: 50%;
            }
            
            .pdf-link-text {
                flex: 1;
            }
            
            .pdf-link-text strong {
                display: block;
                font-size: 16px;
                margin-bottom: 2px;
            }
            
            .pdf-link-text span {
                font-size: 12px;
                opacity: 0.9;
            }
            
            .pdf-link-actions {
                display: flex;
                gap: 8px;
            }
            
            .copy-btn, .close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.2s;
            }
            
            .copy-btn:hover, .close-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .pdf-link-url {
                background: rgba(255,255,255,0.1);
                padding: 8px 12px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 11px;
                word-break: break-all;
                max-height: 60px;
                overflow-y: auto;
            }
            
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateX(-50%) translateY(0); opacity: 1; }
                to { transform: translateX(-50%) translateY(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    injectModalCSS() {
        const style = document.createElement('style');
        style.textContent = `
            #visubloq-pdf-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            }
            
            .modal-content {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid #eee;
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                border-radius: 16px 16px 0 0;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 1.4em;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .modal-body {
                padding: 25px;
            }
            
            .success-message {
                display: flex;
                align-items: center;
                gap: 15px;
                background: #d4edda;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid #c3e6cb;
            }
            
            .success-icon {
                font-size: 24px;
            }
            
            .success-text h4 {
                margin: 0 0 5px 0;
                color: #155724;
                font-size: 1.1em;
            }
            
            .success-text p {
                margin: 0;
                color: #155724;
                font-size: 0.9em;
            }
            
            .pdf-preview {
                margin-bottom: 20px;
            }
            
            .pdf-preview h5 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 1em;
            }
            
            .preview-container {
                border: 2px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                background: #f8f9fa;
            }
            
            #pdf-preview-canvas {
                max-width: 100%;
                height: auto;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .pdf-link-section {
                margin-bottom: 20px;
            }
            
            .pdf-link-section label {
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: #333;
            }
            
            .link-container {
                display: flex;
                gap: 10px;
            }
            
            #pdf-link-input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-family: monospace;
                font-size: 12px;
                background: #f8f9fa;
            }
            
            .copy-button {
                padding: 10px 15px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.2s;
            }
            
            .copy-button:hover {
                background: #218838;
            }
            
            .action-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .download-btn, .shopify-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .download-btn {
                background: linear-gradient(135deg, #17a2b8, #138496);
                color: white;
            }
            
            .shopify-btn {
                background: linear-gradient(135deg, #ff6b35, #e55a2b);
                color: white;
            }
            
            .download-btn:hover, .shopify-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                text-decoration: none;
                color: white;
            }
            
            .copy-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10002;
                animation: slideInRight 0.3s ease-out;
                font-weight: bold;
            }
            
            #visubloq-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10003;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .loading-content {
                background: white;
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px auto;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from { transform: scale(0.8) translateY(-20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar automáticamente
window.visuBloqUltraSimple = new VisuBloqUltraSimple();
console.log('🧱 VisuBloq Ultra Simple inicializado');