"""


"""

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
    days_part = ''.join([char for char in time_str if char.isalpha() or char == ' '])
    time_part = ''.join([char for char in time_str if char.isdigit() or char in [':', '-']])

    days = parse_days(days_part.strip()) if days_part.strip() else []

    if '-' in time_part:
        time_parts = time_part.split('-')
        start_time = time_parts[0].strip()
        end_time = time_parts[1].strip()

        start_time = start_time[:-3] if start_time.endswith(':00') else start_time
        end_time = end_time[:-3] if end_time.endswith(':00') else end_time
    else:
        start_time, end_time = None, None

    return days, (start_time, end_time)