"""


"""

from datetime import datetime

def get_current_semester():
    now = datetime.now()
    month = now.month
    year = now.year
    
    if 1 <= month < 6:    # January-May: Spring
        return 'Spring', year
    elif 6 <= month < 9:  # June-August: Summer
        return 'Summer', year
    else:                 # September-December: Fall
        return 'Fall', year


def parse_days(time_str):
    days_map = {
        'M': 'Mon',
        'T': 'Tue',
        'H': 'Thu',
        'W': 'Wed',
        'F': 'Fri'
    }

    days = []
    i = 0
    while i < len(time_str):
        if time_str[i] == 'T' and i + 1 < len(time_str) and time_str[i + 1] == 'H':
            days.append(days_map['H'])
            i += 1
        else:
            day = days_map.get(time_str[i], None)
            if day:
                days.append(day)
        i += 1

    return list(dict.fromkeys(days))

def parse_time_field(time_str):
    if '/' in time_str:
        # Split into course time and lab time
        course_time, lab_time = time_str.split('/')
        course_slots = _parse_single_time_field(course_time.strip())
        lab_slots = _parse_single_time_field(lab_time.strip())
        return course_slots + lab_slots
    else:
        return _parse_single_time_field(time_str)

def _parse_single_time_field(time_str):
    days_part = ''.join([char for char in time_str if char.isalpha() or char == ' '])
    time_part = ''.join([char for char in time_str if char.isdigit() or char in [':', '-']])

    days = parse_days(days_part.strip()) if days_part.strip() else []

    if '-' in time_part:
        time_parts = time_part.split('-')
        start_time = time_parts[0].strip()
        end_time = time_parts[1].strip()
        start_time = start_time[:-3] if start_time.endswith(':00') else start_time
        end_time = end_time[:-3] if end_time.endswith(':00') else end_time
        return [{'days': days, 'start_time': start_time, 'end_time': end_time}]
    return []