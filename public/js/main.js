/**
 * SEO Generator Client-Side JavaScript
 * Handles user interactions, form validation, and copy functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializeFeatherIcons();
    initializeFormValidation();
    initializeFileUpload();
    initializeCharacterCounters();
    initializeCopyButtons();
    initializeScrollToResults();
}

/**
 * Initialize Feather Icons
 */
function initializeFeatherIcons() {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

/**
 * Form validation and enhancement
 */
function initializeFormValidation() {
    const form = document.querySelector('.seo-form');
    if (!form) return;

    // Real-time validation
    const titleInput = document.getElementById('siteTitle');
    const descriptionTextarea = document.getElementById('siteDescription');

    if (titleInput) {
        titleInput.addEventListener('input', function() {
            validateTitle(this);
        });
    }

    if (descriptionTextarea) {
        descriptionTextarea.addEventListener('input', function() {
            validateDescription(this);
        });
    }

    // Form submission handling
    form.addEventListener('submit', function(e) {
        const isValid = validateForm();
        if (!isValid) {
            e.preventDefault();
        } else {
            showLoadingState();
        }
    });
}

function validateTitle(input) {
    const value = input.value;
    const length = value.length;
    const hint = input.parentNode.querySelector('.form-hint');
    
    if (length > 60) {
        input.style.borderColor = 'var(--warning-color)';
        hint.style.color = 'var(--warning-color)';
        hint.textContent = `${length}/60 characters - Consider shortening for better SEO`;
    } else if (length > 50) {
        input.style.borderColor = 'var(--accent-color)';
        hint.style.color = 'var(--accent-color)';
        hint.textContent = `${length}/60 characters - Good length for SEO`;
    } else {
        input.style.borderColor = 'var(--border-color)';
        hint.style.color = 'var(--text-muted)';
        hint.textContent = 'Recommended: 50-60 characters for optimal SEO';
    }
}

function validateDescription(textarea) {
    const value = textarea.value;
    const length = value.length;
    const hint = textarea.parentNode.querySelector('.form-hint');
    
    if (length > 160) {
        textarea.style.borderColor = 'var(--warning-color)';
        hint.style.color = 'var(--warning-color)';
        hint.textContent = `${length}/160 characters - May be truncated in search results`;
    } else if (length > 120) {
        textarea.style.borderColor = 'var(--accent-color)';
        hint.style.color = 'var(--accent-color)';
        hint.textContent = `${length}/160 characters - Perfect length for search snippets`;
    } else {
        textarea.style.borderColor = 'var(--border-color)';
        hint.style.color = 'var(--text-muted)';
        hint.textContent = 'Recommended: 120-160 characters for search engine snippets';
    }
}

function validateForm() {
    const titleInput = document.getElementById('siteTitle');
    const descriptionTextarea = document.getElementById('siteDescription');
    let isValid = true;

    // Title validation
    if (!titleInput.value.trim()) {
        showFieldError(titleInput, 'Site title is required');
        isValid = false;
    } else if (titleInput.value.length > 100) {
        showFieldError(titleInput, 'Title is too long (max 100 characters)');
        isValid = false;
    } else {
        clearFieldError(titleInput);
    }

    // Description validation
    if (!descriptionTextarea.value.trim()) {
        showFieldError(descriptionTextarea, 'Site description is required');
        isValid = false;
    } else if (descriptionTextarea.value.length > 300) {
        showFieldError(descriptionTextarea, 'Description is too long (max 300 characters)');
        isValid = false;
    } else {
        clearFieldError(descriptionTextarea);
    }

    return isValid;
}

function showFieldError(field, message) {
    field.style.borderColor = 'var(--error-color)';
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = 'var(--error-color)';
    errorDiv.style.fontSize = '0.75rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(field) {
    field.style.borderColor = 'var(--border-color)';
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * File upload handling
 */
function initializeFileUpload() {
    const fileInput = document.getElementById('siteIcon');
    const fileLabel = document.querySelector('.file-upload-label');
    const fileText = document.querySelector('.file-upload-text');

    if (!fileInput || !fileLabel || !fileText) return;

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            // Validate file
            const validationResult = validateFile(file);
            if (!validationResult.valid) {
                showFileError(validationResult.message);
                fileInput.value = '';
                return;
            }
            
            // Update UI
            fileText.textContent = file.name;
            fileLabel.style.borderColor = 'var(--accent-color)';
            fileLabel.style.backgroundColor = 'var(--secondary-color)';
            
            // Show file preview if it's an image
            showFilePreview(file);
            
            clearFileError();
        } else {
            resetFileUpload();
        }
    });

    // Drag and drop support
    fileLabel.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--primary-color)';
        this.style.backgroundColor = 'var(--secondary-color)';
    });

    fileLabel.addEventListener('dragleave', function(e) {
        e.preventDefault();
        if (!fileInput.files.length) {
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'transparent';
        }
    });

    fileLabel.addEventListener('drop', function(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
}

function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    
    if (file.size > maxSize) {
        return {
            valid: false,
            message: 'File size must be less than 5MB'
        };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            message: 'Only JPEG, PNG, and SVG files are allowed'
        };
    }
    
    return { valid: true };
}

