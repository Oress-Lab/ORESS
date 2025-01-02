// Help page content configuration
const helpContent = {
    'getting-started': {
        title: 'Getting Started Guide',
        content: `
            <h3>Basic Navigation</h3>
            <p>Learn how to navigate through the main features:</p>
            <ul>
                <li>Dashboard Overview</li>
                <li>Using the Search Function</li>
                <li>Managing Your Profile</li>
            </ul>

            <h3>Key Features</h3>
            <p>Get familiar with the essential tools:</p>
            <ul>
                <li>Course Selection</li>
                <li>Schedule Planning</li>
                <li>Saving Favorites</li>
            </ul>
        `
    },
    'advanced-features': {
        title: 'Advanced Features',
        content: `
            <h3>Power User Tools</h3>
            <p>Discover advanced features to enhance your experience:</p>
            <ul>
                <li>Custom Filters</li>
                <li>Batch Operations</li>
                <li>Advanced Search Techniques</li>
            </ul>

            <h3>Tips & Tricks</h3>
            <p>Learn expert tips to maximize efficiency:</p>
            <ul>
                <li>Keyboard Shortcuts</li>
                <li>Custom Views</li>
                <li>Time-saving Techniques</li>
            </ul>
        `
    },
    'support': {
        title: 'Support Center',
        content: `
            <h3>Need Help?</h3>
            <p>We're here to assist you:</p>
            <ul>
                <li>Email Support: support@example.com</li>
                <li>Phone Support: (555) 123-4567</li>
                <li>Live Chat: Available 9 AM - 5 PM</li>
            </ul>

            <h3>Additional Resources</h3>
            <p>Access more support options:</p>
            <ul>
                <li>Video Tutorials</li>
                <li>Documentation</li>
                <li>Community Forums</li>
            </ul>
        `
    }
};

// FAQ functionality
class FAQManager {
    constructor() {
        this.questions = document.querySelectorAll('.faq-question');
        this.init();
    }

    init() {
        this.questions.forEach(button => {
            button.addEventListener('click', () => this.toggleQuestion(button));
        });
    }

    toggleQuestion(button) {
        const answer = button.nextElementSibling;
        const toggle = button.querySelector('.faq-toggle');

        this.closeOtherQuestions(button);

        const isOpen = answer.classList.contains('active');
        answer.classList.toggle('active');
        toggle.textContent = isOpen ? '+' : '−';
    }

    closeOtherQuestions(currentButton) {
        this.questions.forEach(button => {
            if (button !== currentButton) {
                const answer = button.nextElementSibling;
                const toggle = button.querySelector('.faq-toggle');
                answer.classList.remove('active');
                toggle.textContent = '+';
            }
        });
    }
}

// Modal functionality
class ModalManager {
    constructor() {
        this.modal = document.getElementById('helpModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalContent = document.getElementById('modalContent');
        this.closeBtn = document.querySelector('.close-modal');
        this.serviceBoxes = document.querySelectorAll('.service-box');
        
        this.init();
    }

    init() {
        // Service box click handlers
        this.serviceBoxes.forEach(box => {
            box.addEventListener('click', () => this.openModal(box));
        });

        // Close button handler
        this.closeBtn.addEventListener('click', () => this.closeModal());

        // Outside click handler
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal(box) {
        const contentKey = box.dataset.content;
        const content = helpContent[contentKey];

        if (!content) {
            console.error(`Content not found for key: ${contentKey}`);
            return;
        }

        this.modalTitle.textContent = content.title;
        this.modalContent.innerHTML = content.content;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.add('fade-out');
        setTimeout(() => {
            this.modal.classList.remove('active', 'fade-out');
            document.body.style.overflow = '';
        }, 300);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize FAQ functionality
    new FAQManager();
    
    // Initialize Modal functionality
    new ModalManager();
});
