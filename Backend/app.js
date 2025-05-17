const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const os = require('os');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
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
const bookmarkRoutes = require('./routes/bookmarks.routes.js');

// New routes
const communityRoutes = require('./routes/community.routes.js');
const blogRoutes = require('./routes/blog.routes.js');
const notificationRoutes = require('./routes/notifications.routes.js');
const settingsRoutes = require('./routes/settings.routes.js');

dotenv.config();

const app = express();
const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocket.Server({
    server,
    path: '/ws/community/chat/:id',
    verifyClient: (info, callback) => {
        try {
            // Extract token from URL
            const url = new URL(info.req.url, 'ws://localhost');
            const token = url.searchParams.get('token');
            const roomId = url.pathname.split('/').pop();

            if (!token) {
                console.error('No token provided');
                callback(false, 401, 'Authentication required');
                return;
            }

            if (!roomId) {
                console.error('No room ID provided');
                callback(false, 400, 'Room ID required');
                return;
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            info.req.userId = decoded.user_id;
            info.req.roomId = roomId;
            callback(true);
        } catch (error) {
            console.error('WebSocket authentication error:', error);
            callback(false, 401, 'Authentication failed');
        }
    }
});

// Store active connections
const clients = new Map();

// WebSocket connection handler
wss.on('connection', async (ws, req) => {
    const userId = req.userId;
    const roomId = req.roomId;
    console.log(`WebSocket client connected: ${userId} to room ${roomId}`);

    // Store the connection with room information
    clients.set(userId, { ws, roomId });

    // Handle messages
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received WebSocket message:', data);

            switch (data.type) {
                case 'join':
                    // Handle room join
                    console.log(`User ${userId} joined room ${roomId}`);

                    // Notify others in the room
                    broadcastToRoom(roomId, {
                        type: 'member_joined',
                        data: {
                            user_id: userId,
                            room_id: roomId
                        }
                    });
                    break;

                case 'message':
                    // Broadcast message to all users in the room
                    const messageData = {
                        type: 'new_message',
                        data: {
                            ...data.data,
                            timestamp: new Date().toISOString(),
                            user_id: userId
                        }
                    };
                    console.log('Broadcasting message:', messageData);
                    broadcastToRoom(roomId, messageData);
                    break;

                case 'typing_start':
                case 'typing_end':
                    // Broadcast typing status to room
                    broadcastToRoom(roomId, {
                        ...data,
                        data: {
                            ...data.data,
                            user_id: userId
                        }
                    });
                    break;

                default:
                    console.warn('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid message format' }
            }));
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${userId} from room ${roomId}`);
        broadcastToRoom(roomId, {
            type: 'member_left',
            data: {
                user_id: userId,
                room_id: roomId
            }
        });
        clients.delete(userId);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
    });
});

// Helper function to broadcast to room
function broadcastToRoom(roomId, message) {
    let sentCount = 0;
    clients.forEach((client, userId) => {
        if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
                sentCount++;
            } catch (error) {
                console.error(`Error sending message to user ${userId}:`, error);
            }
        }
    });
    console.log(`Broadcasted message to ${sentCount} clients in room ${roomId}`);
}

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Enable CORS for WebSocket
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Existing routes
app.use('/api/user', userRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/program', programRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/scholarship', scholarshipRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Test route
app.use('/api/test', testRoutes);

// New routes
app.use('/api/community', communityRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Function to get the local IP address
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    let ipAddress = 'localhost';

    // Loop through network interfaces
    Object.keys(interfaces).forEach((interfaceName) => {
        const addresses = interfaces[interfaceName];

        if (!addresses) return;

        // Find IPv4 addresses that are not internal (127.0.0.1) or link-local (169.254.x.x)
        addresses.forEach((address) => {
            if (
                address.family === 'IPv4' &&
                !address.internal &&
                !address.address.startsWith('169.254.')
            ) {
                ipAddress = address.address;
            }
        });
    });

    return ipAddress;
}

const PORT = process.env.PORT || 3000;
const localIp = getLocalIpAddress();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Accessible at:`);
    console.log(`- http://localhost:${PORT} (Local)`);
    console.log(`- http://${localIp}:${PORT} (Network)`);
});
