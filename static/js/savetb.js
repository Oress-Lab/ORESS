function saveTimetableState() {
    const timetableElements = document.querySelectorAll('.course-block');
    const searchResultItems = document.querySelectorAll('.search-results li');
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
            time: fav.getAttribute('data-course-time'),
            name: fav.getAttribute('data-course-name'),
            room: fav.getAttribute('data-course-room')
        })).filter(item => item.code),
        checkboxes: {},
        stars: {}
    };

    // Collect checkbox states for all courses
    [...searchResultItems, ...favoriteSectionItems].forEach(item => {
        const courseCode = item.getAttribute('data-course-code');
        if (!courseCode) return;

        const checkbox = item.querySelector('.course-checkbox');
        if (checkbox) {
            timetableData.checkboxes[courseCode] = checkbox.checked;
        }
        
        // A course is considered favorited if it's in the favorites section
        timetableData.stars[courseCode] = Boolean(favoritesUl?.querySelector(`[data-course-code="${courseCode}"]`));
    });

    console.log('Saving timetable data:', timetableData);
    console.log('Number of courses:', Object.keys(courseBlocks).length);
    console.log('Number of favorites:', timetableData.favorites.length);

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

            // Reset all checkboxes first
            document.querySelectorAll('.course-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });

            // First restore elements (courses in timetable)
            if (data.elements && data.elements.length > 0) {
                console.log('Restoring', data.elements.length, 'courses');
                
                data.elements.forEach(course => {
                    if (!course.id || !course.blocks) return;
                    
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
                    
                    // Update checkboxes for this course
                    document.querySelectorAll(`input[type="checkbox"][data-course-code="${course.id}"]`)
                        .forEach(cb => { cb.checked = true; });
                });
            }

            // Then restore favorites
            if (data.favorites && data.favorites.length > 0 && favoritesUl) {
                data.favorites.forEach(favorite => {
                    if (!favorite.code) return;
                    
                    // Check if the course exists in the timetable elements
                    const isInTimetable = data.elements.some(el => el.id === favorite.code);
                    
                    // Only add to favorites if it's in the timetable
                    if (isInTimetable) {
                        const li = document.createElement('li');
                        li.setAttribute('data-course-code', favorite.code);
                        li.setAttribute('data-course-time', favorite.time);
                        li.setAttribute('data-course-name', favorite.name);
                        li.setAttribute('data-course-room', favorite.room);
                        
                        // Create checkbox
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.className = 'course-checkbox';
                        checkbox.checked = true;
                        checkbox.setAttribute('data-course-code', favorite.code);
                        checkbox.setAttribute('data-course-time', favorite.time);
                        
                        // Add event listener
                        checkbox.addEventListener('change', () => {
                            window.timetableModule.toggleCourseSelection(
                                checkbox,
                                favorite.code,
                                favorite.time,
                                favorite.code
                            );
                        });
                        
                        li.appendChild(checkbox);
                        li.appendChild(document.createTextNode(
                            `${favorite.code} - ${favorite.name} (${favorite.time})`
                        ));
                        favoritesUl.appendChild(li);
                    }
                });
            }
            
            // Update checkbox states based on what's actually in the timetable
            if (data.checkboxes) {
                Object.entries(data.checkboxes).forEach(([courseCode, isChecked]) => {
                    // Only set checkbox if course is in timetable
                    const courseInTimetable = document.querySelector(
                        `.course-block[data-course-code="${courseCode}"]`
                    );
                    
                    if (courseInTimetable) {
                        document.querySelectorAll(
                            `input[type="checkbox"][data-course-code="${courseCode}"]`
                        ).forEach(cb => {
                            cb.checked = isChecked;
                        });
                    }
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
