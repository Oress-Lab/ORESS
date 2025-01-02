/**
 * open settings svg
 */
function openSettings() {
    // Show the blur background and popup
    document.getElementById('blur-overlay').classList.remove('hidden');
    document.getElementById('settings-popup').classList.remove('hidden');
}

/**
 * close settings svg
 */
function closeSettings() {
    // Hide the blur background and popup
    document.getElementById('blur-overlay').classList.add('hidden');
    document.getElementById('settings-popup').classList.add('hidden');
}


/**
 * download timetable as image
 */
function downloadTimetableImage() {
    console.log('Starting image download...');

    // Get the timetable element
    const timetable = document.querySelector('#schTimes');  // Updated selector to match your HTML
    if (!timetable) {
        console.error('Timetable grid not found');
        return;
    }

    // Create loading spinner
    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    loadingDiv.style.border = '1px solid #ccc';
    loadingDiv.style.borderRadius = '5px';
    loadingDiv.style.zIndex = '9999';
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 10px;">Generating Image...</div>
            <div style="width: 40px; height: 40px; border: 3px solid #f3f3f3; 
                        border-top: 3px solid #3498db; border-radius: 50%; 
                        animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
    `;
    document.body.appendChild(loadingDiv);

    // Use html2canvas to capture the timetable
    html2canvas(timetable, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1200,
        height: 900
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = 'timetable.png';
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Remove loading spinner
        document.body.removeChild(loadingDiv);
    }).catch(err => {
        console.error('Failed to generate image:', err);
        document.body.removeChild(loadingDiv);
    });
}

/**
 * course info section
 */
function updateCourseInfo(courseItem) {
    // Hide the default message
    document.getElementById('course-info-message').classList.add('hidden');
    
    // Get the course details from the data attributes
    const courseName = courseItem.getAttribute('data-course-name');
    const courseTime = courseItem.getAttribute('data-course-time');
    const courseRoom = courseItem.getAttribute('data-course-room');
    const courseInstructor = courseItem.getAttribute('data-course-instructor');
    const coursePrerequisite = courseItem.getAttribute('data-course-prerequisite');
    
    // Update the Course Information section with the new details
    document.getElementById('course-name').innerHTML = `Course Name: <span class="font-semibold">${courseName}</span>`;
    document.getElementById('course-time').innerHTML = `Course Time: <span class="font-semibold">${courseTime}</span>`;
    document.getElementById('course-room').innerHTML = `Course Room: <span class="font-semibold">${courseRoom}</span>`;
    document.getElementById('course-instructor').innerHTML = `Instructor: <span class="font-semibold">${courseInstructor}</span>`;
    document.getElementById('course-prerequisite').innerHTML = `Prerequisite: <span class="font-semibold">${coursePrerequisite}</span>`;

    // Show the course details
    document.querySelectorAll('.course-info-content p:not(#course-info-message)').forEach(p => p.classList.remove('hidden'));
}

/**
 * reset course info
 */
function resetCourseInfo() {
    // Show the default message
    document.getElementById('course-info-message').classList.remove('hidden');
    
    // Hide the course details
    document.querySelectorAll('.course-info-content p:not(#course-info-message)').forEach(p => p.classList.add('hidden'));
}

/**
 * check the course if on table
 */
const addedCourses = new Set();  // To track added courses
const favoriteCourses = new Set();  // To track favorite courses

// Toggle course on timetable and sync checkboxes in both sections
function toggleCourseOnTimetable(courseElement) {
    const courseCode = courseElement.getAttribute('data-course-code');
    const courseTime = courseElement.getAttribute('data-course-time');
    const courseKey = `${courseCode}_${courseTime}`;
    const checkbox = courseElement.querySelector('.course-checkbox');
    
    if (checkbox.checked) {
        addCourseToTimetable(courseElement);
    } else {
        removeCourseFromTimetable(courseCode, courseTime);
    }
    
    // Sync checkboxes for this specific course instance in both sections
    syncCheckboxes(courseCode, courseTime, checkbox.checked);
}

// Add course to the timetable using course code and time for exact match
function addCourseToTimetableByCodeAndTime(courseCode, courseTime) {
    const courseElement = document.querySelector(`[data-course-code="${courseCode}"][data-course-time="${courseTime}"]`);
    
    if (courseElement) {
        addCourseToTimetable(courseElement);
    } else {
        console.error(`Course with code ${courseCode} and time ${courseTime} not found in the DOM`);
    }
}


function toggleCourseSelection(checkbox, courseCode, courseTime) {
    const courseElement = checkbox.closest('li');
    
    toggleCourseOnTimetable(courseElement);
    syncCheckboxes(courseCode, courseTime, checkbox.checked);

    // If unchecked in both sections, remove from favorites list as well
    /*
    if (!checkbox.checked) {
        removeFavoriteCourseIfNotChecked(courseCode, courseTime);
    }
    */
}

// Sync checkboxes between search and favorite sections based on courseCode and courseTime
function syncCheckboxes(courseCode, courseTime, isChecked) {
    const courseKey = `${courseCode}_${courseTime}`;
    const checkboxes = document.querySelectorAll(`[data-course-key="${courseKey}"] input[type="checkbox"]`);
    
    // Set each checkbox's checked state to match the triggering checkbox
    checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
    });
}

// Modified addFavoriteCourseIfNotExist to sync the checkboxes directly
function addFavoriteCourseIfNotExist(courseCode, courseName, courseTime) {
    const courseKey = `${courseCode}_${courseTime}`;
    if (!favoriteCourses.has(courseKey)) {
        // Find the original course element to get all data
        const courseElement = document.querySelector(`[data-course-code="${courseCode}"][data-course-time="${courseTime}"]`);
        if (courseElement) {
            addFavoriteCourse(courseKey, courseElement);
        }

        // Sync checkboxes to show as checked once added to favorites
        syncCheckboxes(courseCode, courseTime, true);
    }
}

// Remove course from favorites if unchecked in both sections
function removeFavoriteCourseIfNotChecked(courseCode, courseTime) {
    const courseKey = `${courseCode}_${courseTime}`;
    const checkboxes = document.querySelectorAll(`[data-course-key="${courseKey}"] input[type="checkbox"]`);
    
    const isStillChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    if (!isStillChecked) {
        removeFavoriteCourse(courseKey, courseCode, courseTime);
    }
}

// Toggle favorite courses with the star
function toggleFavoriteCourse(buttonElement, courseCode, courseName, courseTime) {
    const courseKey = `${courseCode}_${courseTime}`;
    const isFavorited = favoriteCourses.has(courseKey);

    // Get the course element that contains all the data
    const courseElement = buttonElement.closest('li');

    if (isFavorited) {
        // Remove from favorites
        removeFavoriteCourse(courseKey, courseCode, courseTime);
        // Also remove from timetable
        removeCourseFromTimetable(courseCode, courseTime);
        // Uncheck all related checkboxes
        syncCheckboxes(courseCode, courseTime, false);
    } else {
        addFavoriteCourse(courseKey, courseElement);
    }

    // Update global favoriteCourses set
    if (isFavorited) {
        favoriteCourses.delete(courseKey);
    } else {
        favoriteCourses.add(courseKey);
    }

    // Update stars for this specific course and time
    updateStarState(courseCode, courseTime, !isFavorited);
}

// Update the state of the star icons in both sections
function updateStarState(courseCode, courseTime, isFavorite) {
    const courseKey = `${courseCode}_${courseTime}`;
    const starIcons = document.querySelectorAll(`[data-course-key="${courseKey}"] .star-icon`);
    
    starIcons.forEach((starIcon) => {
        starIcon.src = isFavorite ? "/static/assets/star-filled.svg" : "/static/assets/star.svg";
        starIcon.alt = isFavorite ? "Unfavorite Star" : "Favorite Star";
    });
}

// Add to favorites
function addFavoriteCourse(courseKey, courseElement) {
    const courseCode = courseElement.getAttribute('data-course-code');
    const courseName = courseElement.getAttribute('data-course-name');
    const courseTime = courseElement.getAttribute('data-course-time');
    const courseRoom = courseElement.getAttribute('data-course-room');
    const courseInstructor = courseElement.getAttribute('data-course-instructor');
    const coursePrerequisite = courseElement.getAttribute('data-course-prerequisite');

    favoriteCourses.add(courseKey);

    const favoriteList = document.getElementById('favorite-courses');
    const favoriteElement = document.createElement('li');
    favoriteElement.classList.add(
        'p-4',
        'bg-white',
        'rounded-lg',
        'shadow',
        'flex',
        'items-center',
        'justify-between',
        'space-x-2',
        'cursor-pointer',
        'hover:bg-gray-100',
        'transition'
    );

    // Add all the necessary data attributes
    favoriteElement.setAttribute('data-course-key', courseKey);
    favoriteElement.setAttribute('data-course-code', courseCode);
    favoriteElement.setAttribute('data-course-name', courseName);
    favoriteElement.setAttribute('data-course-time', courseTime);
    favoriteElement.setAttribute('data-course-room', courseRoom);
    favoriteElement.setAttribute('data-course-instructor', courseInstructor || '');
    favoriteElement.setAttribute('data-course-prerequisite', coursePrerequisite || '');

    favoriteElement.innerHTML = `
        <div class="flex items-center justify-between w-full">
            <div class="flex items-start space-x-3">
                <input type="checkbox" 
                    class="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer course-checkbox"
                    data-course-code="${courseCode}"
                    data-course-time="${courseTime}">
                
                <div class="text-left leading-tight">
                    <span class="block font-bold text-gray-800">${courseCode}</span>
                    <span class="block text-gray-700">${courseName}</span>
                    <span class="block text-xs text-gray-500">${courseTime}</span>
                </div>
            </div>
            <button class="favorite-remove-btn p-2">
                <img src="/static/assets/x.svg" alt="Remove from Favorites" class="x-icon w-5 h-5">
            </button>
        </div>
    `;

    favoriteList.appendChild(favoriteElement);
    updateStarState(courseCode, courseTime, true);

    const checkbox = favoriteElement.querySelector('.course-checkbox');
    const removeButton = favoriteElement.querySelector('.favorite-remove-btn');

    // Add event listeners
    checkbox.addEventListener('click', function (event) {
        toggleCourseSelection(checkbox, courseCode, courseTime);
        event.stopPropagation();
    });

    removeButton.addEventListener('click', function (event) {
        toggleFavoriteCourse(removeButton, courseCode, courseName, courseTime);
        event.stopPropagation();
    });

    // Add hover effects for course shadow
    favoriteElement.addEventListener('mouseenter', function () {
        showCourseShadow(favoriteElement);
    });

    favoriteElement.addEventListener('mouseleave', function () {
        removeCourseShadow();
    });

    // Add mouseover event for course info update
    favoriteElement.addEventListener('mouseover', function () {
        updateCourseInfo(favoriteElement);
    });
}

function removeFavoriteCourse(courseKey, courseCode, courseTime) {
    favoriteCourses.delete(courseKey);

    const favoriteList = document.getElementById('favorite-courses');
    const favoriteElement = favoriteList.querySelector(`li[data-course-key="${courseKey}"]`);
    if (favoriteElement) {
        // Remove event listeners before removing the element from the DOM
        const checkbox = favoriteElement.querySelector('.course-checkbox');
        const removeButton = favoriteElement.querySelector('.favorite-remove-btn');

        if (checkbox) {
            checkbox.removeEventListener('click', null); //remove event listener
        }
        if (removeButton) {
            removeButton.removeEventListener('click', null); //remove event listener
        }

        favoriteElement.remove();
    }

    updateStarState(courseCode, courseTime, false);
}



/**
 * add course to timetable
 * color stuff
 */

let courseCounter = 0;  // Initialize the course counter
const courseColors = [
    '#FF0000', '#0000FF', '#008000', '#C4CD31', '#FFA500', 
    '#FFC0CB', '#8A2BE2', '#40E0D0', '#9b59b6', '#34495e'
];
const courseColorMap = {};  // Store assigned colors

// Function to add the course to the timetable
function addCourseToTimetable(courseElement) {
    const courseTime = courseElement.getAttribute('data-course-time');
    const courseCode = courseElement.getAttribute('data-course-code');
    const courseName = courseElement.getAttribute('data-course-name');
    const courseRoom = courseElement.getAttribute('data-course-room');
    const courseKey = `${courseCode}_${courseTime}`;

    // Skip overlap check if there are no existing courses
    const existingBlocks = document.querySelectorAll('.course-block');
    let hasOverlap = false;

    if (existingBlocks.length > 0) {
        const { hasOverlap: overlap } = checkCourseOverlap(courseTime);
        hasOverlap = overlap;
    }

    if (hasOverlap) {
        // Show overlap warning
        const timetableContainer = document.getElementById('schTimes');
        timetableContainer.classList.add('border-red-500', 'border-4');
        courseElement.classList.add('border-red-500', 'border-2');

        setTimeout(() => {
            timetableContainer.classList.remove('border-red-500', 'border-4');
            courseElement.classList.remove('border-red-500', 'border-2');
        }, 1500);

        // Uncheck the checkbox
        const checkbox = courseElement.querySelector('.course-checkbox');
        if (checkbox) {
            checkbox.checked = false;
        }
        return false;
    }

    // Assign color if not already assigned
    if (!courseColorMap[courseKey]) {
        courseColorMap[courseKey] = courseColors[courseCounter % courseColors.length];
        courseCounter++;
    }

    const courseColor = courseColorMap[courseKey];
    const daysArray = extractDays(courseTime);
    const startHours = extractStartHour(courseTime);
    const endHours = extractEndHour(courseTime);

    // Create blocks for each time slot
    daysArray.forEach((dayString, index) => {
        let days;
        if (dayString === 'TTh') {
            days = ['T', 'H'];
        } else {
            days = dayString.match(/[MTWRHF]/g) || [];
        }

        days.forEach(day => {
            const startHour = convertTo24HourFormat(startHours[index]);
            const endHour = convertTo24HourFormat(endHours[index]);

            const topPosition = calculateTopPosition(startHour);
            const blockHeight = calculateBlockHeight(startHour, endHour);
            const leftPosition = calculateLeftPosition(day);

            const courseBlock = document.createElement('div');
            courseBlock.classList.add('course-block', 'absolute', 'border', 'rounded', 'p-2', 'text-center');
            courseBlock.style.backgroundColor = courseColor;
            courseBlock.style.borderColor = courseColor;
            courseBlock.style.top = `${topPosition}px`;
            courseBlock.style.left = `${leftPosition}px`;
            courseBlock.style.height = `${blockHeight}px`;
            courseBlock.style.width = '140px';
            courseBlock.style.zIndex = '2';
            courseBlock.setAttribute('data-course-key', courseKey);

            courseBlock.innerHTML = `
                <h4 class="font-bold text-sm">${courseCode}</h4>
                <p class="text-xs">${courseRoom}</p>
            `;

            document.getElementById('schTimes').appendChild(courseBlock);
        });
    });

    addedCourses.add(courseKey);
    addFavoriteCourseIfNotExist(courseCode, courseName, courseTime);
    return true;
}

function removeCourseFromTimetable(courseCode, courseTime) {
    const courseKey = `${courseCode}_${courseTime}`;

    // Remove course blocks
    const courseBlocks = document.querySelectorAll(`.course-block[data-course-key="${courseKey}"]`);
    courseBlocks.forEach(block => block.remove());

    // Remove from added courses set
    addedCourses.delete(courseKey);

    // Uncheck all related checkboxes
    syncCheckboxes(courseCode, courseTime, false);
}

function removeCourseFromTimetable(courseCode, courseTime) {
    const courseBlocks = document.querySelectorAll(`.course-block[data-course-key="${courseCode}_${courseTime}"]`);  // Fixed selector

    courseBlocks.forEach((courseBlock) => {
        courseBlock.remove();
    });

    syncCheckboxes(courseCode, courseTime, false);  // Uncheck the checkboxes for this course
}


/**
 * show course disposition on timetable 
 */
// Update showCourseShadow to handle lab sections
function showCourseShadow(courseElement) {
    console.log('Showing course shadow...');
    const courseTime = courseElement.getAttribute('data-course-time');
    const courseKey = courseElement.getAttribute('data-course-key');

    // Remove any existing shadows first
    removeCourseShadow();

    // Check for overlap
    const { hasOverlap, overlappingCourses } = checkCourseOverlap(courseTime, courseKey);

    // Add red border if there's an overlap
    const timetableContainer = document.getElementById('schTimes');
    if (hasOverlap) {
        // Make the warning more prominent
        timetableContainer.classList.add('border-red-500', 'border-[6px]');
        courseElement.classList.add('border-red-500', 'border-4');

        // Add red border to overlapping courses
        overlappingCourses.forEach(courseKey => {
            const courseBlocks = document.querySelectorAll(`.course-block[data-course-key="${courseKey}"]`);
            courseBlocks.forEach(block => {
                block.classList.add('border-red-500', 'border-4');
                // Add a pulsing animation to the block
                block.style.animation = 'pulse-red 2s infinite';
            });
        });
    }

    const daysArray = extractDays(courseTime);
    const startHours = extractStartHour(courseTime);
    const endHours = extractEndHour(courseTime);

    // Create shadows for each time slot
    daysArray.forEach((dayString, index) => {
        let days;
        if (dayString === 'TTh') {
            days = ['T', 'H'];
        } else {
            days = dayString.match(/[MTWRHF]/g) || [];
        }

        days.forEach(day => {
            const startHour = convertTo24HourFormat(startHours[index]);
            const endHour = convertTo24HourFormat(endHours[index]);

            const topPosition = calculateTopPosition(startHour);
            const blockHeight = calculateBlockHeight(startHour, endHour);
            const leftPosition = calculateLeftPosition(day);

            const shadowBlock = document.createElement('div');
            shadowBlock.classList.add('course-shadow', 'absolute', 'border', 'rounded', 'p-2');
            shadowBlock.style.top = `${topPosition}px`;
            shadowBlock.style.left = `${leftPosition}px`;
            shadowBlock.style.height = `${blockHeight}px`;
            shadowBlock.style.width = '140px';

            // Make the shadow more prominent for overlaps
            if (hasOverlap) {
                shadowBlock.style.backgroundColor = 'rgba(239, 68, 68, 0.6)'; // More opaque red
                shadowBlock.style.border = '4px dashed #ef4444';
                shadowBlock.style.animation = 'pulse-shadow 2s infinite';
            } else {
                shadowBlock.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                shadowBlock.style.border = '2px dashed #3b82f6';
            }
            shadowBlock.style.zIndex = '1';

            document.getElementById('schTimes').appendChild(shadowBlock);
        });
    });

    // Add CSS animation for the pulsing effect
    if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
            @keyframes pulse-red {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            @keyframes pulse-shadow {
                0% { opacity: 0.6; }
                50% { opacity: 0.8; }
                100% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(style);
    }
}

function removeCourseShadow() {
    document.querySelectorAll('.course-shadow').forEach(shadow => shadow.remove());
    // Remove red border and animations from any course elements and blocks
    document.querySelectorAll('.border-red-500').forEach(element => {
        element.classList.remove('border-red-500', 'border-2', 'border-4', 'border-[6px]');
        element.style.animation = '';
    });
}

function extractDays(timeString) {
    return timeString.split('/').map(component => {
        const days = component.trim().split(' ')[0];
        return days.replace('TH', 'H');
    });
}

// overlap
// Update checkCourseOverlap to handle lab sections
function checkCourseOverlap(newCourseTime) {
    if (!newCourseTime) return { hasOverlap: false, overlappingCourses: new Set() };

    const newDaysArray = extractDays(newCourseTime);
    const newStartHours = extractStartHour(newCourseTime);
    const newEndHours = extractEndHour(newCourseTime);
    const overlappingCourses = new Set();

    const existingBlocks = document.querySelectorAll('.course-block');
    let hasOverlap = false;

    // If no existing blocks, there can't be an overlap
    if (existingBlocks.length === 0) {
        return { hasOverlap: false, overlappingCourses };
    }

    // Check each time slot of the new course
    for (let i = 0; i < newDaysArray.length; i++) {
        const newDays = newDaysArray[i] === 'TTh' ? ['T', 'H'] : newDaysArray[i].match(/[MTWRHF]/g) || [];
        const newStart = convertTo24HourFormat(newStartHours[i]);
        const newEnd = convertTo24HourFormat(newEndHours[i]);

        // Check against each existing course block
        existingBlocks.forEach(block => {
            const blockKey = block.getAttribute('data-course-key');
            const [, blockTime] = blockKey.split('_');

            const existingDaysArray = extractDays(blockTime);
            const existingStartHours = extractStartHour(blockTime);
            const existingEndHours = extractEndHour(blockTime);

            for (let j = 0; j < existingDaysArray.length; j++) {
                const existingDays = existingDaysArray[j] === 'TTh' ? ['T', 'H'] : existingDaysArray[j].match(/[MTWRHF]/g) || [];
                const existingStart = convertTo24HourFormat(existingStartHours[j]);
                const existingEnd = convertTo24HourFormat(existingEndHours[j]);

                // Check if days overlap
                const hasCommonDay = newDays.some(day => existingDays.includes(day));

                if (hasCommonDay) {
                    // Check if times overlap
                    if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                        hasOverlap = true;
                        overlappingCourses.add(blockKey);
                    }
                }
            }
        });
    }

    return { hasOverlap, overlappingCourses };
}


function extractStartHour(timeString) {
    return timeString.split('/').map(component => {
        const time = component.trim().split(' ')[1].split('-')[0];
        // Handle cases where there's no AM/PM specified
        if (!time.includes('AM') && !time.includes('PM')) {
            const hour = parseInt(time);
            // Assume times before 8 or after 12 are PM
            return hour < 8 || hour === 12 ? `${time}PM` : `${time}AM`;
        }
        return time;
    });
}

// Update extractEndHour to handle lab sections
function extractEndHour(timeString) {
    return timeString.split('/').map(component => {
        const time = component.trim().split(' ')[1].split('-')[1];
        // Handle cases where there's no AM/PM specified
        if (!time.includes('AM') && !time.includes('PM')) {
            const hour = parseInt(time);
            // If hour is 8 or less, it's PM
            if (hour <= 8) {
                return `${time}PM`;
            }
            // For other hours, use the original AM/PM logic
            return hour < 8 || hour === 12 ? `${time}PM` : `${time}AM`;
        }
        return time;
    });
}

function convertTo24HourFormat(time) {
    let [hours, minutes] = time.replace(/[APM]/g, '').split(':').map(Number);

    if (time.includes('PM') && hours !== 12) {
        hours += 12;
    } else if (time.includes('AM') && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes || '00'}`;
}

