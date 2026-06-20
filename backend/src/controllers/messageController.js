const Message = require('../models/Message');
const Team    = require('../models/Team');

function ownerOf(team) {
  return (team.createdBy || team.userId)?.toString() || '';
}

// GET /api/teams/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });

    const userId = req.user._id.toString();
    const isMember = (team.members || []).some(m => m.toString() === userId);
    if (ownerOf(team) !== userId && !isMember) {
      return res.status(403).json({ success: false, error: 'أنت لست عضواً في هذا الفريق' });
    }

    const messages = await Message.find({ teamId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/teams/:id/messages
exports.sendMessage = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });

    const userId = req.user._id.toString();
    const isMember = (team.members || []).some(m => m.toString() === userId);
    if (ownerOf(team) !== userId && !isMember) {
      return res.status(403).json({ success: false, error: 'أنت لست عضواً في هذا الفريق' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'الرسالة فارغة' });
    }

    const msg = await Message.create({
      teamId:   req.params.id,
      userId:   req.user._id,
      userName: req.user.name,
      text:     text.trim(),
    });

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
