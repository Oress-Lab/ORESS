document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const favoritesList = document.getElementById('favoritesList');
    const courseInfo = document.getElementById('courseInfo');

    // Initialize favorites and selected courses with course objects, not just CRNs
    let favorites = new Map(); // Change to Map to store full course objects
    let selectedCourses = new Set();

    // Load saved data
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        try {
            const favoritesArray = JSON.parse(savedFavorites);
            favorites = new Map(favoritesArray.map(course => [course.crn, course]));
            loadSavedFavorites();
        } catch (error) {
            console.error('Error loading favorites:', error);
            favorites = new Map();
        }
    }

    // Load selected courses from localStorage
    const savedSelected = localStorage.getItem('selectedCourses');
    if (savedSelected) {
        try {
            selectedCourses = new Set(JSON.parse(savedSelected));
            // Update checkboxes for selected courses
            selectedCourses.forEach(crn => {
                document.querySelectorAll(`[data-course-crn="${crn}"] input[type="checkbox"]`).forEach(cb => {
                    cb.checked = true;
                });
            });
        } catch (error) {
            console.error('Error loading selected courses:', error);
            selectedCourses = new Set();
        }
    }

    // Create a reusable function for checkbox event handling
    async function handleCheckboxChange(checkbox, course, courseElement) {
        const isChecked = checkbox.checked;
        
        if (isChecked) {
            // Try to add to timetable
            const success = window.timetableModule.addCourseToTimetable(courseElement);
            if (success) {
                selectedCourses.add(course.crn);
                localStorage.setItem('selectedCourses', JSON.stringify(Array.from(selectedCourses)));
                
                // Update all checkboxes for this course
                document.querySelectorAll(`[data-course-crn="${course.crn}"] input[type="checkbox"]`).forEach(cb => {
                    cb.checked = true;
                });

                // Save to database
                try {
                    const response = await fetch('/savetb/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            elements: Array.from(selectedCourses),
                            favorites: Array.from(favorites.values()),
                            checkboxes: Object.fromEntries([...selectedCourses].map(crn => [crn, true])),
                            stars: Object.fromEntries(Array.from(favorites.keys()).map(crn => [crn, true]))
                        })
                    });
                    
                    if (!response.ok) {
                        const data = await response.json();
                        console.error('Failed to save timetable:', data.error);
                        if (data.redirect) {
                            window.location.href = data.redirect;
                        }
                    }
                } catch (error) {
                    console.error('Error saving timetable:', error);
                }
            } else {
                // If there's an overlap, uncheck the box
                checkbox.checked = false;
            }
        } else {
            // Force remove from timetable by CRN
            const removed = window.timetableModule.removeCourseFromTimetable(course.course_code, course.time, course.crn);
            if (removed) {
                selectedCourses.delete(course.crn);
                localStorage.setItem('selectedCourses', JSON.stringify(Array.from(selectedCourses)));
                
                // Update all checkboxes for this course
                document.querySelectorAll(`[data-course-crn="${course.crn}"] input[type="checkbox"]`).forEach(cb => {
                    cb.checked = false;
                });

                // Update database immediately
                try {
                    const response = await fetch('/savetb/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            elements: Array.from(selectedCourses),
                            favorites: Array.from(favorites.values()),
                            checkboxes: Object.fromEntries([...selectedCourses].map(crn => [crn, true])),
                            stars: Object.fromEntries(Array.from(favorites.keys()).map(crn => [crn, true]))
                        })
                    });
                    
                    if (!response.ok) {
                        const data = await response.json();
                        console.error('Failed to save timetable:', data.error);
                        if (data.redirect) {
                            window.location.href = data.redirect;
                        }
                    }
                } catch (error) {
                    console.error('Error saving timetable:', error);
                }
            } else {
                console.error('Failed to remove course from timetable');
                // Re-check the box since removal failed
                checkbox.checked = true;
            }
        }
    }

    function createCourseElement(course, isFavorite = false) {
        const courseElement = document.createElement('div');
        courseElement.className = 'course-item p-3 border-b hover:bg-gray-50';
        courseElement.dataset.courseCrn = course.crn;
        courseElement.dataset.courseCode = course.course_code;
        courseElement.dataset.courseTime = course.time;
        courseElement.dataset.courseName = course.course_name;
        courseElement.dataset.courseRoom = course.room || '';
        courseElement.dataset.courseInstructor = course.instructor || '';
        courseElement.dataset.coursePrerequisite = course.prerequisite || '';

        // Format the time string nicely
        const timeStr = Array.isArray(course.time) ? course.time.join(', ') : course.time || 'Time not specified';
        const roomStr = course.room || 'Room not specified';
        
        courseElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <h3 class="font-medium">${course.course_code}</h3>
                    </div>
                    <h4 class="text-sm text-gray-700 mt-1">${course.course_name}</h4>
                    <p class="text-sm text-gray-500">${timeStr}</p>
                </div>
                <div class="flex items-center gap-3">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" 
                               class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                               ${selectedCourses.has(course.crn) ? 'checked' : ''}
                        >
                        <span class="text-sm text-gray-600">Add</span>
                    </label>
                    <button class="favorite-btn p-1 rounded hover:bg-gray-100">
                        <i class="fas fa-star ${isFavorite ? 'text-yellow-400' : 'text-gray-400'}"></i>
                    </button>
                </div>
            </div>
        `;

        // Add hover effect for course shadow
        courseElement.addEventListener('mouseenter', () => {
            if (window.timetableModule && window.timetableModule.showCourseShadow) {
                window.timetableModule.showCourseShadow(courseElement);
            }
        });

        courseElement.addEventListener('mouseleave', () => {
            if (window.timetableModule && window.timetableModule.removeCourseShadow) {
                window.timetableModule.removeCourseShadow();
            }
        });

        // Add event listeners
        const checkbox = courseElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => handleCheckboxChange(checkbox, course, courseElement));

        const favoriteBtn = courseElement.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(course, favoriteBtn);
        });
        
        return courseElement;
    }

    function createFavoriteItem(course) {
        const courseElement = createCourseElement(course, true);
        return courseElement;
    }

    function toggleFavorite(course, button) {
        if (!course || !course.crn) {
            console.error('Invalid course provided to toggleFavorite');
            return;
        }

        const isFavorite = favorites.has(course.crn);
        
        if (isFavorite) {
            // Remove from favorites
            favorites.delete(course.crn);
            
            // Update all star icons for this course
            document.querySelectorAll(`[data-course-crn="${course.crn}"] .favorite-btn i`).forEach(icon => {
                icon.classList.replace('text-yellow-400', 'text-gray-400');
            });
            
            // Remove from favorites list if it exists
            const favoriteItem = document.querySelector(`#favoritesList [data-course-crn="${course.crn}"]`);
            if (favoriteItem) {
                favoriteItem.remove();
            }

            // If favorites list is empty, show message
            if (favorites.size === 0) {
                favoritesList.innerHTML = '<div class="p-2 text-gray-500 text-center">No favorites saved</div>';
            }
        } else {
            // Add to favorites with full course object
            favorites.set(course.crn, course);
            
            // Update all star icons for this course
            document.querySelectorAll(`[data-course-crn="${course.crn}"] .favorite-btn i`).forEach(icon => {
                icon.classList.replace('text-gray-400', 'text-yellow-400');
            });
            
            // Create favorites container if it doesn't exist
            let favoritesContainer = favoritesList.querySelector('.favorites-container');
            if (!favoritesContainer) {
                // Clear any "no favorites" message
                favoritesList.innerHTML = '';
                
                favoritesContainer = document.createElement('div');
                favoritesContainer.className = 'favorites-container divide-y';
                favoritesList.appendChild(favoritesContainer);
            }
            
            // Add to favorites list
            const favoriteItem = createFavoriteItem(course);
            
            // Get the checkbox in the favorite item
            const checkbox = favoriteItem.querySelector('input[type="checkbox"]');
            if (checkbox) {
                // Set initial state based on selectedCourses
                checkbox.checked = selectedCourses.has(course.crn);
                
                // If it's checked, add it to the timetable
                if (checkbox.checked) {
                    window.timetableModule.addCourseToTimetable(favoriteItem);
                }
            }
            
            favoritesContainer.appendChild(favoriteItem);
        }
        
        // Save to localStorage - convert Map to Array for storage
        localStorage.setItem('favorites', JSON.stringify(Array.from(favorites.values())));
        console.log('Updated favorites:', Array.from(favorites.values()));
    }

    function loadSavedFavorites() {
        console.log('Loading saved favorites:', Array.from(favorites.values()));
        
        // Clear existing favorites list
        const favoritesContainer = favoritesList.querySelector('.favorites-container') || favoritesList;
        favoritesContainer.innerHTML = '';
        
        if (favorites.size === 0) {
            favoritesContainer.innerHTML = '<div class="p-2 text-gray-500 text-center">No favorites saved</div>';
            return;
        }

        // Add each favorite course
        favorites.forEach(course => {
            const favoriteItem = createFavoriteItem(course);
            
            // Get the checkbox in the favorite item
            const checkbox = favoriteItem.querySelector('input[type="checkbox"]');
            if (checkbox) {
                // Set initial state based on selectedCourses
                checkbox.checked = selectedCourses.has(course.crn);
                
                // If it's checked, add it to the timetable
                if (checkbox.checked) {
                    window.timetableModule.addCourseToTimetable(favoriteItem);
                }
            }
            
            favoritesContainer.appendChild(favoriteItem);
        });
    }

    async function getCurrentSession() {
        try {
            const response = await fetch('/get_session');
            const data = await response.json();
            return {
                campus: data.campus || 'main',
                semester: data.semester || 'Fall',
                year: data.year || new Date().getFullYear().toString()
            };
        } catch (error) {
            console.error('Error getting session:', error);
            return {
                campus: 'main',
                semester: 'Fall',
                year: new Date().getFullYear().toString()
            };
        }
    }

    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        
        if (!query) {
            searchResults.innerHTML = '<p class="text-gray-500 text-center py-2">Please enter a search term</p>';
            return;
        }

        try {
            // Get current session information
            const session = await getCurrentSession();
            
            const response = await fetch(`/search?${new URLSearchParams({
                query: query,
                campus: session.campus,
                semester: session.semester,
                year: session.year
            })}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            searchResults.innerHTML = '';
            if (data.courses && data.courses.length > 0) {
                data.courses.forEach(course => {
                    const courseKey = course.crn;
                    const courseElement = createCourseElement(
                        {
                            course_code: course.course_code,
                            course_name: course.course_name,
                            time: course.time,
                            room: course.room || '',
                            instructor: course.instructor || '',
                            prerequisite: course.prerequisite || '',
                            campus: session.campus,
                            semester: session.semester,
                            year: session.year,
                            crn: course.crn
                        },
                        favorites.has(courseKey)
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
            searchResults.innerHTML = `<p class="text-red-500 text-center py-2">Error searching courses: ${error.message}</p>`;
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
