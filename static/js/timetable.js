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
        const crn = courseElement.getAttribute('data-course-crn');
    
        // Skip overlap check if there are no existing courses
        const existingBlocks = document.querySelectorAll('.course-block');
        let hasOverlap = false;
    
        if (existingBlocks.length > 0) {
            const { hasOverlap: overlap } = checkCourseOverlap(courseTime, crn);
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
        if (!courseColorMap[crn]) {
            courseColorMap[crn] = courseColors[courseCounter % courseColors.length];
            courseCounter++;
        }
    
        const courseColor = courseColorMap[crn];
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
                
                // Store all necessary data attributes
                courseBlock.setAttribute('data-course-crn', crn);
                courseBlock.setAttribute('data-course-code', courseCode);
                courseBlock.setAttribute('data-course-time', courseTime);
                courseBlock.setAttribute('data-course-name', courseName);
                courseBlock.setAttribute('data-course-room', courseRoom);
                courseBlock.setAttribute('data-day', day);
                courseBlock.setAttribute('data-start-hour', startHour);
                courseBlock.setAttribute('data-end-hour', endHour);
    
                courseBlock.innerHTML = `
                    <div class="course-block-content cursor-pointer p-2">
                        <h4 class="font-bold text-sm text-white">${courseCode}</h4>
                        <p class="text-xs text-white">${courseRoom || ''}</p>
                        <button class="remove-course-btn absolute top-1 right-1 text-white hover:text-red-300">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
    
                // Add hover effect to show remove button
                courseBlock.addEventListener('mouseenter', () => {
                    courseBlock.querySelector('.remove-course-btn').classList.remove('hidden');
                });
                courseBlock.addEventListener('mouseleave', () => {
                    courseBlock.querySelector('.remove-course-btn').classList.add('hidden');
                });

                // Add click handler for the entire block
                courseBlock.querySelector('.course-block-content').addEventListener('click', () => {
                    showCourseDetails(courseBlock);
                });

                document.querySelector('#schTimes').appendChild(courseBlock);
            });
        });

        return true;
    }

    function removeCourseFromTimetable(courseCode, courseTime, crn) {
        // Force remove all blocks with matching CRN
        const blocks = document.querySelectorAll(`.course-block[data-course-crn="${crn}"]`);
        if (blocks.length > 0) {
            blocks.forEach(block => {
                block.classList.add('fade-out');
                setTimeout(() => block.remove(), 300);
            });
            addedCourses.delete(crn);
            
            // Use the courseSelectionModule to update checkboxes and state
            if (window.courseSelectionModule) {
                window.courseSelectionModule.removeFromSelected(crn);
            }
            
            // Save the updated state
            if (window.saveTimetableState) {
                window.saveTimetableState();
            }
            
            return true;
        }
        return false;
    }

    // Add CSS for animation
    const style = document.createElement('style');
    style.textContent = `
        .course-block {
            transition: all 0.3s ease-out;
        }
        .fade-out {
            opacity: 0;
            transform: scale(0.95);
        }
        .remove-course-btn {
            transition: opacity 0.2s ease-in-out;
        }
    `;
    document.head.appendChild(style);

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

    // Enhanced time parsing functions
    function parseTimeSlots(courseTime) {
        if (!courseTime) return [];
        
        const slots = [];
        // Handle course time and lab time separately if there's a "/"
        const timeComponents = courseTime.split('/');
        
        timeComponents.forEach(component => {
            const [days, time] = component.trim().split(' ');
            if (!time) return;

            const [startTime, endTime] = time.split('-');
            const daysArray = days.match(/[MTWRHF]/g) || [];
            
            daysArray.forEach(day => {
                slots.push({
                    day,
                    start: convertTimeToMinutes(startTime),
                    end: convertTimeToMinutes(endTime)
                });
            });
        });

        return slots;
    }

    function convertTimeToMinutes(time) {
        if (!time) return 0;
        
        const [hours, minutes] = time.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;
        
        // Handle PM times if in 12-hour format
        if (time.toLowerCase().includes('pm') && hours !== 12) {
            totalMinutes += 12 * 60;
        }
        // Handle 12 AM case
        if (time.toLowerCase().includes('am') && hours === 12) {
            totalMinutes -= 12 * 60;
        }
        
        return totalMinutes;
    }

    function extractDays(courseTime) {
        if (!courseTime) return [];
        
        const daysPattern = /([MTWRHF]+)/g;
        return (courseTime.match(daysPattern) || []).map(days => days.toUpperCase());
    }

    // Course Overlap Functions
    function checkCourseOverlap(courseTime, excludeCourseKey) {
        const overlappingCourses = [];
        const timeSlots = parseTimeSlots(courseTime);

        document.querySelectorAll('.course-block').forEach(block => {
            if (block.dataset.courseCrn === excludeCourseKey) return;
            
            const blockTimeSlots = parseTimeSlots(block.dataset.courseTime);
            if (hasTimeSlotOverlap(timeSlots, blockTimeSlots)) {
                overlappingCourses.push(block.dataset.courseCrn);
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
    function toggleCourseSelection(checkbox, courseCode, courseTime, crn) {
        if (checkbox.checked) {
            // Add course to timetable
            const courseElement = checkbox.closest('li');
            if (!courseElement) {
                checkbox.checked = false;
                return;
            }
            
            const success = addCourseToTimetable(courseElement);
            if (!success) {
                checkbox.checked = false;
                return;
            }
            addedCourses.add(crn);
            
            // Update all related checkboxes
            const relatedCheckboxes = document.querySelectorAll(`input[type="checkbox"][data-course-code="${courseCode}"][data-course-crn="${crn}"]`);
            relatedCheckboxes.forEach(cb => {
                if (cb !== checkbox) {
                    cb.checked = true;
                }
            });
        } else {
            // Remove course from timetable
            const removed = removeCourseFromTimetable(courseCode, courseTime, crn);
            if (removed) {
                addedCourses.delete(crn);
                
                // Force update all related checkboxes, including those in favorites
                const allCheckboxes = document.querySelectorAll(`input[type="checkbox"][data-course-code="${courseCode}"]`);
                allCheckboxes.forEach(cb => {
                    cb.checked = false;
                });
                
                // Remove from favorites if present
                const favoritesUl = document.querySelector('.favorites-section ul');
                if (favoritesUl) {
                    const favoriteLi = favoritesUl.querySelector(`li[data-course-code="${courseCode}"]`);
                    if (favoriteLi) {
                        favoriteLi.remove();
                    }
                }
            } else {
                // If removal failed, recheck the checkbox
                checkbox.checked = true;
            }
        }
        
        // Save the updated state
        if (window.saveTimetableState) {
            window.saveTimetableState();
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
        isAddedCourse: (crn) => addedCourses.has(crn),
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
        addedCoursesList.forEach(crn => {
            const courseElement = document.querySelector(`[data-course-crn="${crn}"]`);
            if (courseElement) {
                const courseCode = courseElement.getAttribute('data-course-code');
                const courseTime = courseElement.getAttribute('data-course-time');
                removeCourseFromTimetable(courseCode, courseTime, crn);
                addCourseToTimetable(courseElement);
            }
        });
    });

    // Add event delegation for remove buttons
    document.getElementById('schTimes').addEventListener('click', function(e) {
        if (e.target.closest('.remove-course-btn')) {
            const courseBlock = e.target.closest('.course-block');
            if (courseBlock) {
                const courseCode = courseBlock.getAttribute('data-course-code');
                const courseTime = courseBlock.getAttribute('data-course-time');
                const crn = courseBlock.getAttribute('data-course-crn');
                if (courseCode && courseTime && crn) {
                    removeCourseFromTimetable(courseCode, courseTime, crn);
                }
            }
        }
    });
});