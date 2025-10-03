/**
 * Sistema de compra VisuBloq - Links directos a PDFs
 * UX simplificada: PDF → Link → Copia automática → Compra
 */

class VisuBloqPurchaseSystemNew {
    constructor() {
        this.pdfLink = null;
        this.shopifyProductUrl = 'https://visubloq.com/products/visubloq-personalizado';
        this.serverUrl = 'https://583cbce200b9.ngrok-free.app'; // Nueva URL de ngrok
        this.init();
    }

    init() {
        this.setupPDFInterception();
        this.injectModalCSS();
    }

    generatePDFLink() {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        const filename = `VB-${timestamp}-${random}.pdf`;
        return `${this.serverUrl}/pdfs/${filename}`;
    }

    setupPDFInterception() {
        // Interceptar el botón "Generate Instructions PDF"
        const instructionsBtn = document.querySelector('#download-instructions-btn') || 
                               document.querySelector('button[onclick*="downloadInstructions"]') ||
                               document.querySelector('button:contains("Generate Instructions PDF")');
        
        if (instructionsBtn) {
            instructionsBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Evitar descarga automática
                this.handlePDFGeneration();
            });
        }

        // Interceptar cualquier botón relacionado con PDF
        document.addEventListener('click', (e) => {
            const button = e.target;
            if (button.textContent.includes('Generate Instructions PDF') || 
                button.textContent.includes('Instrucciones')) {
                e.preventDefault();
                this.handlePDFGeneration();
            }
        });
    }

    async handlePDFGeneration() {
        try {
            // Generar link del PDF
            this.pdfLink = this.generatePDFLink();
            
            // Generar y guardar el PDF en el servidor
            await this.savePDFToServer();
            
            // Mostrar modal con preview y link
            this.showResultModal();
            
            // Auto-copiar el link
            this.autoCopyLink();
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Error generando el diseño. Inténtalo de nuevo.');
        }
    }

    showResultModal() {
        // Verificar que no esté ya mostrado
        if (document.querySelector('.visubloq-result-modal')) {
            return;
        }

        const modal = this.createResultModal();
        document.body.appendChild(modal);
        
        // Generar preview del diseño
        setTimeout(() => this.generatePreview(), 100);
    }

    createResultModal() {
        const modal = document.createElement('div');
        modal.className = 'visubloq-result-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">🎯</div>
                <h2>¡Tu diseño está listo!</h2>
                
                <!-- Preview del diseño -->
                <div class="design-preview">
                    <canvas id="preview-canvas" width="200" height="200"></canvas>
                    <p>Vista previa de tu diseño</p>
                </div>
                
                <!-- Instrucción principal -->
                <div class="copy-instruction">
                    <p><strong>📋 Link copiado automáticamente</strong></p>
                    <small>Pégalo en tu pedido para recibir este diseño</small>
                </div>
                
                <!-- Link minimalista -->
                <div class="link-container">
                    <input type="text" id="pdf-link-input" value="${this.pdfLink}" readonly>
                    <button class="copy-btn" onclick="visuBloqPurchaseNew.copyLink()">
                        📋 Copiar
                    </button>
                </div>
                
                <!-- Mensaje de copiado -->
                <div class="copied-message" id="copied-msg">
                    ✅ ¡Link copiado al portapapeles!
                </div>
                
                <!-- Botones principales -->
                <div class="action-buttons">
                    <button class="edit-btn" onclick="visuBloqPurchaseNew.editDesign()">
                        ✏️ EDITAR
                    </button>
                    <button class="build-btn" onclick="visuBloqPurchaseNew.buildNow()">
                        🔧 CONSTRUIR
                    </button>
                </div>
                
                <p class="help-text">
                    El botón CONSTRUIR te llevará al producto donde podrás pegar el link
                </p>
            </div>
        `;
        
        return modal;
    }

    generatePreview() {
        const canvas = document.getElementById('preview-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 200, 200);
        
        // Simular un diseño LEGO básico
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff8800'];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;
                ctx.fillRect(i * 20, j * 20, 18, 18);
                
                // Simular "studs" de LEGO
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(i * 20 + 9, j * 20 + 9, 6, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // Texto overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = '12px Arial';
        ctx.fillText('VisuBloq Design', 10, 190);
    }

    async autoCopyLink() {
        try {
            await navigator.clipboard.writeText(this.pdfLink);
            this.showCopiedMessage();
        } catch (err) {
            // Auto-copy falló, usuario puede hacerlo manual
            console.log('Auto-copy falló, pero el botón está disponible');
        }
    }

    async copyLink() {
        try {
            await navigator.clipboard.writeText(this.pdfLink);
            this.showCopiedMessage();
        } catch (err) {
            // Fallback para navegadores antiguos
            this.fallbackCopy();
        }
    }

    showCopiedMessage() {
        const msg = document.getElementById('copied-msg');
        if (msg) {
            msg.classList.add('show');
            setTimeout(() => {
                msg.classList.remove('show');
            }, 3000);
        }
    }

    fallbackCopy() {
        const input = document.getElementById('pdf-link-input');
        if (input) {
            input.select();
            document.execCommand('copy');
            this.showCopiedMessage();
        }
    }

    editDesign() {
        // Cerrar modal y permitir editar
        this.closeModal();
        // Opcional: scroll hacia arriba o focus en controles
        window.scrollTo(0, 0);
    }

    buildNow() {
        // Ir directamente al producto de Shopify
        window.open(this.shopifyProductUrl, '_blank');
        // Mantener la página actual abierta para posibles ediciones
    }

    closeModal() {
        const modal = document.querySelector('.visubloq-result-modal');
        if (modal) {
            modal.remove();
        }
    }

    async savePDFToServer() {
        try {
            // Obtener datos del diseño actual (esto debe adaptarse a tu implementación)
            const designData = this.extractCurrentDesignData();
            
            // Enviar al servidor para generar y guardar PDF
            const response = await fetch(`${this.serverUrl}/VisuBloq/app/backend/api/save-pdf.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pdf_link: this.pdfLink,
                    design_data: designData,
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Error guardando PDF en servidor');
            }

            const result = await response.json();
            console.log('✅ PDF guardado:', result);
            
        } catch (error) {
            console.error('Error guardando PDF:', error);
            // Continuar aunque falle el guardado
        }
    }

    extractCurrentDesignData() {
        // Extraer datos del diseño actual
        // Esto debe adaptarse según tu implementación específica
        return {
            timestamp: Date.now(),
            url: window.location.href,
            // Añadir más datos específicos del diseño aquí
            canvas_data: this.getCanvasData(),
            settings: this.getCurrentSettings()
        };
    }

    getCanvasData() {
        // Intentar obtener datos del canvas principal
        const canvas = document.querySelector('#canvas') || 
                      document.querySelector('canvas') ||
                      document.querySelector('.main-canvas');
        
        if (canvas) {
            return canvas.toDataURL();
        }
        return null;
    }

    getCurrentSettings() {
        // Extraer configuraciones actuales
        return {
            palette: window.currentPalette || null,
            dimensions: window.canvasDimensions || null,
            // Añadir más configuraciones según necesidades
        };
    }

    injectModalCSS() {
        // CSS inline para el modal
        if (!document.querySelector('#visubloq-result-css')) {
            const style = document.createElement('style');
            style.id = 'visubloq-result-css';
            style.textContent = `
                .visubloq-result-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .visubloq-result-modal .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                
                .success-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .design-preview canvas {
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    margin: 1rem 0 0.5rem 0;
                }
                
                .copy-instruction {
                    background: #e8f5e8;
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                }
                
                .link-container {
                    display: flex;
                    gap: 0.5rem;
                    margin: 1rem 0;
                }
                
                .link-container input {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    background: #f9f9f9;
                }
                
                .copy-btn {
                    padding: 0.75rem 1rem;
                    background: #007cba;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                
                .copy-btn:hover {
                    background: #005a87;
                }
                
                .copied-message {
                    opacity: 0;
                    transition: opacity 0.3s;
                    color: #28a745;
                    font-weight: bold;
                    margin: 0.5rem 0;
                }
                
                .copied-message.show {
                    opacity: 1;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    margin: 1.5rem 0;
                }
                
                .edit-btn, .build-btn {
                    flex: 1;
                    padding: 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .edit-btn {
                    background: #6c757d;
                    color: white;
                }
                
                .build-btn {
                    background: #28a745;
                    color: white;
                }
                
                .edit-btn:hover, .build-btn:hover {
                    transform: translateY(-2px);
                }
                
                .help-text {
                    font-size: 0.85rem;
                    color: #666;
                    margin-top: 1rem;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Inicializar sistema
let visuBloqPurchaseNew;
document.addEventListener('DOMContentLoaded', function() {
    visuBloqPurchaseNew = new VisuBloqPurchaseSystemNew();
});

// Función global para el modal
window.visuBloqPurchaseNew = visuBloqPurchaseNew;