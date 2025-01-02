// Add these event listeners after DOMContentLoaded
window.addEventListener('beforeunload', function (e) {
    // Save both timetable and favorites
    saveTimetable();
    saveFavorites();
    
    // Show a confirmation dialog to the user
    e.preventDefault();
    e.returnValue = '';
});

// Backup save on actual unload
window.addEventListener('unload', function () {
    saveTimetable();
    saveFavorites();
});


// Function to get the current user's email
async function getCurrentUserEmail() {
    try {
        const response = await fetch('/get_current_user');
        const data = await response.json();
        if (data.success) {
            return data.email;
        }
        console.error('Failed to get user email:', data.message);
        return null;
    } catch (err) {
        console.error('Error getting user email:', err);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const userEmail = await getCurrentUserEmail();
    if (!userEmail) {
        console.error('No user email found');
        return;
    }

    // Fetch timetable
    fetch(`/get_timetable?email=${encodeURIComponent(userEmail)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderTimetable(data.timetable);
            }
        })
        .catch(err => console.error('Error fetching timetable:', err));

    // Fetch favorites
    fetch(`/get_favorites?email=${encodeURIComponent(userEmail)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderFavorites(data.favorites);
            }
        })
        .catch(err => console.error('Error fetching favorites:', err));
});


async function saveTimetable(isUnloading = false) {
    const userEmail = await getCurrentUserEmail();
    if (!userEmail) {
        console.error('No user email found');
        return;
    }

    const timetableData = Array.from(document.querySelectorAll('.course-block')).map(block => ({
        course_name: block.querySelector('h4').innerText,
        day: block.getAttribute('data-day'),
        start_time: block.getAttribute('data-start-time'),
        end_time: block.getAttribute('data-end-time'),
        position: {
            x: block.style.left,
            y: block.style.top
        }
    }));

    if (isUnloading) {
        // Use synchronous request during page unload
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/save_timetable', false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ email: userEmail, timetable: timetableData }));
    } else {
        try {
            const response = await fetch('/save_timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, timetable: timetableData })
            });
            const data = await response.json();
            if (!data.success) {
                console.error('Failed to save timetable:', data.message);
            }
        } catch (err) {
            console.error('Error saving timetable:', err);
        }
    }
}

async function saveFavorites(isUnloading = false) {
    const userEmail = await getCurrentUserEmail();
    if (!userEmail) {
        console.error('No user email found');
        return;
    }

    const favoritesData = Array.from(favoriteCourses).map(key => {
        const element = document.querySelector(`[data-course-key="${key}"]`);
        return {
            course_name: element.getAttribute('data-course-name'),
            course_code: element.getAttribute('data-course-code'),
            course_time: element.getAttribute('data-course-time')
        };
    });

    if (isUnloading) {
        // Use synchronous request during page unload
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/save_favorites', false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ email: userEmail, favorites: favoritesData }));
    } else {
        try {
            const response = await fetch('/save_favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, favorites: favoritesData })
            });
            const data = await response.json();
            if (!data.success) {
                console.error('Failed to save favorites:', data.message);
            }
        } catch (err) {
            console.error('Error saving favorites:', err);
        }
    }
}


function renderTimetable(timetable) {
    timetable.forEach(entry => {
        // Create and add timetable blocks as per your existing logic
        const courseElement = document.createElement('div');
        courseElement.className = 'course-block';
        courseElement.style.left = entry.position.x;
        courseElement.style.top = entry.position.y;
        courseElement.setAttribute('data-day', entry.day);
        courseElement.setAttribute('data-start-time', entry.start_time);
        courseElement.setAttribute('data-end-time', entry.end_time);

        // Populate the course details
        courseElement.innerHTML = `
            <h4>${entry.course_name}</h4>
        `;

        document.getElementById('schTimes').appendChild(courseElement);
    });
}

function renderFavorites(favorites) {
    const favoriteList = document.getElementById('favorite-courses');
    favorites.forEach(entry => {
        const favoriteElement = document.createElement('li');
        favoriteElement.setAttribute('data-course-key', `${entry.course_code}_${entry.course_time}`);
        favoriteElement.setAttribute('data-course-name', entry.course_name);
        favoriteElement.setAttribute('data-course-code', entry.course_code);
        favoriteElement.setAttribute('data-course-time', entry.course_time);

        favoriteElement.innerHTML = `
            <div>${entry.course_name} (${entry.course_time})</div>
        `;

        favoriteList.appendChild(favoriteElement);
    });
}
