document.addEventListener('DOMContentLoaded', function() {
    let courseCounter = 0;
    const courseColors = [
        '#FF0000', '#0000FF', '#008000', '#C4CD31', '#FFA500', 
        '#FFC0CB', '#8A2BE2', '#40E0D0', '#9b59b6', '#34495e'
    ];
    const courseColorMap = {};
    const addedCourses = new Set();

    // Course Management Functions
    function addCourseToTimetable(courseElement) {
        const courseTime = courseElement.getAttribute('data-course-time');
        const courseCode = courseElement.getAttribute('data-course-code');
        const courseName = courseElement.getAttribute('data-course-name');
        const courseRoom = courseElement.getAttribute('data-course-room');
        const courseKey = `${courseCode}_${courseTime}`;
    
        // Check if course is already added
        if (addedCourses.has(courseKey)) {
            return false;
        }

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
                courseBlock.style.width = '120px';
                courseBlock.style.zIndex = '2';
                courseBlock.setAttribute('data-course-key', courseKey);
                courseBlock.setAttribute('data-course-code', courseCode);
                courseBlock.setAttribute('data-course-time', courseTime);
    
                courseBlock.innerHTML = `
                    <h4 class="font-bold text-sm text-white">${courseCode}</h4>
                    <p class="text-xs text-white">${courseRoom || ''}</p>
                `;
    
                document.getElementById('schTimes').appendChild(courseBlock);
            });
        });
    
        addedCourses.add(courseKey);
        return true;
    }

    function removeCourseFromTimetable(courseCode, courseTime) {
        // Find blocks with matching course code and time
        const blocks = document.querySelectorAll(`.course-block[data-course-code="${courseCode}"][data-course-time="${courseTime}"]`);
        
        // Remove each block and its key from tracking
        blocks.forEach(block => {
            const courseKey = block.getAttribute('data-course-key');
            if (courseKey) {
                addedCourses.delete(courseKey);
            }
            block.remove();
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

    // Time Calculation Functions
    function extractStartHour(timeString) {
        return timeString.split('/').map(component => {
            const time = component.trim().split(' ')[1].split('-')[0];
            if (!time.includes('AM') && !time.includes('PM')) {
                const hour = parseInt(time);
                return hour < 8 || hour === 12 ? `${time}PM` : `${time}AM`;
            }
            return time;
        });
    }

    function extractEndHour(timeString) {
        return timeString.split('/').map(component => {
            const time = component.trim().split(' ')[1].split('-')[1];
            if (!time.includes('AM') && !time.includes('PM')) {
                const hour = parseInt(time);
                if (hour <= 8) {
                    return `${time}PM`;
                }
                return hour < 8 || hour === 12 ? `${time}PM` : `${time}AM`;
            }
            return time;
        });
    }

    function calculateTopPosition(startHour) {
        const hourHeight = 72; // Height per hour slot (matches hour-line spacing)
        const headerOffset = 42; // Adjusted to match exactly with hour lines
        const halfHourOffset = 42; // 30 minutes worth of pixels (72/2)
        
        // Parse the time
        let [time, period] = startHour.split(/(?=[AP]M)/);
        let [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format for calculation
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        // Calculate offset from 8 AM (start of timetable)
        const startHourOffset = 7; // Starting from 7 AM
        const hourOffset = hours - startHourOffset;
        const minuteOffset = minutes / 60;
        
        // Calculate position to match hour-line grid and subtract 30 minutes worth of pixels
        const position = headerOffset + (hourOffset * hourHeight) + (minuteOffset * hourHeight) - halfHourOffset;
        return Math.max(0, position);
    }

    function calculateBlockHeight(startHour, endHour) {
        const hourHeight = 72; // Height per hour slot
        
        // Parse start time
        let [startTime, startPeriod] = startHour.split(/(?=[AP]M)/);
        let [startHrs, startMins] = startTime.split(':').map(Number);
        
        // Parse end time
        let [endTime, endPeriod] = endHour.split(/(?=[AP]M)/);
        let [endHrs, endMins] = endTime.split(':').map(Number);
        
        // Convert to 24-hour format
        if (startPeriod === 'PM' && startHrs !== 12) startHrs += 12;
        if (startPeriod === 'AM' && startHrs === 12) startHrs = 0;
        if (endPeriod === 'PM' && endHrs !== 12) endHrs += 12;
        if (endPeriod === 'AM' && endHrs === 12) endHrs = 0;
        
        // Calculate duration in hours
        const duration = (endHrs + endMins / 60) - (startHrs + startMins / 60);
        
        return Math.max(duration * hourHeight, 0);
    }

    function calculateLeftPosition(day) {
        // Use the exact positions from the day-lines
        const dayPositions = {
            'M': 75,  // First day-line position
            'T': 195, // Second day-line position
            'W': 315, // Third day-line position
            'H': 435, // Fourth day-line position
            'F': 555  // Fifth day-line position
        };
        
        return dayPositions[day] || 75;
    }

    function extractDays(courseTime) {
        return courseTime.split(' ')[0].match(/[MTWRHF]+/g) || [];
    }

    // Course Overlap Functions
    function checkCourseOverlap(courseTime, excludeCourseKey) {
        const overlappingCourses = [];
        const timeSlots = parseTimeSlots(courseTime);

        document.querySelectorAll('.course-block').forEach(block => {
            if (block.dataset.courseKey === excludeCourseKey) return;
            
            const blockTimeSlots = parseTimeSlots(block.dataset.courseTime);
            if (hasTimeSlotOverlap(timeSlots, blockTimeSlots)) {
                overlappingCourses.push(block.dataset.courseKey);
            }
        });

        return { hasOverlap: overlappingCourses.length > 0, overlappingCourses };
    }

    function parseTimeSlots(courseTime) {
        const slots = [];
        const [days, time] = courseTime.split(' ');
        if (!time) return slots;

        const [startTime, endTime] = time.split('-');
        const daysArray = days.match(/[MTWRHF]/g) || [];
        
        daysArray.forEach(day => {
            slots.push({
                day,
                start: convertTimeToMinutes(startTime),
                end: convertTimeToMinutes(endTime)
            });
        });

        return slots;
    }

    function hasTimeSlotOverlap(slots1, slots2) {
        return slots1.some(slot1 =>
            slots2.some(slot2 =>
                slot1.day === slot2.day && timeOverlap(slot1.start, slot1.end, slot2.start, slot2.end)
            )
        );
    }

    function timeOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }

    function convertTimeToMinutes(time) {
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        minutes = parseInt(minutes || 0);

        if (time.includes('PM') && hours !== 12) {
            hours += 12;
        } else if (time.includes('AM') && hours === 12) {
            hours = 0;
        }

        return hours * 60 + minutes;
    }

    // UI Functions
    function showOverlapWarning() {
        const warning = document.createElement('div');
        warning.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        warning.textContent = 'Course time overlaps with an existing course!';
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 3000);
    }

    function showCourseDetails(courseElement) {
        const courseInfo = document.getElementById('courseInfo');
        const courseCode = courseElement.getAttribute('data-course-code');
        const courseName = courseElement.getAttribute('data-course-name');
        const courseTime = courseElement.getAttribute('data-course-time');
        const courseRoom = courseElement.getAttribute('data-course-room');
        const courseInstructor = courseElement.getAttribute('data-course-instructor');
        const coursePrerequisite = courseElement.getAttribute('data-course-prerequisite');

        courseInfo.innerHTML = `
            <div class="space-y-2">
                <p class="font-semibold">${courseCode}</p>
                <p>${courseName}</p>
                <p class="text-sm text-gray-600">Time: ${courseTime}</p>
                <p class="text-sm text-gray-600">Room: ${courseRoom}</p>
                <p class="text-sm text-gray-600">Instructor: ${courseInstructor}</p>
                ${coursePrerequisite ? `<p class="text-sm text-gray-600">Prerequisites: ${coursePrerequisite}</p>` : ''}
            </div>
        `;
    }

    function showCourseShadow(courseElement) {
        removeCourseShadow();
        showCourseDetails(courseElement);

        const courseTime = courseElement.getAttribute('data-course-time');
        const daysArray = extractDays(courseTime);
        const startTimes = extractStartHour(courseTime);
        const endTimes = extractEndHour(courseTime);

        daysArray.forEach((dayString, index) => {
            let days = dayString === 'TTh' ? ['T', 'H'] : dayString.match(/[MTWRHF]/g) || [];

            days.forEach(day => {
                const shadow = document.createElement('div');
                shadow.classList.add('course-shadow');
                
                // Calculate positions
                const top = calculateTopPosition(startTimes[index]);
                const left = calculateLeftPosition(day);
                const height = calculateBlockHeight(startTimes[index], endTimes[index]);
                
                // Apply styles
                Object.assign(shadow.style, {
                    top: `${top}px`,
                    left: `${left}px`,
                    height: `${height}px`,
                    width: '120px',
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    position: 'absolute',
                    zIndex: '1',
                    transition: 'all 0.2s ease',
                    borderRadius: '4px',
                    pointerEvents: 'none'
                });
                
                document.getElementById('schTimes').appendChild(shadow);
            });
        });
    }

    function removeCourseShadow() {
        const shadows = document.querySelectorAll('.course-shadow');
        shadows.forEach(shadow => shadow.remove());
    }

    // Course Selection Functions
    function toggleCourseSelection(checkbox, courseCode, courseTime) {
        const courseElement = checkbox.closest('li');
        
        if (checkbox.checked) {
            // Try to add course to timetable
            const success = addCourseToTimetable(courseElement);
            
            // If adding failed (due to overlap or other issues), uncheck the checkbox
            if (!success) {
                checkbox.checked = false;
                showOverlapWarning();
            } else {
                // Add to favorites section when successfully added to timetable
                const favoritesUl = document.querySelector('#favorites ul');
                if (favoritesUl && !favoritesUl.querySelector(`[data-course-code="${courseCode}"]`)) {
                    const template = document.getElementById('favorite-item-template');
                    const favoriteItem = template.content.firstElementChild.cloneNode(true);
                    
                    // Copy attributes from course element
                    ['data-course-code', 'data-course-time', 'data-course-name', 'data-course-room'].forEach(attr => {
                        favoriteItem.setAttribute(attr, courseElement.getAttribute(attr));
                    });
                    
                    // Set content
                    favoriteItem.querySelector('h4').textContent = courseElement.querySelector('h4').textContent;
                    favoriteItem.querySelector('p').textContent = courseElement.querySelector('p').textContent;
                    
                    // Set checkbox state
                    const favoriteCheckbox = favoriteItem.querySelector('.course-checkbox');
                    favoriteCheckbox.checked = true;
                    
                    // Add to favorites
                    favoritesUl.appendChild(favoriteItem);
                }
            }
        } else {
            // Remove course from timetable
            removeCourseFromTimetable(courseCode, courseTime);
            
            // Remove from favorites section
            const favoritesUl = document.querySelector('#favorites ul');
            if (favoritesUl) {
                const favoriteItem = favoritesUl.querySelector(`[data-course-code="${courseCode}"]`);
                if (favoriteItem) {
                    favoriteItem.remove();
                }
            }
        }
    }

    // Filter Functions
    function applyFilters() {
        const campus = document.getElementById('campus').value;
        const semesterYear = document.getElementById('semester_year').value;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/change_filters';

        const campusInput = document.createElement('input');
        campusInput.type = 'hidden';
        campusInput.name = 'campus';
        campusInput.value = campus;
        form.appendChild(campusInput);

        const semesterInput = document.createElement('input');
        semesterInput.type = 'hidden';
        semesterInput.name = 'semester_year';
        semesterInput.value = semesterYear;
        form.appendChild(semesterInput);

        document.body.appendChild(form);
        form.submit();
    }

    // Expose functions
    window.timetableModule = {
        addCourseToTimetable,
        removeCourseFromTimetable,
        isAddedCourse: (courseKey) => addedCourses.has(courseKey),
        showCourseShadow,
        removeCourseShadow,
        applyFilters,
        toggleCourseSelection
    };

    // Expose necessary functions globally for HTML onclick handlers
    window.toggleCourseSelection = toggleCourseSelection;

    // Handle window resize
    window.addEventListener('resize', () => {
        const addedCoursesList = Array.from(addedCourses);
        addedCoursesList.forEach(courseKey => {
            const [courseCode, courseTime] = courseKey.split('_');
            const courseElement = document.querySelector(`[data-course-code="${courseCode}"][data-course-time="${courseTime}"]`);
            if (courseElement) {
                removeCourseFromTimetable(courseCode, courseTime);
                addCourseToTimetable(courseElement);
            }
        });
    });
});