# ORESS - Online Registration and Enrollment System for Students

ORESS is a web-based application designed to streamline the course registration and timetable management process for students. It provides an intuitive interface for searching courses, building schedules, and managing academic planning.

## Features

- **Interactive Timetable**: Visual representation of your course schedule
- **Course Search**: Find courses by code, name, or instructor
- **Multi-Campus Support**: Switch between different campus locations
- **Semester Selection**: View courses from different semesters (Fall, Spring, Summer)
- **PDF Export**: Download your timetable as a PDF
- **Favorites**: Save your preferred courses for quick access

## Technology Stack

- **Backend**: Python with Flask framework
- **Database**: MySQL
- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Authentication**: Flask session management

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/ORESS.git
   cd ORESS
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   # Update database credentials and other settings
   ```

5. Initialize the database:
   ```
   # Make sure your MySQL server is running
   # Create the necessary databases and tables
   # Import course data if available
   ```

6. Run the application:
   ```
   python app.py
   ```

7. Access the application at `http://localhost:5000`

## Project Structure

- `app.py`: Main application entry point
- `static/`: Static assets (JavaScript, CSS, images)
  - `js/`: JavaScript files for frontend functionality
  - `css/`: Stylesheets
  - `backend/`: Backend Python modules
    - `routes/`: Flask route definitions
    - `mysql/`: Database connection and query functions
    - `utils/`: Utility functions
- `templates/`: HTML templates
- `.env.example`: Example environment configuration
- `.gitignore`: Git ignore file

## Usage

1. Log in to the system
2. Select your campus and semester
3. Search for courses using the search bar
4. Click on courses to view details
5. Check the checkbox to add a course to your timetable
6. View your complete schedule in the timetable view
7. Download your timetable as a PDF if needed

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

[MIT License](LICENSE)

## Contact

For questions or support, please contact [your-email@example.com](mailto:kamouhkristen@outlook.com)
