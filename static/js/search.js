document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const favoritesList = document.getElementById('favorites');
    const courseInfo = document.getElementById('courseInfo');

    // Store favorites and selected courses
    const favorites = new Set();
    const selectedCourses = new Set();

    function createCourseElement(course, isFavorite = false, isSelected = false) {
        const courseElement = document.createElement('div');
        courseElement.className = 'p-2 border rounded hover:bg-gray-50 text-sm flex items-center gap-2';
        courseElement.dataset.courseCode = course.course_code;
        courseElement.dataset.courseTime = course.time;
        courseElement.dataset.courseKey = `${course.course_code}_${course.time}`;
        courseElement.dataset.courseName = course.course_name;
        courseElement.dataset.courseRoom = course.room || '';
        courseElement.dataset.courseInstructor = course.instructor || '';
        courseElement.dataset.courseSection = course.section || '';

        // Add mouse events for course shadow and info
        courseElement.addEventListener('mouseenter', () => {
            window.timetableModule.showCourseShadow(courseElement);
        });
        courseElement.addEventListener('mouseleave', () => {
            window.timetableModule.removeCourseShadow();
            // Clear course info when mouse leaves
            const courseInfo = document.getElementById('courseInfo');
            if (courseInfo) {
                courseInfo.innerHTML = 'Click on a course to see the details.';
            }
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-checkbox h-4 w-4 text-blue-600 rounded';
        checkbox.checked = isSelected;

        checkbox.addEventListener('change', function() {
            const courseKey = courseElement.dataset.courseKey;
            const courseCode = courseElement.dataset.courseCode;
            const courseTime = courseElement.dataset.courseTime;
            
            if (this.checked) {
                // Try to add the course to timetable
                const success = window.timetableModule.addCourseToTimetable(courseElement);
                if (!success) {
                    // If adding fails (e.g., due to overlap), uncheck the checkbox
                    this.checked = false;
                } else {
                    selectedCourses.add(courseKey);
                    // Add to favorites automatically when adding to timetable
                    if (!favorites.has(courseKey)) {
                        const course = {
                            course_code: courseCode,
                            course_name: courseElement.getAttribute('data-course-name'),
                            time: courseTime,
                            room: courseElement.getAttribute('data-course-room'),
                            instructor: courseElement.getAttribute('data-course-instructor'),
                            section: courseElement.getAttribute('data-course-section')
                        };
                        toggleFavorite(course);
                    }
                    // Update checkbox state in favorites if exists
                    const favoriteElement = favoritesList.querySelector(`[data-course-key="${courseKey}"]`);
                    if (favoriteElement) {
                        favoriteElement.querySelector('input[type="checkbox"]').checked = true;
                        const starButton = favoriteElement.querySelector('button');
                        starButton.className = 'text-yellow-400 hover:text-yellow-500 focus:outline-none';
                    }
                }
            } else {
                // Remove course from timetable with specific time
                window.timetableModule.removeCourseFromTimetable(courseCode, courseTime);
                selectedCourses.delete(courseKey);
                // Update checkbox state in favorites if exists
                const favoriteElement = favoritesList.querySelector(`[data-course-key="${courseKey}"]`);
                if (favoriteElement) {
                    favoriteElement.querySelector('input[type="checkbox"]').checked = false;
                }
            }
        });

        const starButton = document.createElement('button');
        starButton.className = `text-${isFavorite ? 'yellow' : 'gray'}-400 hover:text-yellow-500 focus:outline-none`;
        starButton.innerHTML = `<i class="fas fa-star"></i>`;
        starButton.addEventListener('click', () => toggleFavorite(course));

        const courseInfoElement = document.createElement('div');
        courseInfoElement.className = 'flex-1';
        courseInfoElement.innerHTML = `
            <div class="font-medium">${course.course_code}</div>
            <div class="text-gray-600">${course.course_name}</div>
            <div class="text-gray-500 text-xs">${course.time}</div>
        `;

        courseElement.appendChild(checkbox);
        courseElement.appendChild(starButton);
        courseElement.appendChild(courseInfoElement);

        return courseElement;
    }

    function toggleFavorite(course) {
        const courseKey = `${course.course_code}_${course.time}`;
        const isFavorite = favorites.has(courseKey);

        if (isFavorite) {
            favorites.delete(courseKey);
            const favoriteElement = favoritesList.querySelector(`[data-course-key="${courseKey}"]`);
            if (favoriteElement) {
                favoriteElement.remove();
            }
        } else {
            favorites.add(courseKey);
            const favoriteElement = createCourseElement(course, true, selectedCourses.has(courseKey));
            favoritesList.appendChild(favoriteElement);
        }

        // Update stars in search results
        document.querySelectorAll(`[data-course-key="${courseKey}"] button`)
            .forEach(button => {
                button.className = `text-${!isFavorite ? 'yellow' : 'gray'}-400 hover:text-yellow-500 focus:outline-none`;
            });
    }

    function toggleFavoriteCourse(button, courseCode, courseName, courseTime) {
        const isFavorite = toggleStarIcon(button);
        const courseElement = button.closest('li');
        const checkboxState = courseElement.querySelector('.course-checkbox').checked;
        
        if (isFavorite) {
            // Add to favorites
            addToFavorites(courseCode, courseName, courseTime, checkboxState);
        } else {
            // Remove from favorites
            removeFromFavorites(courseCode);
        }
    }

    function addToFavorites(courseCode, courseName, courseTime, isChecked) {
        const favoritesList = document.querySelector('.favorites-list');
        const existingFavorite = favoritesList.querySelector(`[data-course-code="${courseCode}"]`);
        
        if (!existingFavorite) {
            const favoriteItem = createFavoriteItem(courseCode, courseName, courseTime);
            favoritesList.appendChild(favoriteItem);
            
            // Set checkbox state to match the search results
            const checkbox = favoriteItem.querySelector('.course-checkbox');
            if (checkbox) {
                checkbox.checked = isChecked;
                if (isChecked) {
                    // If checked, add to timetable
                    addCourseToTimetable(favoriteItem);
                }
            }
        }
    }

    function createFavoriteItem(courseCode, courseName, courseTime) {
        const li = document.createElement('li');
        li.className = 'p-4 bg-white rounded-lg shadow flex items-center justify-between cursor-pointer hover:bg-gray-100 transition';
        li.setAttribute('data-course-code', courseCode);
        li.setAttribute('data-course-name', courseName);
        li.setAttribute('data-course-time', courseTime);
        
        li.innerHTML = `
            <div class="flex items-center">
                <input type="checkbox" 
                    class="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer course-checkbox"
                    onclick="event.stopPropagation(); toggleCourseSelection(this, '${courseCode}');">
            </div>
            <div class="text-left flex-1 pl-4">
                <h4 class="font-semibold text-gray-900">${courseName}</h4>
                <p class="text-sm text-gray-500">${courseTime}</p>
            </div>
            <button class="favorite-btn ml-auto p-2" data-course-code="${courseCode}"
                onclick="toggleFavoriteCourse(this, '${courseCode}', '${courseName}', '${courseTime}'); event.stopPropagation();">
                <img src="/static/assets/star.svg" alt="Favorite Star" class="star-icon w-6 h-6 active">
            </button>
        `;
        
        return li;
    }

    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        
        try {
            const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            searchResults.innerHTML = '';
            if (data.courses && data.courses.length > 0) {
                data.courses.forEach(course => {
                    const courseKey = `${course.course_code}_${course.time}`;
                    const courseElement = createCourseElement(
                        course,
                        favorites.has(courseKey),
                        selectedCourses.has(courseKey)
                    );
                    
                    courseElement.addEventListener('click', (e) => {
                        if (!e.target.matches('input, button')) {
                            updateCourseInfo(course);
                        }
                    });
                    
                    searchResults.appendChild(courseElement);
                });
            } else {
                searchResults.innerHTML = '<p class="text-gray-500 text-center py-2">No courses found</p>';
            }
        } catch (error) {
            console.error('Error searching courses:', error);
            searchResults.innerHTML = '<p class="text-red-500 text-center py-2">Error searching courses</p>';
        }
    });

    // Export functions for timetable.js to use
    window.searchModule = {
        createCourseElement,
        toggleFavorite,
        favorites,
        selectedCourses
    };
});