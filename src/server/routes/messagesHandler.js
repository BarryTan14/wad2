import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { ChatRoom } from "../models/ChatRoom.js";
import { ChatMessage } from "../models/ChatMessage.js";
import mongoose from "mongoose";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_LENGTH = 50;

export default async function messagesHandler(io) {
    if (!io) {
        throw new Error('Socket.IO instance is required');
    }

    // Track room histories using room IDs
    const roomHistories = new Map();

    // Initialize default room
    const defaultRoom = await initializeDefaultRoom();

    io.on('connection', async (socket) => {
        console.log('User connected:', socket.id);

        try {
            const token = getTokenFromSocket(socket);
            const user = token ? await authenticateUser(token) : null;

            if (user) {
                // Always join default room
                await joinRoom(socket, defaultRoom._id, user._id);
            }

            // Handle room creation
            socket.on('create-room', async (roomData) => {
                try {
                    if (!user) throw new Error('Authentication required');
                    const { name, description } = roomData;
                    const room = await createRoom(socket, name, description, user._id);
                    await joinRoom(socket, room._id, user._id);
                } catch (error) {
                    handleError(socket, error);
                }
            });

            // Handle room joining
            socket.on('join-room', async (roomId) => {
                try {
                    if (!user) throw new Error('Authentication required');
                    if (!mongoose.Types.ObjectId.isValid(roomId)) {
                        throw new Error('Invalid room ID');
                    }
                    await joinRoom(socket, roomId, user._id);
                } catch (error) {
                    handleError(socket, error);
                }
            });

            // Handle room leaving
            socket.on('leave-room', async (roomId) => {
                try {
                    if (!user) throw new Error('Authentication required');
                    if (!mongoose.Types.ObjectId.isValid(roomId)) {
                        throw new Error('Invalid room ID');
                    }
                    if (roomId.toString() === defaultRoom._id.toString()) {
                        throw new Error('Cannot leave default room');
                    }
                    await leaveRoom(socket, roomId, user._id);
                } catch (error) {
                    handleError(socket, error);
                }
            });

            // Handle chat messages
            socket.on('chat-message', async (messageData) => {
                try {
                    if (!user) throw new Error('Authentication required');
                    const { roomId, message } = messageData;
                    console.log(messageData);
                    if (!mongoose.Types.ObjectId.isValid(roomId)) {
                        throw new Error('Invalid room ID');
                    }
                    await handleNewMessage(socket, io, message, roomId, user);
                } catch (error) {
                    handleError(socket, error);
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });

        } catch (error) {
            handleError(socket, error);
        }
    });

    // Room Management Functions
    async function initializeDefaultRoom() {
        let defaultRoom = await ChatRoom.findOne({ type: 'default' });
        if (!defaultRoom) {
            defaultRoom = new ChatRoom({
                name: 'General',
                description: 'Talk to everyone!',
                type: 'default'
            });
            await defaultRoom.save();
        }

        const history = await loadRoomHistory(defaultRoom._id);
        roomHistories.set(defaultRoom._id.toString(), history);
        return defaultRoom;
    }

    async function createRoom(socket, name, description, userId) {
        const room = new ChatRoom({
            name,
            description,
            creator: userId,
            users: [userId],
            isDefault: false
        });

        await room.save();
        roomHistories.set(room._id.toString(), []);

        // Notify all users about new room
        io.emit('room-created', {
            _id: room._id,
            name: room.name,
            description: room.description,
            creator: userId
        });

        return room;
    }

    async function joinRoom(socket, roomId, userId) {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        // Add user to room if not already in it
        if (!room.users.includes(userId)) {
            room.users.push(userId);
            await room.save();
        }

        // Join socket room
        socket.join(roomId.toString());

        // Send room-info to socket
        socket.emit('room-info', {
            _id: room._id,
            name: room.name,
            description: room.description,
        });

        // Initialize room history if not exists
        if (!roomHistories.has(roomId.toString())) {
            const history = await loadRoomHistory(roomId);
            roomHistories.set(roomId.toString(), history);
        }

        // Send room history
        const history = roomHistories.get(roomId.toString()) || [];
        socket.emit('previous-messages', { roomId, messages: history });

        // Notify room about new user
        const user = await User.findById(userId).select('displayName');
        io.to(roomId.toString()).emit('user-joined', {
            roomId,
            user: user.displayName
        });
    }

    async function leaveRoom(socket, roomId, userId) {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        // Remove user from room
        room.users = room.users.filter(id => id.toString() !== userId.toString());
        await room.save();

        // Leave socket room
        socket.leave(roomId.toString());

        // Notify room about user leaving
        const user = await User.findById(userId).select('displayName');
        io.to(roomId.toString()).emit('user-left', {
            roomId,
            user: user.displayName
        });

        // If room is empty and not default, cleanup
        if (room.users.length === 0 && !room.isDefault) {
            await cleanupRoom(roomId);
        }
    }

    async function handleNewMessage(socket, io, message, roomId, user) {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        if (!room.users.includes(user._id)) {
            throw new Error('Not a member of this room');
        }

        // Validate message length
        if (message.length > MAX_MESSAGE_LENGTH &&
            !['admin', 'moderator'].includes(user.role)) {
            throw new Error('Message exceeds maximum length');
        }

        // Create and save message
        const chatMessage = new ChatMessage({
            saidBy: user._id,
            saidIn: roomId,
            message: message,
            createdAt: new Date()
        });

        await chatMessage.save();

        const messageData = {
            _id: chatMessage._id,
            message: chatMessage.message,
            saidBy: {
                _id: user._id,
                displayName: user.displayName,
                profilePic: user.profilePic
            },
            createdAt: chatMessage.createdAt.toISOString(),
            roomId: roomId.toString()
        };

        // Update room history
        const history = roomHistories.get(roomId.toString()) || [];
        history.push(messageData);
        if (history.length > MAX_HISTORY_LENGTH) {
            history.shift();
        }
        roomHistories.set(roomId.toString(), history);

        // Broadcast to room
        io.to(roomId.toString()).emit('new-message', messageData);
    }

    async function loadRoomHistory(roomId) {
        const history = await ChatMessage.find({ saidIn: roomId })
            .sort({ createdAt: 1 })
            .limit(MAX_HISTORY_LENGTH)
            .populate('saidBy', 'displayName profilePic')
            .lean();
        return history.map(msg => ({
            _id: msg._id,
            message: msg.message,
            saidBy: {
                _id: msg.saidBy._id,
                displayName: msg.saidBy.displayName,
                profilePic: msg.saidBy.profilePic
            },
            createdAt: msg.createdAt.toISOString(),
            roomId: msg.saidIn.toString()
        }));
    }

    async function cleanupRoom(roomId) {
        // Remove room history
        roomHistories.delete(roomId.toString());

        // Remove room from database
        await ChatRoom.findByIdAndDelete(roomId);

        // Remove room messages
        await ChatMessage.deleteMany({ saidIn: roomId });

        // Notify all users about room removal
        io.emit('room-removed', { roomId });
    }

    // Helper Functions
    async function authenticateUser(token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId }).select('-password');
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    function handleError(socket, error) {
        const errorMap = {
            'Authentication required': 'chat-noauth-error',
            'User not found': 'chat-nouser-error',
            'Message exceeds maximum length': 'chat-maxlimit-error',
            'Room not found': 'chat-room-notfound-error',
            'Not a member of this room': 'chat-not-member-error',
            'Cannot leave default room': 'chat-cannot-leave-error',
            'Invalid room ID': 'chat-invalid-room-error'
        };

        const eventName = errorMap[error.message] || 'chat-error';
        socket.emit(eventName, { message: error.message });
        console.error(`Socket Error (${socket.id}):`, error.message);
    }

    function getTokenFromSocket(socket) {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) return null;

        const tokenCookie = cookies
            .split('; ')
            .find(row => row.startsWith('token='));

        return tokenCookie ? tokenCookie.split('=')[1] : null;
    }
}