function calculateTopPosition(startHour) {
    const hourToPx = {
        '8:00 AM': 72,
        '9:00 AM': 144,
        '10:00 AM': 216,
        '11:00 AM': 288,
        '12:00 PM': 360,
        '1:00 PM': 432,
        '2:00 PM': 504,
        '3:00 PM': 576,
        '4:00 PM': 648,
        '5:00 PM': 720,
        '6:00 PM': 792,
        '7:00 PM': 864,
        '8:00 PM': 936,
        '9:00 PM': 1008,
        '10:00 PM': 1080,
    };

    let [hour, minute] = startHour.split(':').map(Number);
    let amPm = hour >= 12 ? ' PM' : ' AM';

    if (hour > 12) {
        hour -= 12;
    } else if (hour === 0) {
        hour = 12;
        amPm = ' AM';
    }

    const hourKey = `${hour}:00${amPm}`;
    let top = hourToPx[hourKey];

    // If the hour is out of bounds, calculate it based on the pattern
    if (!top) {
        const baseHour = 8; // 8 AM is our starting point
        const hourDiff = (hour + (amPm === ' PM' ? 12 : 0)) - baseHour;
        top = hourDiff * 72;
    }

    if (minute === 30) {
        top += 36; // Add half of the hour height (72/2 = 36)
    }

    return top;
}

