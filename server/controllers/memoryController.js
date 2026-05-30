const Memory = require('../models/Memory');

// @desc    Get all memories
// @route   GET /api/memories
// @access  Private
const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().populate('uploadedBy', 'name profilePicture').sort({ date: -1 });
    res.json(memories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching memories', error: error.message });
  }
};

// @desc    Upload a new memory
// @route   POST /api/memories
// @access  Private
const createMemory = async (req, res) => {
  try {
    const { title, description, mediaUrl, mediaType, date } = req.body;

    const memory = new Memory({
      title,
      description,
      mediaUrl,
      mediaType,
      date: date || Date.now(),
      uploadedBy: req.user._id,
    });

    const savedMemory = await memory.save();
    const populatedMemory = await savedMemory.populate('uploadedBy', 'name profilePicture');
    
    res.status(201).json(populatedMemory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating memory', error: error.message });
  }
};

// @desc    Delete a memory
// @route   DELETE /api/memories/:id
// @access  Private
const deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    if (memory.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this memory' });
    }

    await Memory.deleteOne({ _id: req.params.id });
    res.json({ message: 'Memory removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting memory', error: error.message });
  }
};

module.exports = {
  getMemories,
  createMemory,
  deleteMemory,
};