function showFilePreview(file) {
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Remove existing preview
            const existingPreview = document.querySelector('.file-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
            
            // Create preview
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            preview.style.marginTop = '0.5rem';
            preview.style.textAlign = 'center';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.borderRadius = 'var(--radius-sm)';
            img.style.border = '1px solid var(--border-color)';
            
            preview.appendChild(img);
            
            const fileInput = document.getElementById('siteIcon');
            fileInput.parentNode.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }
}

function showFileError(message) {
    const fileInput = document.getElementById('siteIcon');
    const existingError = fileInput.parentNode.querySelector('.file-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'file-error';
    errorDiv.style.color = 'var(--error-color)';
    errorDiv.style.fontSize = '0.75rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    
    fileInput.parentNode.appendChild(errorDiv);
}

function clearFileError() {
    const errorDiv = document.querySelector('.file-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function resetFileUpload() {
    const fileText = document.querySelector('.file-upload-text');
    const fileLabel = document.querySelector('.file-upload-label');
    const preview = document.querySelector('.file-preview');
    
    if (fileText) fileText.textContent = 'Choose image file';
    if (fileLabel) {
        fileLabel.style.borderColor = 'var(--border-color)';
        fileLabel.style.backgroundColor = 'transparent';
    }
    if (preview) preview.remove();
}

/**
 * Character counters
 */
function initializeCharacterCounters() {
    const titleInput = document.getElementById('siteTitle');
    const descriptionTextarea = document.getElementById('siteDescription');
    
    if (titleInput) {
        addCharacterCounter(titleInput, 60);
    }
    
    if (descriptionTextarea) {
        addCharacterCounter(descriptionTextarea, 160);
    }
}

function addCharacterCounter(element, maxLength) {
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.style.fontSize = '0.75rem';
    counter.style.color = 'var(--text-muted)';
    counter.style.textAlign = 'right';
    counter.style.marginTop = '0.25rem';
    
    element.parentNode.appendChild(counter);
    
    const updateCounter = () => {
        const length = element.value.length;
        counter.textContent = `${length}/${maxLength}`;
        
        if (length > maxLength * 0.9) {
            counter.style.color = 'var(--warning-color)';
        } else if (length > maxLength * 0.8) {
            counter.style.color = 'var(--accent-color)';
        } else {
            counter.style.color = 'var(--text-muted)';
        }
    };
    
    element.addEventListener('input', updateCounter);
    updateCounter(); // Initial update
}

/**
 * Copy to clipboard functionality
 */
function initializeCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            copyToClipboard(targetId);
        });
    });
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.textContent;
    
    // Modern clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess();
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showCopyError();
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess() {
    showNotification('Copied to clipboard!', 'success');
}

function showCopyError() {
    showNotification('Failed to copy to clipboard', 'error');
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const colors = {
        success: 'var(--accent-color)',
        error: 'var(--error-color)',
        info: 'var(--primary-color)'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * Loading state for form submission
 */
function showLoadingState() {
    const submitButton = document.querySelector('.submit-button');
    if (!submitButton) return;
    
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="loading-spinner"></span>
        Generating Assets...
    `;
    
    // Add loading spinner styles
    if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            .loading-spinner {
                display: inline-block;
                width: 1rem;
                height: 1rem;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Scroll to results after generation
 */
function initializeScrollToResults() {
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection) {
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
}

/**
 * Utility function to handle smooth scrolling for older browsers
 */
function smoothScrollTo(element) {
    if (!element) return;
    
    if ('scrollBehavior' in document.documentElement.style) {
        element.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Fallback for older browsers
        element.scrollIntoView();
    }
}