function calculateBlockHeight(startHour, endHour) {
    const hourToPx = 72; // Pixels per hour

    let [startHr, startMin] = startHour.split(':').map(Number);
    let [endHr, endMin] = endHour.split(':').map(Number);

    // Convert to 24-hour format if needed
    if (endHr < startHr) {
        endHr += 24;
    }

    // Calculate the total duration in minutes
    const startTotalMinutes = startHr * 60 + (startMin || 0);
    const endTotalMinutes = endHr * 60 + (endMin || 0);
    const durationMinutes = endTotalMinutes - startTotalMinutes;

    // Calculate height in pixels proportional to the duration
    const blockHeight = Math.max((durationMinutes / 60) * hourToPx, 0);

    return blockHeight;
}

function calculateLeftPosition(day) {
    const dayToPx = {
        'M': 80,
        'T': 220,
        'W': 360,
        'H': 500,  // Ensure Thursday (Th) is distinct
        'F': 640
    };

    return dayToPx[day] || 0;
}


// for the expantion of course info and favorites
function toggleSection(sectionId, iconElement) {
    const section = document.getElementById(sectionId);
    const content = section.querySelector(`.${sectionId.includes("course-info") ? "course-info-content" : "favorites-content"}`);
    
    // Toggle visibility of content
    if (content.style.display === "none") {
        content.style.display = "block"; // Show content
        iconElement.src = "static/assets/collapse.svg"; // Change to expand icon
        iconElement.alt = "Expand Section";
    } else {
        content.style.display = "none"; // Hide content
        iconElement.src = "static/assets/expand.svg"; // Change to collapse icon
        iconElement.alt = "Collapse Section";
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // Day accordion toggle
    function toggleDay(button) {
        const content = button.nextElementSibling;
        const arrow = button.querySelector('svg');
        
        content.classList.toggle('hidden');
        arrow.classList.toggle('rotate-180');
    }
    window.toggleDay = toggleDay;

    // Populate courses for each day
    function populateDayCourses() {
        if (window.innerWidth < 1024) { // Only for mobile
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            days.forEach(day => {
                const dayContent = document.querySelector(`button:contains('${day}')`).nextElementSibling;
                const courses = getCoursesByDay(day); // You'll need to implement this
                
                courses.forEach(course => {
                    const courseElement = document.createElement('div');
                    courseElement.className = 'py-2 border-b border-gray-200 last:border-0';
                    courseElement.innerHTML = `
                        <h4 class="font-semibold">${course.name}</h4>
                        <p class="text-sm text-gray-600">${course.time}</p>
                        <p class="text-sm text-gray-600">${course.room}</p>
                    `;
                    dayContent.appendChild(courseElement);
                });
            });
        }
    }

    // Initial population
    populateDayCourses();
});

