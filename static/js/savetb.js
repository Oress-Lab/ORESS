function saveTimetableState() {
    const timetableElements = document.querySelectorAll('.course-block');
    const searchResultItems = document.querySelectorAll('.search-results li');
    const favoritesUl = document.querySelector('.favorites-section ul');
    const favoriteSectionItems = favoritesUl ? Array.from(favoritesUl.children) : [];
    
    const timetableData = {
        elements: Array.from(timetableElements).map(el => ({
            id: el.getAttribute('data-course-code'),
            position: el.style.cssText,
            content: el.innerHTML,
            time: el.getAttribute('data-course-time'),
            name: el.getAttribute('data-course-name'),
            room: el.getAttribute('data-course-room')
        })),
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
    console.log('Number of elements:', timetableData.elements.length);
    console.log('Number of favorites:', timetableData.favorites.length);
    console.log('Favorite codes:', timetableData.favorites.map(f => f.code));

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

            // First restore elements (courses in timetable)
            if (data.elements && data.elements.length > 0) {
                console.log('Restoring', data.elements.length, 'elements');
                data.elements.forEach(element => {
                    const courseBlock = document.createElement('div');
                    courseBlock.className = 'course-block';
                    courseBlock.setAttribute('data-course-code', element.id);
                    courseBlock.setAttribute('data-course-time', element.time);
                    courseBlock.setAttribute('data-course-name', element.name);
                    courseBlock.setAttribute('data-course-room', element.room);
                    courseBlock.style.cssText = element.position;
                    courseBlock.innerHTML = element.content;
                    
                    document.getElementById('schTimes').appendChild(courseBlock);
                    
                    // Add to favorites section since it's in the timetable
                    const courseItem = document.querySelector(`li[data-course-code="${element.id}"]`);
                    if (courseItem && favoritesUl) {
                        const favoriteItem = courseItem.cloneNode(true);
                        const checkbox = favoriteItem.querySelector('.course-checkbox');
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                        favoritesUl.appendChild(favoriteItem);
                    }
                });
            }

            // Then restore additional favorites
            if (data.favorites && data.favorites.length > 0) {
                console.log('Restoring', data.favorites.length, 'favorites');
                data.favorites.forEach(favorite => {
                    // Only add if not already in favorites (wasn't added by elements loop)
                    if (favoritesUl && !favoritesUl.querySelector(`[data-course-code="${favorite.code}"]`)) {
                        const courseItem = document.querySelector(`li[data-course-code="${favorite.code}"]`);
                        if (courseItem) {
                            const favoriteItem = courseItem.cloneNode(true);
                            const checkbox = favoriteItem.querySelector('.course-checkbox');
                            if (checkbox) {
                                checkbox.checked = data.checkboxes?.[favorite.code] ?? false;
                            }
                            favoritesUl.appendChild(favoriteItem);
                        }
                    }
                });
            }

            // Restore checkbox states for all items
            if (data.checkboxes) {
                Object.entries(data.checkboxes).forEach(([courseCode, isChecked]) => {
                    const items = document.querySelectorAll(`li[data-course-code="${courseCode}"] .course-checkbox`);
                    items.forEach(checkbox => {
                        checkbox.checked = isChecked;
                    });
                });
            }

            console.log('Timetable state restored');
            console.log('- Elements:', document.querySelectorAll('.course-block').length);
            console.log('- Favorites:', document.querySelectorAll('.favorites-section ul li').length);
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