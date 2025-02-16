// Help page content configuration
const helpContent = {
    'getting-started': {
        title: 'Search & Course Management',
        content: `
            <div class="space-y-6">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h3 class="text-xl font-semibold mb-3">Course Search Features</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-700">
                        <li>Search by course code (e.g., <code class="bg-blue-100 px-2 py-1 rounded">CSC 212</code>)</li>
                        <li>Search by course name (e.g., <code class="bg-blue-100 px-2 py-1 rounded">Data Structures</code>)</li>
                        <li>Results update in real-time with detailed course information:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li>Course code and name</li>
                                <li>Class timings</li>
                                <li>Room location</li>
                                <li>Instructor information</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h3 class="text-xl font-semibold mb-3">Course Selection</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-700">
                        <li>Add courses to your timetable:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li>Use the checkbox next to each course</li>
                                <li>System automatically checks for time conflicts</li>
                                <li>Selected courses are saved automatically</li>
                            </ul>
                        </li>
                        <li>Manage favorite courses:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li>Click the star icon to add/remove from favorites</li>
                                <li>Access favorites anytime from the favorites list</li>
                                <li>Favorites persist across sessions</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h3 class="text-xl font-semibold mb-3">Advanced Search Tips</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-700">
                        <li>Use <code class="bg-blue-100 px-2 py-1 rounded">#</code> for day filtering:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li><code class="bg-blue-100 px-2 py-1 rounded">#mwf</code> - Monday, Wednesday, Friday classes</li>
                                <li><code class="bg-blue-100 px-2 py-1 rounded">#tth</code> - Tuesday, Thursday classes</li>
                            </ul>
                        </li>
                        <li>Hover over courses to preview their placement in the timetable</li>
                        <li>Course information is automatically updated when hovering on a course</li>
                    </ul>
                </div>
            </div>
        `
    },
    'advanced-features': {
        title: 'Course Management Features',
        content: `
            <div class="space-y-6">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h3 class="text-xl font-semibold mb-3">Automatic Timetable Management</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-700">
                        <li>Smart Conflict Detection:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li>System prevents adding courses with time conflicts</li>
                                <li>Visual feedback when conflicts are detected</li>
                                <li>Automatic validation of course selections</li>
                            </ul>
                        </li>
                        <li>Course Persistence:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li>Selected courses are saved automatically</li>
                                <li>Courses sync across devices when logged in</li>
                                <li>Easy removal of courses from timetable</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h3 class="text-xl font-semibold mb-3">Favorites System</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-700">
                        <li>Add courses to favorites for quick access</li>
                        <li>Organize potential courses before finalizing schedule</li>
                        <li>Easily transfer courses between favorites and timetable</li>
                        <li>Favorites are preserved across sessions</li>
                    </ul>
                </div>
            </div>
        `
    },
    'support': {
        title: 'Course Information & Tools',
        content: `
            <div class="space-y-6">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h3 class="text-xl font-semibold mb-3">Course Details</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-700">
                        <li>View comprehensive course information:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li>Course code and full name</li>
                                <li>Meeting times and locations</li>
                                <li>Instructor information</li>
                                <li>Prerequisites (when available)</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h3 class="text-xl font-semibold mb-3">Data Persistence</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-700">
                        <li>Automatic saving of:
                            <ul class="list-disc list-inside ml-6 mt-2">
                                <li>Selected courses</li>
                                <li>Favorite courses</li>
                                <li>Checkbox states</li>
                                <li>Star (favorite) states</li>
                            </ul>
                        </li>
                        <li>Data syncs when logged into your account</li>
                    </ul>
                </div>
            </div>
        `
    }
};

// FAQ Data
const faqData = [
    {
        question: "Will my progress be saved?",
        answer: "Yes. Your selected courses, favorites, and checkbox states are all saved when you log out."
    },
    {
        question: "How do I search for specific courses?",
        answer: "You can search using either the course code (e.g., CSC 212) or the course name. The search updates in real-time as you type."
    },
    {
        question: "Can I filter courses by day?",
        answer: "Yes! Use the '#' symbol followed by the days you want. For example, '#mwf' shows Monday, Wednesday, Friday courses, and '#tth' shows Tuesday, Thursday courses."
    },
    {
        question: "How do I save courses for later?",
        answer: "Click the star icon next to any course to add it to your favorites. You can access your favorite courses anytime from the favorites section."
    }
];

// FAQ Manager
class FAQManager {
    constructor() {
        this.faqContainer = document.getElementById('faq-container');
        this.init();
    }

    init() {
        if (!this.faqContainer) return;
        this.renderFAQs();
        this.setupEventListeners();
    }

    renderFAQs() {
        this.faqContainer.innerHTML = ''; // Clear existing content
        faqData.forEach((faq, index) => {
            const faqElement = this.createFAQElement(faq, index);
            this.faqContainer.appendChild(faqElement);
        });
    }

    createFAQElement(faq, index) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow-sm border border-gray-200 mb-4';
        div.innerHTML = `
            <button class="faq-question w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors flex justify-between items-center">
                <span class="font-medium text-gray-900">${faq.question}</span>
                <span class="faq-toggle ml-4 text-blue-600 text-xl font-medium">+</span>
            </button>
            <div class="faq-answer bg-gray-50 px-6 py-4 text-gray-600">
                ${faq.answer}
            </div>
        `;
        return div;
    }

    setupEventListeners() {
        this.faqContainer.querySelectorAll('.faq-question').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleQuestion(button);
            });
        });
    }

    toggleQuestion(button) {
        const answer = button.nextElementSibling;
        const toggle = button.querySelector('.faq-toggle');
        const isActive = answer.classList.contains('active');

        // Close other questions first
        this.closeOtherQuestions(button);

        // Toggle current question
        if (isActive) {
            this.closeQuestion(button);
        } else {
            this.openQuestion(button);
        }
    }

    openQuestion(button) {
        const answer = button.nextElementSibling;
        const toggle = button.querySelector('.faq-toggle');
        
        answer.classList.add('active');
        toggle.classList.add('active');
        button.classList.add('bg-gray-50');
    }

    closeQuestion(button) {
        const answer = button.nextElementSibling;
        const toggle = button.querySelector('.faq-toggle');
        
        answer.classList.remove('active');
        toggle.classList.remove('active');
        button.classList.remove('bg-gray-50');
    }

    closeOtherQuestions(currentButton) {
        this.faqContainer.querySelectorAll('.faq-question').forEach(button => {
            if (button !== currentButton) {
                this.closeQuestion(button);
            }
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load content sections
    Object.entries(helpContent).forEach(([key, section]) => {
        const contentElement = document.getElementById(`${key}-content`);
        if (contentElement) {
            contentElement.innerHTML = section.content;
        }
    });

    // Initialize FAQ manager
    new FAQManager();

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});