import {User} from "../models/User.js";
import jwt from "jsonwebtoken";
import {ChatRoom} from "../models/ChatRoom.js";
import {ChatMessage} from "../models/ChatMessage.js";

/*const router = express.Router();*/

export default async function messagesHandler(io) {
    if (!io) {
        console.error('Socket.IO instance is required');
        return;
    }
    var generalHistory = [];

    //find general chat room first create if none
    var generalChat = await ChatRoom.findOne({name: "general"})
    if (!generalChat) {
        try {
            generalChat = new ChatRoom({name: "general", description: "Talk to everyone!"})
            await generalChat.save()
        } catch (e) {
            console.error('GeneralChat', e);
        }
    }

    //find general history
    generalHistory = await ChatMessage.find({saidIn: "general"})

    io.on('connection', (socket) => {
        console.log('A user connected');

        // Join the general room
        socket.join(generalChat.name);

        // Send last 50 messages to newly connected user
        socket.emit('previous-messages', generalHistory);

        socket.on('chat-message', (message) => {
            const token = socket.handshake.headers.cookie
                ?.split('; ')
                .find(row => row.startsWith('token='))
                ?.split('=')[1];
            if (!token) {
                socket.emit('chat-noauth-error', {
                    message: 'Authentication required. Please log in.'
                });
                return;
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            User.findOne({userName: decoded.userName}).select('-password').then((user) => {
                if (!user) {
                    socket.emit('chat-nouser-error', {
                        message: 'Authentication required. Please log in.'
                    });
                    return;
                }
                let chatMessage = new ChatMessage({saidBy: user._id, displayName:user.displayName, saidIn: generalChat.name, message: message.message})
                chatMessage.save().then(result => {
                    const messageData = {
                        id: Date.now(),
                        message: message.message,
                        displayName: user.displayName || 'Anonymous',
                        createdAt: new Date().toISOString()
                    };
                    // Store message in history (keep last 50 messages)
                    generalHistory.push(messageData);
                    if (generalHistory.length > 50) {
                        generalHistory.shift();
                    }

                    // Broadcast to general room
                    io.to(generalChat.name).emit('new-message', messageData);
                });
            })
        });
    });
}

/*export default router;*/
