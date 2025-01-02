document.addEventListener('DOMContentLoaded', function() {
    // Mobile search form
    const mobileSearchForm = document.getElementById('mobile-search-form');
    if (mobileSearchForm) {
        mobileSearchForm.addEventListener('submit', handleMobileSearch);
    }

    // Desktop search form
    const desktopSearchForm = document.getElementById('search-form');
    if (desktopSearchForm) {
        desktopSearchForm.addEventListener('submit', handleDesktopSearch);
    }
});

function updateMobileResults(courses, container) {
    container.innerHTML = '';

    if (!courses || courses.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-2">No courses found</p>';
        return;
    }

    courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'bg-white p-2 mb-2 rounded-lg shadow-sm flex items-center gap-2';
        
        // Add click handler for the entire element
        courseElement.addEventListener('click', function() {
            const courseData = {
                courseCode: course.course_code,
                courseTime: course.time,
                courseName: course.course_name,
                courseRoom: course.room,
                courseInstructor: course.instructor,
                coursePrerequisite: course.prerequisite
            };

            const success = addCourseToMobileTimetable(courseData);

            if (success) {
                // Visual feedback for successful addition
                this.classList.add('bg-green-50');
                setTimeout(() => {
                    this.classList.remove('bg-green-50');
                }, 500);
            }
        });

        courseElement.innerHTML = `
            <div class="flex-1">
                <p class="font-medium text-sm">${course.course_code}</p>
                <p class="text-xs text-gray-500">${course.time}</p>
            </div>
            <button class="p-1" onclick="event.stopPropagation(); toggleFavoriteCourse(this, '${course.course_code}', '${course.course_name}', '${course.time}')">
                <img src="/static/assets/star.svg" alt="Favorite" class="w-4 h-4">
            </button>
        `;

        container.appendChild(courseElement);
    });
}

// Expert search formatting
function formatExpertSearch(input) {
    const parts = input.split(' ');
    let formattedParts = [];

    parts.forEach(part => {
        if (part.startsWith('#')) {
            // Handle days format (#MWF)
            const days = part.substring(1).toUpperCase();
            // Validate days format
            if (/^[MTWRHF]+$/.test(days)) {
                formattedParts.push(`#${days}`);
            }
        } else {
            formattedParts.push(part);
        }
    });

    return formattedParts.join(' ');
}

// Desktop search handler
function handleDesktopSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('desktop-search-input');
    const searchQuery = formatExpertSearch(searchInput.value.trim());

    if (searchQuery === '') return;

    const courseList = document.querySelector('.search-section ul.space-y-4');
    courseList.innerHTML = '<li class="p-4 bg-white rounded-lg shadow text-center">Searching...</li>';

    performSearch(searchQuery, courseList, 'desktop');
}

// Mobile search handler
function handleMobileSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('mobile-search-input');
    const searchQuery = searchInput.value.trim();

    if (searchQuery === '') return;

    const resultsContainer = document.getElementById('mobile-search-results');
    resultsContainer.innerHTML = '<p class="text-center text-gray-500 py-2">Searching...</p>';

    performSearch(searchQuery, resultsContainer, 'mobile');
}

// Common search function
function performSearch(query, container, view) {
    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: `search_query=${encodeURIComponent(query)}`
    })
    .then(response => response.json())
    .then(courses => {
        if (view === 'mobile') {
            updateMobileResults(courses, container);
        } else {
            updateDesktopResults(courses, container);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center text-red-500 py-2">An error occurred</p>';
    });
}

// Create course element
function createCourseElement(course) {
    const courseElement = document.createElement('li');
    const courseKey = `${course.course_code}_${course.time}`;
    
    courseElement.classList.add(
        'p-4', 'bg-gray-100', 'rounded-lg', 'shadow',
        'cursor-pointer', 'hover:bg-gray-200', 'flex',
        'justify-between', 'items-center'
    );
    
    courseElement.setAttribute('data-course-key', courseKey);

    courseElement.innerHTML = `
        <div class="flex items-center justify-between w-full">
            <input type="checkbox" 
                class="mr-2 course-checkbox h-6 w-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                data-course-code="${course.course_code}"
                data-course-time="${course.time}"
                onclick="toggleCourseSelection(this, '${course.course_code}', '${course.time}'); event.stopPropagation();">
            
            <div class="flex flex-col leading-tight ml-2">
                <h4 class="font-semibold text-gray-800 text-lg">${course.course_code}</h4>
                <p class="text-gray-600 text-sm">${course.time}</p>
            </div>
            
            <button class="favorite-btn ml-auto p-2" 
                data-course-code="${course.course_code}"
                onclick="toggleFavoriteCourse(this, '${course.course_code}', '${course.course_name}', '${course.time}'); event.stopPropagation();">
                <img src="/static/assets/star.svg" alt="Favorite Star" class="star-icon w-6 h-6">
            </button>
        </div>
    `;

    // Set course data attributes
    setCourseAttributes(courseElement, course);

    // Add event listeners
    courseElement.setAttribute('onmouseover', 'updateCourseInfo(this); showCourseShadow(this);');
    courseElement.setAttribute('onmouseout', 'removeCourseShadow();');
    courseElement.setAttribute('onclick', 'toggleCourseOnTimetable(this);');

    return courseElement;
}

// Set course attributes
function setCourseAttributes(element, course) {
    element.setAttribute('data-course-code', course.course_code);
    element.setAttribute('data-course-name', course.course_name);
    element.setAttribute('data-course-time', course.time);
    element.setAttribute('data-course-room', course.room);
    element.setAttribute('data-course-instructor', course.instructor);
    element.setAttribute('data-course-prerequisite', course.prerequisite);
}

