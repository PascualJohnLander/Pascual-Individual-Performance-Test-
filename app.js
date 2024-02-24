const express = require('express');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

const app = express();

mongoose.connect('mongodb://localhost:27017/lander-mongo', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const courseSchema = new mongoose.Schema({
    code: String,
    description: String,
    units: Number,
    tags: [String]
});


const Course = mongoose.model('Course', courseSchema);

// Middleware
app.use(express.json());

app.get('/courses', async (req, res) => {
    try {
        // Retrieve all courses from the database
        const allCourses = await Course.find();

        // Iterate over each course and sort arrays alphabetically by description
        allCourses.forEach(course => {
            Object.entries(course).forEach(([fieldName, fieldValue]) => {
                if (Array.isArray(fieldValue) && fieldValue.length > 0 && typeof fieldValue[0] === 'object' && 'description' in fieldValue[0]) {
                    course[fieldName] = fieldValue.sort((a, b) => a.description.localeCompare(b.description));
                }
            });
        });

        // Send the sorted courses in the response
        res.send(allCourses);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// Route to get courses by query using BSIS or BSIT
app.get('/courses/:query', async (req, res) => {
    const query = req.params.query;

    // Validate the query parameter
    if (query !== 'BSIS' && query !== 'BSIT') {
        return res.status(400).send('Invalid Course.');
    }

    try {
        const allCourses = await Course.find();

        let coursesArray = [];

        // Iterate over each course and concatenate arrays containing courses into coursesArray
        allCourses.forEach(course => {
            const courseArrays = Object.values(course.toObject()).filter(Array.isArray);
            coursesArray = coursesArray.concat(...courseArrays);
        });

        // Filter courses based on the query
        const filteredCourses = coursesArray.filter(course =>
            course.tags.includes(query) &&
            (course.tags.includes('BSIS') || course.tags.includes('BSIT'))
        );

        const coursesExtract = filteredCourses.map(course => ({
            name: course.code,
            specialization: course.description
        }));

        res.send(coursesExtract);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(PORT, async () => {
    try {
        console.log(`Server is running on port ${PORT}`);
    } catch (err) {
        console.error('Error populating initial data:', err);
    }
});