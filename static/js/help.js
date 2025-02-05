// Help page content configuration
const helpContent = {
    'getting-started': {
        title: 'Searching for Courses',
        content: `
            <h3>How to search for courses ?</h3>
            <ul>
                <li>Using the course code, ex: csc 212.</li>
                <li>Using the course name, ex: pro design data abstraction I</li>
            </ul>

            <h3>Learn to use the expert search.</h3>
            <ul>
                <li>Using '#' in the search with the weekdays will give the available courses on these days. ex: csc 212 #mwf</li>
                <li>Coming soon. searching with time. Using the '@' symbol, ex: csc 212 @10</li>
            </ul>

            <h3>Adding courses to different sections.</h3>
            <ul>
                <li>Using the checkbox in the course element, the course selected will be added to the precise time.</li>
                <li>Using the star, the courses will be added to the favorite section so you can add and remove with ease.</li>
            </ul> 
        `
    },
    'advanced-features': {
        title: 'The Timetable',
        content: `
            <h3>Course disposition</h3>
            <p>MWF or TTH courses are added respecting the session time.</p>
            <ul>
                <img src="/static/assets/help/image.png" 
                    alt="Course Schedule Example" 
                    class="help-image"
                    style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;">
            </ul>
        `
    },
    'support': {
        title: 'Helper Section',
        content: `
            <h3>Tools</h3>
            <ul>
                <li>Image Icon: You can download the timetable as an image.</li>
                <li>Settings Icon: Settings related to the timetable. Most of the features are coming soon.</li>
            </ul>

            <h3>Course Info section</h3>
            <p>Information related to a course</p>
            <ul>
                <li>Hover on a course in the search bar and all the needed information concerning the course will be displayed.</li>
            </ul>

            <h3>Favorite section</h3>
            <p>Store your soon to be courses</p>
            <ul>
                <li>Mentioned in the search section, pressing the star will add courses to this section. You can store as much as courses as you need to build your schedule.</li>
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