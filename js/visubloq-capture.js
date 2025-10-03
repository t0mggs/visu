/**
 * VisuBloq - Sistema de Captura Automática de PDFs
 * Este script se encarga de interceptar la generación de PDFs
 * y enviar automáticamente los datos al backend
 */

class VisuBloqPDFCapture {
    constructor() {
        this.apiEndpoint = 'backend/api/save-design-data.php';
        this.sessionId = this.generateSessionId();
        this.initializeCapture();
    }

    generateSessionId() {
        // Intentar obtener email del cliente desde Shopify si está disponible
        const customerEmail = window.Shopify?.customer?.email || 
                             window.ShopifyAnalytics?.meta?.page?.customerId || 
                             localStorage.getItem('customer_email') || '';
        
        const baseId = 'vb_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
        
        return customerEmail ? `${baseId}_${btoa(customerEmail)}` : baseId;
    }

    initializeCapture() {
        // Interceptar el botón de generar instrucciones
        const instructionsButton = document.getElementById('download-instructions-button');
        if (instructionsButton) {
            instructionsButton.addEventListener('click', (e) => {
                this.prepareDataCapture();
            });
        }

        // Interceptar cualquier generación de PDF
        this.interceptPDFGeneration();
    }

    prepareDataCapture() {
        // Mostrar overlay de carga
        this.showLoadingOverlay('🧱 Preparando datos para envío...');
        
        // Esperar un momento para que se genere el PDF y luego capturar datos
        setTimeout(() => {
            this.captureCurrentDesignData();
        }, 1000);
    }

    captureCurrentDesignData() {
        try {
            // Capturar datos del estado actual de la aplicación
            const designData = this.extractDesignData();
            
            if (designData && designData.piece_colors && Object.keys(designData.piece_colors).length > 0) {
                this.sendDataToBackend(designData);
            } else {
                console.warn('No se encontraron datos de piezas para enviar');
                this.hideLoadingOverlay();
            }
        } catch (error) {
            console.error('Error capturando datos de diseño:', error);
            this.hideLoadingOverlay();
        }
    }

    extractDesignData() {
        // Extraer datos de piezas de la tabla "Pieces Used"
        const piecesData = {};
        const piecesTable = document.querySelector('#studs-used-table-body');
        
        if (piecesTable) {
            const rows = piecesTable.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const colorName = cells[0].textContent.trim();
                    const count = parseInt(cells[cells.length - 1].textContent) || 0;
                    if (count > 0) {
                        piecesData[colorName] = count;
                    }
                }
            });
        }

        // Extraer configuración de VisuBloq
        const config = {
            width: this.getSliderValue('width-slider') || 50,
            height: this.getSliderValue('height-slider') || 50,
            resolution: `${this.getSliderValue('width-slider') || 50}x${this.getSliderValue('height-slider') || 50}`,
            saturation: this.getSliderValue('saturation-slider') || 0,
            brightness: this.getSliderValue('brightness-slider') || 0,
            contrast: this.getSliderValue('contrast-slider') || 0,
            timestamp: new Date().toISOString()
        };

        return {
            session_id: this.sessionId,
            piece_colors: piecesData,
            visubloq_config: config,
            total_pieces: Object.values(piecesData).reduce((sum, count) => sum + count, 0)
        };
    }

    getSliderValue(sliderId) {
        const slider = document.getElementById(sliderId);
        return slider ? parseInt(slider.value) : null;
    }

    async sendDataToBackend(data) {
        try {
            console.log('Enviando datos al backend:', data);
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Datos enviados correctamente:', result);
                this.showSuccessMessage('Datos guardados correctamente');
                
                // Guardar design_id en sessionStorage para futuras referencias
                if (result.design_id) {
                    sessionStorage.setItem('visubloq_design_id', result.design_id);
                }
            } else {
                console.error('❌ Error del servidor:', result.error);
                this.showErrorMessage('Error guardando datos: ' + result.error);
            }
        } catch (error) {
            console.error('❌ Error de red:', error);
            this.showErrorMessage('Error de conexión');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    interceptPDFGeneration() {
        // Interceptar cuando jsPDF se usa para generar PDFs
        if (window.jsPDF) {
            const originalSave = window.jsPDF.prototype.save;
            window.jsPDF.prototype.save = function(filename) {
                // Ejecutar la función original
                const result = originalSave.call(this, filename);
                
                // Capturar datos después de generar el PDF
                setTimeout(() => {
                    window.visubloqCapture?.captureCurrentDesignData();
                }, 500);
                
                return result;
            };
        }
    }

    showLoadingOverlay(message = '🧱 Procesando...') {
        const overlay = document.getElementById('lego-preview-loading-overlay');
        const messageEl = overlay?.querySelector('.lego-preview-message');
        if (overlay && messageEl) {
            messageEl.textContent = message;
            overlay.classList.add('show');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('lego-preview-loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showSuccessMessage(message) {
        // Crear notificación temporal
        this.showNotification(message, 'success');
    }

    showErrorMessage(message) {
        // Crear notificación temporal
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-family: 'Dortmund', Arial, sans-serif;
            font-weight: bold;
            z-index: 10000;
            transition: all 0.3s ease;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Método público para asociar con pedido de Shopify
    associateWithShopifyOrder(shopifyOrderId) {
        const designId = sessionStorage.getItem('visubloq_design_id');
        if (designId && shopifyOrderId) {
            // Actualizar el diseño con el ID del pedido
            fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    design_id: designId,
                    shopify_order_id: shopifyOrderId,
                    action: 'associate_order'
                })
            }).then(response => response.json())
              .then(result => {
                  if (result.success) {
                      console.log('✅ Diseño asociado con pedido:', shopifyOrderId);
                  }
              });
        }
    }
}

// Inicializar el sistema de captura cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined') {
        window.visubloqCapture = new VisuBloqPDFCapture();
        console.log('🚀 Sistema de captura VisuBloq inicializado');
    }
});

// Exportar para uso en otros scripts si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisuBloqPDFCapture;
}