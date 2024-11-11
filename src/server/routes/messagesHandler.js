import {User} from "../models/User.js";
import jwt from "jsonwebtoken";
import {ChatRoom} from "../models/ChatRoom.js";
import {ChatMessage} from "../models/ChatMessage.js";
import {Group} from "../models/Group.js";
import mongoose from "mongoose";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_LENGTH = 50;

export default async function messagesHandler(io) {
    if (!io) {
        throw new Error('Socket.IO instance is required');
    }

    // Initialize default room
    const defaultRoom = await initializeDefaultRoom();

    io.on('connection', async (socket) => {
        console.log('User connected:', socket.id);

        try {
            const token = getTokenFromSocket(socket);
            const user = token ? await authenticateUser(token) : null;

            /*if (user) {
                // Always join default room
                await joinRoom(socket, defaultRoom._id, user._id);
            }*/

            // Handle room creation
            socket.on('create-room', async (roomData) => {
                console.log(roomData);
                try {
                    if (!user) throw new Error('Authentication required');
                    const { name, description } = roomData;
                    const room = await createRoom(socket, name, description, user._id);
                    await joinRoom(socket, room._id, user._id);
                } catch (error) {
                    handleError(socket, error);
                }
            });

            socket.on('create-room-group', async (roomData, groupId) => {
                console.log(roomData);
                try {
                    if (!user) throw new Error('Authentication required');
                    const { name, description } = roomData;
                    const groupUsers = await Group.findById(groupId);
                    const room = await createRoomGroup(socket, name, description, user._id, groupUsers._id);
                    for (const member of groupUsers.teamMembers) {
                        const thisUser = await User.find({displayName: member.name}).select('-password');
                        console.log(thisUser);
                        await joinRoomGroup(room._id, thisUser);
                    }
                } catch (error) {
                    handleError(socket, error);
                }
            });

            // Handle room joining
            socket.on('join-room', async (roomId) => {
                //if no roomID, try to get from cookie, if not, join default room
                if(!mongoose.Types.ObjectId.isValid(roomId))
                {
                    roomId = getRoomIdFromSocket(socket)
                    if(mongoose.Types.ObjectId.isValid(roomId))
                        roomId = await ChatRoom.findById(roomId).select('_id');
                    if(!mongoose.Types.ObjectId.isValid(roomId)) {
                        roomId = await ChatRoom.findOne({type: 'default'}).select('_id');
                        roomId = roomId._id
                    }
                    console.log(roomId)
                }
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

            // TODO: Handle group room joining
            socket.on('join-room-group', async (roomId) => {
                try {
                    if (!user) throw new Error('Authentication required');
                    /*if (!mongoose.Types.ObjectId.isValid(roomId)) {
                        throw new Error('Invalid room ID');
                    }*/
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
                    if (!mongoose.Types.ObjectId.isValid(roomId)) {
                        throw new Error('Invalid room ID');
                    }
                    await handleNewMessage(socket, io, message, roomId, user);
                } catch (error) {
                    handleError(socket, error);
                }
            });

            socket.on('profile-updated', async (userId) => {
                try {
                    // Fetch updated user data
                    const updatedUser = await User.findById(userId).select('displayName profilePic');
                    if (!updatedUser) return;

                    // Create update notification
                    const updateData = {
                        userId: updatedUser._id,
                        displayName: updatedUser.displayName,
                        profilePic: updatedUser.profilePic
                    };

                    // Broadcast to all rooms
                    io.emit('user-profile-updated', updateData);
                } catch (error) {
                    handleError(socket, error);
                }
            });

            socket.on('get-all-rooms', async(userId) => {
                const rooms = await getAllRoomsOfCurrentUser(userId);
                socket.emit('get-all-rooms', rooms);
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


    async function getAllRoomsOfCurrentUser(userId) {
        const user = await User.findById(userId);

        return await ChatRoom.find({'_id': {$in: user.joinedChatrooms}}).lean();
    }

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
        return defaultRoom;
    }

    async function findAvailableName(baseName, counter = 1) {
        const testName = counter === 1 ? baseName : `${baseName}${counter}`;
        const existingRoom = await ChatRoom.findOne({ name: testName });

        if (!existingRoom) {
            return testName;
        }

        return findAvailableName(baseName, counter + 1);
    }

    async function createRoom(socket, name, description, userId) {
        let finalName =  await findAvailableName(name);

        try {
            const room = new ChatRoom({
                name: finalName,
                description: description,
                creator: userId,
                users: [userId],
                isDefault: false
            });

            await room.save();

            // Notify all users about new room
            /*io.emit('room-created', {
                _id: room._id,
                name: room.name,
                description: room.description,
                creator: userId
            });*/

            return room;
        } catch (e) {
            throw e;
        }
    }
    async function createRoomGroup(socket, name, description, userId, groupId) {
        let finalName =  await findAvailableName(name);

        try {
            const room = new ChatRoom({
                name: finalName,
                description: description,
                type: 'group',
                creator: userId,
                users: [userId],
                isDefault: false
            });

            await room.save();

            // Notify all users about new room
            /*io.emit('room-created', {
                _id: room._id,
                name: room.name,
                description: room.description,
                creator: userId
            });*/

            return room;
        } catch (e) {
            throw e;
        }
    }

    async function joinRoom(socket, roomId, userId) {
        const room = await ChatRoom.findById(roomId);
        const user = await User.findById(userId).select('-password');
        if (!room) {
            throw new Error('Room not found');
        }

        // Add user to room if not already in it
        if (!room.users.includes(user._id)) {
            room.users.push(user._id);
            await room.save();
        }
        if(!user.joinedChatrooms.includes(room._id)) {
            user.joinedChatrooms.push(room._id);
            await user.save();
        }

        // Join socket room
        socket.join(roomId.toString());

        // Send room-info to socket
        socket.emit('room-info', {
            _id: room._id,
            name: room.name,
            description: room.description,
        });

        // Send room history
        const history = await loadRoomHistory(room._id);
        socket.emit('previous-messages', { roomId, messages: history });

        // Notify room about new user
        io.to(roomId.toString()).emit('user-joined', {
            roomId,
            user: user.displayName
        });

        socket.emit('set-roomid-cookie', roomId);
    }

    async function joinRoomGroup(roomId, userId) {
        const room = await ChatRoom.findById(roomId);
        const user = await User.findById(userId).select('-password');
        if (!room) {
            throw new Error('Room not found');
        }
        // Add user to room if not already in it
        if (!room.users.includes(user._id)) {
            room.users.push(user._id);
            await room.save();
        }
        if(!user.joinedChatrooms.includes(room._id)) {
            user.joinedChatrooms.push(room._id);
            await user.save();
        }


        io.emit('server-refresh-rooms');

        // Join socket room
        /*socket.join(roomId.toString());

        // Send room-info to socket
        socket.emit('room-info', {
            _id: room._id,
            name: room.name,
            description: room.description,
        });*/

        // Send room history
        // const history = await loadRoomHistory(room._id);
        // socket.emit('previous-messages', { roomId, messages: history });

        // Notify room about new user
        /*io.to(roomId.toString()).emit('user-joined', {
            roomId,
            user: user.displayName
        });*/

        // socket.emit('set-roomid-cookie', roomId);
    }

    async function leaveRoom(socket, roomId, userId) {
        // Find room and user
        const room = await ChatRoom.findById(roomId);
        const user = await User.findById(userId).select('-password');

        if (!room) {
            throw new Error('Room not found');
        }

        // Remove user from room array (if present)
        if (room.users.includes(user._id)) {
            room.users = room.users.filter(id => id.toString() !== user._id.toString());
            await room.save();
        }

        // Remove room from user's joinedChatrooms (if present)
        if (user.joinedChatrooms.includes(room._id)) {
            user.joinedChatrooms = user.joinedChatrooms.filter(
                id => id.toString() !== room._id.toString()
            );
            await user.save();
        }

        // Leave socket room
        socket.leave(roomId.toString());

        // Notify room about user leaving
        io.to(roomId.toString()).emit('user-left', {
            roomId,
            user: user.displayName
        });

        // If room is empty and not default or group, cleanup
        if (room.users.length === 0 && room.type !== 'default' && room.type !== 'group') {
            await cleanupRoom(roomId);
        }

        // Find and join the default room
        const defaultRoom = await ChatRoom.findOne({ type: 'default' });
        if (!defaultRoom) {
            throw new Error('Default room not found');
        }

        // Join the default room using the existing joinRoom function
        await joinRoom(socket, defaultRoom._id, user._id);
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

        // Always fetch fresh user data
        const currentUser = await User.findById(user._id).select('displayName profilePic');

        const messageData = {
            _id: chatMessage._id,
            message: chatMessage.message,
            saidBy: {
                _id: currentUser._id,
                displayName: currentUser.displayName,
                profilePic: currentUser.profilePic
            },
            createdAt: chatMessage.createdAt.toISOString(),
            roomId: roomId.toString()
        };
        // Broadcast to room
        io.to(roomId.toString()).emit('new-message', messageData);
    }

    async function loadRoomHistory(roomId) {
        return await ChatMessage.find({ saidIn: roomId })
            .sort({ createdAt: -1 })
            .limit(MAX_HISTORY_LENGTH)
            .populate('saidBy', 'displayName profilePic')
            .sort({ createdAt: 1 })
            .lean()
            .then(messages => messages.map(msg => ({
                _id: msg._id,
                message: msg.message,
                saidBy: {
                    _id: msg.saidBy._id,
                    displayName: msg.saidBy.displayName,
                    profilePic: msg.saidBy.profilePic
                },
                createdAt: msg.createdAt.toISOString(),
                roomId: msg.saidIn.toString()
            })));
    }

    async function cleanupRoom(roomId) {
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

    function getRoomIdFromSocket(socket) {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) return null;

        const tokenCookie = cookies
            .split('; ')
            .find(row => row.startsWith('roomId='));

        return tokenCookie ? tokenCookie.split('=')[1] : null;
    }
}