// Display no course found message
function displayNoCourseFound(container) {
    const noCourseElement = document.createElement('li');
    noCourseElement.classList.add('p-4', 'bg-gray-100', 'rounded-lg', 'shadow-md');
    noCourseElement.textContent = 'No courses found. Try typing the course code or name.';
    container.appendChild(noCourseElement);
}

// Helper to update star state
function updateStarState(courseCode, courseTime, isFavorite) {
    const starIcons = document.querySelectorAll(
        `[data-course-code="${courseCode}"][data-course-time="${courseTime}"] .star-icon`
    );
    const starSrc = isFavorite ? "/static/assets/star-filled.svg" : "/static/assets/star.svg";
    starIcons.forEach(starIcon => starIcon.src = starSrc);
}

// Helper function to check for course overlap
function checkTimeOverlap(existingTime, newTime) {
    const [existingDays, existingRange] = existingTime.split(' ');
    const [newDays, newRange] = newTime.split(' ');

    // Check for day overlap
    const hasCommonDay = existingDays.split('').some(day => newDays.includes(day));
    if (!hasCommonDay) return false;

    // Check time range overlap
    const [existingStart, existingEnd] = existingRange.split('-').map(t => convertTimeToMinutes(t));
    const [newStart, newEnd] = newRange.split('-').map(t => convertTimeToMinutes(t));

    return !(newEnd <= existingStart || newStart >= existingEnd);
}

// Helper function to convert time to minutes
function convertTimeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Update desktop search results
function updateDesktopResults(courses, container) {
    container.innerHTML = '';

    if (!courses || courses.length === 0) {
        displayNoCourseFound(container);
        return;
    }

    courses.forEach(course => {
        const courseElement = createCourseElement(course);
        container.appendChild(courseElement);
    });
}

// Toggle favorite course for mobile view
function toggleFavoriteCourseMobile(button, courseCode, courseName, courseTime) {
    const courseKey = `${courseCode}_${courseTime}`;
    const starImg = button.querySelector('img');
    const isCurrentlyFavorite = starImg.src.includes('star-filled.svg');
    const mobileFavoritesList = document.getElementById('mobile-favorite-courses');
    
    if (!isCurrentlyFavorite) {
        // Check if already in favorites
        if (mobileFavoritesList && !mobileFavoritesList.querySelector(`[data-course-key="${courseKey}"]`)) {
            // Add to favorites
            starImg.src = '/static/assets/star-filled.svg';
            const favoriteItem = createMobileFavoriteItem(courseCode, courseName, courseTime);
            favoriteItem.setAttribute('data-course-key', courseKey);
            mobileFavoritesList.appendChild(favoriteItem);
        }
    } else {
        // Remove from favorites
        starImg.src = '/static/assets/star.svg';
        removeFavoriteItemMobile(courseKey);
    }

    // Update only this specific course's star icons
    updateStarIconsForCourse(courseCode, courseTime, !isCurrentlyFavorite);
}

// Create mobile favorite item
function createMobileFavoriteItem(courseCode, courseName, courseTime) {
    const courseKey = `${courseCode}_${courseTime}`;
    const li = document.createElement('li');
    li.className = 'p-4 bg-white rounded-lg shadow flex items-center justify-between space-x-2 cursor-pointer hover:bg-gray-50 transition';
    li.setAttribute('data-course-key', courseKey);
    li.setAttribute('data-course-code', courseCode);
    li.setAttribute('data-course-time', courseTime);
    li.setAttribute('data-course-name', courseName);
    
    li.innerHTML = `
        <div class="flex items-center justify-between w-full">
            <div class="flex items-start space-x-3">
                <input type="checkbox" 
                    class="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer course-checkbox"
                    data-course-code="${courseCode}"
                    data-course-time="${courseTime}"
                    data-course-key="${courseKey}">
                
                <div class="text-left leading-tight">
                    <span class="block font-bold text-gray-800">${courseCode}</span>
                    <span class="block text-gray-700">${courseName}</span>
                    <span class="block text-xs text-gray-500">${courseTime}</span>
                </div>
            </div>
            <button class="favorite-remove-btn p-2" onclick="removeFavoriteAndUpdateAllMobile('${courseKey}', '${courseCode}', '${courseTime}')">
                <img src="/static/assets/x.svg" alt="Remove from Favorites" class="w-5 h-5">
            </button>
        </div>
    `;

    // Add checkbox event listener
    const checkbox = li.querySelector('.course-checkbox');
    checkbox.addEventListener('change', function(event) {
        event.stopPropagation(); // Prevent event bubbling
        toggleCourseSelection(this, courseCode, courseTime);
    });

    return li;
}

// Remove favorite and update for mobile
function removeFavoriteAndUpdateAllMobile(courseKey, courseCode, courseTime) {
    removeFavoriteItemMobile(courseKey);
    updateStarIconsForCourse(courseCode, courseTime, false);
    removeCourseFromTimetable(courseCode, courseTime);
    syncCheckboxes(courseCode, courseTime, false);
}

// Helper function to remove a specific favorite item in mobile
function removeFavoriteItemMobile(courseKey) {
    const mobileFavoritesList = document.getElementById('mobile-favorite-courses');
    if (mobileFavoritesList) {
        const item = mobileFavoritesList.querySelector(`[data-course-key="${courseKey}"]`);
        if (item) {
            item.remove();
        }

    }
}


