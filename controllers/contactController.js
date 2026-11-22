const Contact = require('../models/Contact');

exports.submit = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json({ success: true, message: 'Message sent successfully', contact });
  } catch (e) { next(e); }
};

exports.getAll = async (req, res, next) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (e) { next(e); }
};

exports.markRead = async (req, res, next) => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, { status: 'Read' }, { new: true });
    res.json({ success: true, message: msg });
  } catch (e) { next(e); }
};
