const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/users.routes.js');
const institutionRoutes = require('./routes/institutions.routes.js');
const programRoutes = require('./routes/programs.routes.js');
const courseRoutes = require('./routes/courses.routes.js');
const scholarshipRoutes = require('./routes/scholarships.routes.js');
const enrollmentRoutes = require('./routes/enrollments.routes.js');
const reviewRoutes = require('./routes/reviews.routes.js');
const paymentRoutes = require('./routes/payments.routes.js');
const busRoutes = require('./routes/bus.routes.js');
const advisorRoutes = require('./routes/advisors.routes.js');
const faqRoutes = require('./routes/faq.routes.js');
const documentRoutes = require('./routes/documents.routes.js');
const feeRoutes = require('./routes/fees.routes.js');
const interviewRoutes = require('./routes/interviews.routes.js');
const testRoutes = require('./routes/test.routes.js');
const categoryRoutes = require('./routes/categories.routes.js');

// New routes
const communityRoutes = require('./routes/community.routes.js');
const blogRoutes = require('./routes/blog.routes.js');
const notificationRoutes = require('./routes/notifications.routes.js');
const settingsRoutes = require('./routes/settings.routes.js');

dotenv.config();

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Existing routes
app.use('/api/user', userRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/program', programRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/scholarship', scholarshipRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/categories', categoryRoutes);

// Test route
app.use('/api/test', testRoutes);

// New routes
app.use('/api/community', communityRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Accessible at http://localhost:${PORT} or http://192.168.1.9:${PORT}`);
});