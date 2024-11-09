import express from 'express';
import {Module} from "../models/Module.js";
import {User} from "../models/User.js"
import {authMiddleware} from "../middleware/auth.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/", async (req, res) => {

    try {
        const Task = await Module.find();
        console.log(Task)
        if (!Task) {
            return res.status(401).json({ message: 'No modules found' })
        }
        res.json({
            message: "Successfully retrieved documents",
            data: Task
        });
        // Send a success message or some metadata
        console.log(Task)
    } catch (e) {
        //console.error("Error connecting to MongoDB collection:", e);
        res.status(500).send("Failed to connect to MongoDB collection: " + e.message);
    }
});

router.get('/myGroups', authMiddleware, asyncHandler(async (req, res) => {
    try {
        // Get the current user with their joinedGroups
        const user = await User.findById(req.user._id)
            .select("joinedGroups")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If user has no joined groups, return empty array
        if (!user.joinedGroups || user.joinedGroups.length === 0) {
            return res.json({
                success: true,
                message: "No groups joined",
                groups: []
            });
        }

        // Fetch all groups that the user has joined
        const userGroups = await Module.find({
            groupId: { $in: user.joinedGroups }
        }).lean();

        res.json({
            success: true,
            message: "Successfully retrieved user's groups",
            groups: userGroups
        });

    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user groups',
            error: error.message
        });
    }
}));

    router.get("/name/:displayName", async (req, res) => {
        const { displayName } = req.params;
        try {
            const Task = await User.find({displayName: displayName});
            if (!Task) {
                return res.status(401).json({ message: 'No modules found' })
            }
            res.json({
                message: "Successfully retrieved documents",
                data: Task
            });
            // Send a success message or some metadata
        } catch (e) {
            //console.error("Error connecting to MongoDB collection:", e);
            res.status(500).send("Failed to connect to MongoDB collection: " + e.message);
        }
    });

router.get('/:groupId', async (req, res) => {
    const { groupId } = req.params; // Retrieve groupId from URL parameters
    try {
        // Find all modules that match the provided groupId
        const modules = await Module.find({ groupId: groupId });
        
        if (!modules || modules.length === 0) {
            return res.status(404).json({ message: 'No modules found for the specified group ID' });
        }
        // Return the found modules as a JSON response
        res.json({
            message: "Successfully retrieved documents",
            data: modules
        });
    } catch (error) {
        console.error("Error fetching modules by groupId:", error);
        res.status(500).json({ message: "Failed to fetch modules by groupId", error: error.message });
    }
});


router.post("/add", async (req, res) => {
    console.log(req.body)
    try {
        
        const { groupId, groupName, moduleName, teamMembers, taskList } = req.body;
        
        // Check if all required fields are provided
        // if (!moduleName || !groupName || !teamMembers) {
        //     return res.status(400).json({ message: 'All fields are required' });
        // }
        const allGroups = await Module.find({}, 'groupId'); // Fetch only the `_id` field
        const existingGroupIds = allGroups.map(group => group.groupId.toString());
        console.log(existingGroupIds)
        // Step 2: Generate a unique group ID
        let newGroupId;
        do {
            newGroupId = (Math.floor(Math.random() * 100) + 1).toString(); // Adjust the range as needed
        } while (existingGroupIds.includes(newGroupId));


        // Create a new document in MongoDB
        const newModule = new Module({
            groupId:newGroupId,
            groupName,
            moduleName,
            teamMembers,
            taskList
        });

        const savedModule = await newModule.save();
        res.status(201).json({
            message: "Successfully added new module",
            data: newGroupId
        });
    } catch (e) {
        console.error("Error adding new module:", e);
        res.status(500).send("Failed to add new module: " + e.message);
    }
});

export default router;
