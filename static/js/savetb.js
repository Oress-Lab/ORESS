function saveTimetableState() {
    const timetableElements = document.querySelectorAll('.course-block');
    const favoritesUl = document.querySelector('.favorites-section ul');
    const favoriteSectionItems = favoritesUl ? Array.from(favoritesUl.children) : [];
    
    // Group course blocks by course code to preserve all time slots
    const courseBlocks = {};
    Array.from(timetableElements).forEach(el => {
        const courseCode = el.getAttribute('data-course-code');
        const crn = el.getAttribute('data-course-crn');
        const key = `${courseCode}-${crn}`;
        
        if (!courseBlocks[key]) {
            courseBlocks[key] = {
                id: courseCode,
                crn: crn,
                name: el.getAttribute('data-course-name'),
                time: el.getAttribute('data-course-time'),
                room: el.getAttribute('data-course-room'),
                blocks: []
            };
        }
        
        courseBlocks[key].blocks.push({
            position: el.style.cssText,
            content: el.innerHTML,
            day: el.getAttribute('data-day'),
            startHour: el.getAttribute('data-start-hour'),
            endHour: el.getAttribute('data-end-hour')
        });
    });
    
    const timetableData = {
        elements: Object.values(courseBlocks),
        favorites: favoriteSectionItems.map(fav => ({
            code: fav.getAttribute('data-course-code'),
            crn: fav.getAttribute('data-course-crn'),
            time: fav.getAttribute('data-course-time'),
            name: fav.getAttribute('data-course-name'),
            room: fav.getAttribute('data-course-room')
        })).filter(item => item.code),
        checkboxes: {},
        stars: {}
    };

    // Get selected courses from courseSelectionModule
    if (window.courseSelectionModule) {
        // Get all courses from the page
        const allCourses = document.querySelectorAll('[data-course-crn]');
        allCourses.forEach(course => {
            const crn = course.getAttribute('data-course-crn');
            if (crn) {
                timetableData.checkboxes[crn] = window.courseSelectionModule.isSelected(crn);
                timetableData.stars[crn] = Boolean(favoritesUl?.querySelector(`[data-course-crn="${crn}"]`));
            }
        });
    }

    console.log('Saving timetable data:', timetableData);

    fetch('/savetb/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(timetableData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirect) {
            window.location.href = data.redirect;
        }
        console.log('Save response:', data);
    })
    .catch(error => console.error('Error saving timetable:', error));
}

function loadTimetableState() {
    fetch('/savetb/get')
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to load timetable');
        })
        .then(data => {
            if (data.redirect) {
                window.location.href = data.redirect;
                return;
            }

            console.log('Received timetable data:', data);
            
            // Clear existing elements
            document.querySelectorAll('.course-block').forEach(el => el.remove());
            const favoritesUl = document.querySelector('.favorites-section ul');
            if (favoritesUl) {
                favoritesUl.innerHTML = ''; // Clear existing favorites
            }

            // Reset all checkboxes and selected courses
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            if (window.courseSelectionModule) {
                localStorage.setItem('selectedCourses', JSON.stringify([]));
            }

            // First restore elements (courses in timetable)
            const addedCrns = new Set();
            if (data.elements && data.elements.length > 0) {
                console.log('Restoring', data.elements.length, 'courses');
                
                data.elements.forEach(course => {
                    if (!course.id || !course.blocks || !course.crn) return;
                    addedCrns.add(course.crn);
                    
                    // Create all blocks for this course
                    course.blocks.forEach(block => {
                        const courseBlock = document.createElement('div');
                        courseBlock.className = 'course-block absolute border rounded p-2 text-center';
                        courseBlock.setAttribute('data-course-code', course.id);
                        courseBlock.setAttribute('data-course-crn', course.crn);
                        courseBlock.setAttribute('data-course-time', course.time);
                        courseBlock.setAttribute('data-course-name', course.name);
                        courseBlock.setAttribute('data-course-room', course.room);
                        courseBlock.setAttribute('data-day', block.day);
                        courseBlock.setAttribute('data-start-hour', block.startHour);
                        courseBlock.setAttribute('data-end-hour', block.endHour);
                        
                        // Apply saved styles
                        courseBlock.style.cssText = block.position;
                        courseBlock.innerHTML = block.content;
                        
                        // Add event listeners
                        courseBlock.addEventListener('mouseenter', () => {
                            courseBlock.querySelector('.remove-course-btn')?.classList.remove('hidden');
                        });
                        courseBlock.addEventListener('mouseleave', () => {
                            courseBlock.querySelector('.remove-course-btn')?.classList.add('hidden');
                        });
                        
                        // Add click handlers
                        courseBlock.querySelector('.course-block-content')?.addEventListener('click', () => {
                            window.timetableModule.showCourseDetails(courseBlock);
                        });
                        
                        courseBlock.querySelector('.remove-course-btn')?.addEventListener('click', (e) => {
                            e.stopPropagation();
                            window.timetableModule.removeCourseFromTimetable(course.id, course.time, course.crn);
                        });
                        
                        document.querySelector('#schTimes').appendChild(courseBlock);
                    });
                });
            }

            // Update selectedCourses and checkboxes based on actual timetable content
            if (window.courseSelectionModule) {
                localStorage.setItem('selectedCourses', JSON.stringify(Array.from(addedCrns)));
                addedCrns.forEach(crn => {
                    window.courseSelectionModule.addToSelected(crn);
                });
            }

            // Restore favorites
            if (data.favorites && data.favorites.length > 0 && favoritesUl) {
                data.favorites.forEach(favorite => {
                    if (!favorite.code || !favorite.crn) return;
                    
                    const li = document.createElement('li');
                    li.setAttribute('data-course-code', favorite.code);
                    li.setAttribute('data-course-crn', favorite.crn);
                    li.setAttribute('data-course-time', favorite.time);
                    li.setAttribute('data-course-name', favorite.name);
                    li.setAttribute('data-course-room', favorite.room);
                    
                    const isInTimetable = addedCrns.has(favorite.crn);
                    li.innerHTML = `
                        <div class="flex items-center justify-between p-2 border-b">
                            <div>
                                <h3 class="font-medium">${favorite.code}</h3>
                                <p class="text-sm text-gray-600">${favorite.time}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="checkbox" class="form-checkbox" ${isInTimetable ? 'checked' : ''}>
                                <button class="favorite-btn">
                                    <i class="fas fa-star text-yellow-400"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    favoritesUl.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error('Error loading timetable:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing timetable state');
    loadTimetableState();

    const timetableContainer = document.querySelector('#schTimes');
    if (timetableContainer) {
        console.log('Found timetable container, adding event listeners');
        
        const observer = new MutationObserver(() => {
            console.log('Timetable modified, saving state');
            saveTimetableState();
        });
        
        observer.observe(timetableContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        timetableContainer.addEventListener('dragend', () => {
            console.log('Drag ended, saving timetable state');
            saveTimetableState();
        });
    } else {
        console.log('Timetable container not found');
    }

    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
        searchResults.addEventListener('click', (e) => {
            if (e.target.classList.contains('star') || e.target.type === 'checkbox') {
                console.log('Star or checkbox clicked, saving state');
                setTimeout(saveTimetableState, 100); 
            }
        });
    }

    console.log('Setting up autosave');
    setInterval(() => {
        console.log('Autosaving timetable state');
        saveTimetableState();
    }, 5 * 60 * 1000);
});