// Mobile-specific function to add course to timetable
function addCourseToMobileTimetable(course) {
    const courseTime = course.courseTime;
    const courseCode = course.courseCode;
    const courseName = course.courseName;
    const courseKey = `${courseCode}_${courseTime}`;

    // Check for existing courses and overlaps
    const existingCourses = document.querySelectorAll('.course-info[data-course-code]');
    let hasOverlap = false;

    existingCourses.forEach(existing => {
        if (existing.dataset.courseTime && courseTime) {
            if (checkTimeOverlap(existing.dataset.courseTime, courseTime)) {
                hasOverlap = true;
            }
        }
    });

    if (hasOverlap) {
        alert(`Time Conflict: This course overlaps with an existing course`);
        return false;
    }

    // Parse course time
    const [days, timeRange] = courseTime.split(' ');
    const [startTime, endTime] = timeRange.split('-');
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = endHour - startHour;

    // Add course to each day
    days.split('').forEach(day => {
        const dayMap = {
            'M': 'Monday',
            'T': 'Tuesday',
            'W': 'Wednesday',
            'R': 'Thursday',
            'F': 'Friday'
        };

        const dayCell = document.querySelector(
            `.course-info[data-day="${dayMap[day]}"][data-hour="${startHour}"]`
        );

        if (dayCell && !dayCell.querySelector(`[data-course-code="${courseCode}"]`)) {
            const courseDiv = document.createElement('div');
            courseDiv.className = 'bg-blue-100 rounded p-1 mb-1 relative';
            courseDiv.dataset.courseCode = courseCode;
            courseDiv.dataset.courseTime = courseTime;

            courseDiv.innerHTML = `
                <span class="block font-medium text-xs">${courseCode}</span>
                <button class="absolute top-0 right-0 text-xs text-red-500 px-1">×</button>
            `;

            // Add delete functionality
            const deleteBtn = courseDiv.querySelector('button');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                courseDiv.remove();
            };

            dayCell.appendChild(courseDiv);
        }
    });

    return true;
}

// Add event listeners to course elements
document.querySelectorAll('.course-element-selector').forEach(courseElement => {
    courseElement.addEventListener('mouseover', () => updateCourseInfo(courseElement));
    courseElement.addEventListener('mouseout', resetCourseInfo);
});
