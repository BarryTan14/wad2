import express from 'express';
import {Task} from "../models/Task.js";

const router = express.Router();

router.get("/", async (req, res) => {

    try {
        const newTask = await Task.find();
        console.log(newTask)
        if (!newTask) {
            return res.status(401).json({ message: 'No tasks found' })
        }
        res.json({
            message: "Successfully retrieved documents",
            data: newTask
        });
        // Send a success message or some metadata
    } catch (e) {
        //console.error("Error connecting to MongoDB collection:", e);
        res.status(500).send("Failed to connect to MongoDB collection: " + e.message);
    }
});
//Get task by task Id
router.get('/:taskId', async (req, res) => {
    const { taskId } = req.params; // Retrieve groupId from URL parameters
    try {
        // Find all modules that match the provided groupId
        const Task = await Task.find({ taskId: taskId });
        
        if (!Task || Task.length === 0) {
            return res.status(404).json({ message: 'No task found for the specified module Id' });
        }
        // Return the found modules as a JSON response
        res.json({
            message: "Successfully retrieved documents",
            data: Task
        });
    } catch (error) {
        console.error("Error fetching modules by groupId:", error);
        res.status(500).json({ message: "Failed to fetch task by module Id", error: error.message });
    }
});

router.get('/getBy/:groupId', async (req, res) => {
    const { groupId } = req.params; // Retrieve groupId from URL parameters
    try {
        // Find all modules that match the provided groupId
        const tasks = await Task.find({ groupId: groupId });
        
        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ message: 'No tasks found for the specified group ID' });
        }
        // Return the found modules as a JSON response
        res.json({
            message: "Successfully retrieved documents",
            data: tasks
        });
    } catch (error) {
        console.error("Error fetching tasks by groupId:", error);
        res.status(500).json({ message: "Failed to fetch tasks by groupId", groupId });
    }
});
// router.get('/getByUser/:displayName', async (req, res) => {
//     const { displayName } = req.params; // Retrieve groupId from URL parameters
//     try {
//         // Find all modules that match the provided groupId
//         const tasks = await Task.find({ "membersInCharge.displayName": displayName });
//         if (!tasks || tasks.length === 0) {
//             return res.status(404).json({ message: 'No tasks found for the displayName' });
//         }
//         // Return the found modules as a JSON response
//         res.json({
//             message: "Successfully retrieved documents",
//             data: tasks
//         });
//     } catch (error) {
//         console.error("Error fetching tasks by displayName:", error);
//         res.status(500).json({ message: "Failed to fetch tasks by displayName", groupId });
//     }
// });

//update Task based on taskId
router.post('/updateBy/:taskId', async (req, res) => {
    const taskId = req.params.taskId;  // Get the MongoDB `_id` from the URL
    console.log(req.body)
    try {
        // Destructure and rename fields to match the schema
        const { taskName, membersInCharge, deadline, status } = req.body;

        // Check if all required fields are provided
        // if (!taskName || !MembersInCharge || !deadline) {
        //     return res.status(400).json({ message: 'All fields are required' });
        // }

        // Update the task in MongoDB based on `_id`
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,  // The MongoDB `_id` of the task
            {        // Fields to update based on schema
                taskName,
                membersInCharge,
                deadline,
                status
            },
            { new: true, runValidators: true }  // Return the updated document and run validations
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({
            message: "Successfully updated the task",
            data: updatedTask
        });
    } catch (e) {
        console.error("Error updating task:", e);
        res.status(500).send("Failed to update task: " + e.message);
    }
});
//add a new task based on groupId
router.post("/add", async (req, res) => {
    try {
        console.log("Adding new task");

        const { taskId, taskName, deadline, membersInCharge, status, isEditing, groupId } = req.body;

        // Check if all required fields are provided
        if (!taskId || !taskName || !deadline || !membersInCharge || !groupId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create a new task document in MongoDB
        const newTask = new Task({
            taskId,
            taskName,
            deadline,
            membersInCharge,
            status: status || false, // Default to false if status is not provided
            isEditing: isEditing || false, // Default to false if isEditing is not provided
            groupId
        });

        const savedTask = await newTask.save();
        res.status(201).json({
            message: "Successfully added new task",
            data: savedTask
        });
    } catch (e) {
        console.error("Error adding new task:", e);
        res.status(500).send("Failed to add new task: " + e.message);
    }
});
router.delete("/delete/:id", async (req, res) => {
    try {
        const { taskId } = req.params;
        console.log(taskId)
        const deletedTask = await Task.findOne(taskId);
        
        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted successfully", data: deletedTask });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Failed to delete task", error: error.message });
    }
});
export default router;
