/**
 * Sistema de compra VisuBloq - Links directos a PDFs
 * UX simplificada: PDF → Link → Copia automática → Compra
 */

class VisuBloqPurchaseSystem {
    constructor() {
        this.pdfLink = null;
        this.shopifyProductUrl = 'https://visubloq.com/products/visubloq-personalizado';
        this.serverUrl = 'https://2daf40fb9055.ngrok-free.app'; // TU URL NGROK
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

    showPurchaseModal() {
        // Verificar que no esté ya mostrado
        if (document.querySelector('.visubloq-purchase-modal')) {
            return;
        }

        const modal = this.createModal();
        document.body.appendChild(modal);
        
        // Guardar datos del diseño
        this.saveDesignData();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'visubloq-purchase-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">✅</div>
                <h2>¡Tu diseño está listo!</h2>
                <p>Se ha generado tu código de tracking personalizado:</p>
                
                <div class="tracking-code" id="tracking-display">
                    ${this.trackingCode}
                </div>
                
                <div class="instructions">
                    <strong>Para comprar tu diseño:</strong><br>
                    1. Haz clic en "COPIAR Y COMPRAR"<br>
                    2. Te llevaremos directamente al producto<br>
                    3. El código se copiará automáticamente<br>
                    4. Pégalo en el campo "Código VisuBloq" al pagar
                </div>
                
                <div class="copied-message" id="copied-msg">
                    ¡Código copiado! 📋
                </div>
                
                <div class="purchase-buttons">
                    <button class="btn-purchase btn-buy" onclick="visuBloqPurchase.copyAndBuy()">
                        � COPIAR Y COMPRAR AHORA
                    </button>
                    <button class="btn-purchase btn-later" onclick="visuBloqPurchase.saveLater()">
                        💾 GUARDAR PARA DESPUÉS
                    </button>
                </div>
                
                <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    Tu diseño se guardará temporalmente. Solo aparecerá en nuestro sistema después de la compra.
                </p>
            </div>
        `;
        
        return modal;
    }

    async copyAndBuy() {
        // Copiar código al clipboard
        try {
            await navigator.clipboard.writeText(this.trackingCode);
            this.showCopiedMessage();
        } catch (err) {
            // Fallback para navegadores antiguos
            this.fallbackCopy();
        }

        // Esperar un momento para que vea el mensaje
        setTimeout(() => {
            // Ir al producto en la MISMA pestaña
            window.location.href = this.shopifyProductUrl + '?visubloq_code=' + this.trackingCode;
        }, 1500);
    }

    showCopiedMessage() {
        const msg = document.getElementById('copied-msg');
        if (msg) {
            msg.classList.add('show');
            setTimeout(() => {
                msg.classList.remove('show');
            }, 2000);
        }
    }

    fallbackCopy() {
        // Crear input temporal para copiar
        const tempInput = document.createElement('input');
        tempInput.value = this.trackingCode;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        this.showCopiedMessage();
    }

    saveLater() {
        // Guardar en localStorage
        const savedDesigns = JSON.parse(localStorage.getItem('visubloq_saved_designs') || '[]');
        savedDesigns.push({
            tracking_code: this.trackingCode,
            created_at: new Date().toISOString(),
            design_data: this.extractCurrentDesignData()
        });
        localStorage.setItem('visubloq_saved_designs', JSON.stringify(savedDesigns.slice(-5))); // Solo últimos 5
        
        alert('💾 Diseño guardado. Tu código es: ' + this.trackingCode);
        this.closeModal();
    }

    closeModal() {
        const modal = document.querySelector('.visubloq-purchase-modal');
        if (modal) {
            modal.remove();
        }
    }

    extractCurrentDesignData() {
        // Extraer datos del diseño actual
        return {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100)
        };
    }

    async saveDesignData() {
        try {
            const designData = {
                tracking_code: this.trackingCode,
                design_data: this.extractCurrentDesignData(),
                created_at: new Date().toISOString(),
                status: 'generated' // No comprado aún
            };

            // Enviar al servidor si estamos en GitHub Pages
            if (window.location.hostname.includes('github.io')) {
                const serverUrl = 'https://583cbce200b9.ngrok-free.app'; // CAMBIAR POR TU URL
                
                const response = await fetch(`${serverUrl}/VisuBloq/app/backend/api/save-design-data.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(designData)
                });

                if (response.ok) {
                    console.log('✅ Diseño guardado en servidor');
                }
            }
        } catch (error) {
            console.error('Error guardando diseño:', error);
        }
    }

    injectModalCSS() {
        // Inyectar CSS si no existe
        if (!document.querySelector('#visubloq-purchase-css')) {
            const link = document.createElement('link');
            link.id = 'visubloq-purchase-css';
            link.rel = 'stylesheet';
            link.href = './css/purchase-modal.css'; // Ajustar ruta según necesidad
            document.head.appendChild(link);
        }
    }
}

// Inicializar sistema
let visuBloqPurchase;
document.addEventListener('DOMContentLoaded', function() {
    visuBloqPurchase = new VisuBloqPurchaseSystem();
});

// Función global para el modal
window.visuBloqPurchase = visuBloqPurchase;