const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: (process.env.MAX_UPLOAD_SIZE || 5) * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM people ORDER BY created_at DESC');
    res.json({
      code: 0,
      message: 'success',
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取人物列表失败', data: null });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [people] = await pool.query('SELECT * FROM people WHERE id = ?', [id]);
    if (people.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }
    const [anniversaries] = await pool.query('SELECT * FROM anniversaries WHERE person_id = ? ORDER BY date', [id]);
    res.json({
      code: 0,
      message: 'success',
      data: {
        ...people[0],
        anniversaries
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取人物详情失败', data: null });
  }
});

router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, avatar, birthday, relation, contact, anniversaries = [] } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ code: 400, message: '姓名不能为空', data: null });
    }
    if (!birthday) {
      return res.status(400).json({ code: 400, message: '生日不能为空', data: null });
    }
    if (!relation) {
      return res.status(400).json({ code: 400, message: '关系不能为空', data: null });
    }

    if (!Array.isArray(anniversaries)) {
      return res.status(400).json({ code: 400, message: '纪念日格式错误', data: null });
    }
    for (const [idx, anniv] of anniversaries.entries()) {
      if (!anniv.title || !String(anniv.title).trim()) {
        return res.status(400).json({ code: 400, message: `纪念日 ${idx + 1} 的名称不能为空`, data: null });
      }
      if (!anniv.date) {
        return res.status(400).json({ code: 400, message: `纪念日 ${idx + 1} 的日期不能为空`, data: null });
      }
    }

    const [result] = await connection.query(
      'INSERT INTO people (name, avatar, birthday, relation, contact) VALUES (?, ?, ?, ?, ?)',
      [name, avatar || null, birthday, relation, contact || null]
    );
    const personId = result.insertId;

    await connection.query(
      'INSERT INTO anniversaries (person_id, title, date, type) VALUES (?, ?, ?, ?)',
      [personId, `${name}的生日`, birthday, 'birthday']
    );

    for (const anniv of anniversaries) {
      if (anniv.title && anniv.date) {
        await connection.query(
          'INSERT INTO anniversaries (person_id, title, date, type) VALUES (?, ?, ?, ?)',
          [personId, anniv.title, anniv.date, 'custom']
        );
      }
    }

    await connection.commit();
    res.json({
      code: 0,
      message: '添加人物成功',
      data: { id: personId }
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ code: 500, message: '添加人物失败', data: null });
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { name, avatar, birthday, relation, contact, anniversaries = [] } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ code: 400, message: '姓名不能为空', data: null });
    }
    if (!birthday) {
      return res.status(400).json({ code: 400, message: '生日不能为空', data: null });
    }
    if (!relation) {
      return res.status(400).json({ code: 400, message: '关系不能为空', data: null });
    }

    if (!Array.isArray(anniversaries)) {
      return res.status(400).json({ code: 400, message: '纪念日格式错误', data: null });
    }
    for (const [idx, anniv] of anniversaries.entries()) {
      if (!anniv.title || !String(anniv.title).trim()) {
        return res.status(400).json({ code: 400, message: `纪念日 ${idx + 1} 的名称不能为空`, data: null });
      }
      if (!anniv.date) {
        return res.status(400).json({ code: 400, message: `纪念日 ${idx + 1} 的日期不能为空`, data: null });
      }
    }

    const [existingPeople] = await connection.query('SELECT id FROM people WHERE id = ?', [id]);
    if (existingPeople.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }

    await connection.query(
      'UPDATE people SET name = ?, avatar = ?, birthday = ?, relation = ?, contact = ? WHERE id = ?',
      [name, avatar || null, birthday, relation, contact || null, id]
    );

    const [existing] = await connection.query('SELECT id FROM anniversaries WHERE person_id = ? AND type = ?', [id, 'birthday']);
    if (existing.length > 0) {
      await connection.query(
        'UPDATE anniversaries SET title = ?, date = ? WHERE id = ?',
        [`${name}的生日`, birthday, existing[0].id]
      );
    } else {
      await connection.query(
        'INSERT INTO anniversaries (person_id, title, date, type) VALUES (?, ?, ?, ?)',
        [id, `${name}的生日`, birthday, 'birthday']
      );
    }

    await connection.query('DELETE FROM anniversaries WHERE person_id = ? AND type = ?', [id, 'custom']);
    for (const anniv of anniversaries) {
      if (anniv.title && anniv.date) {
        await connection.query(
          'INSERT INTO anniversaries (person_id, title, date, type) VALUES (?, ?, ?, ?)',
          [id, anniv.title, anniv.date, 'custom']
        );
      }
    }

    await connection.commit();
    res.json({
      code: 0,
      message: '更新人物成功',
      data: null
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ code: 500, message: '更新人物失败', data: null });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [people] = await connection.query('SELECT avatar FROM people WHERE id = ?', [id]);
    if (people.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }
    if (people[0].avatar) {
      const avatarPath = path.join(__dirname, '..', people[0].avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await connection.query('DELETE FROM anniversaries WHERE person_id = ?', [id]);
    await connection.query('DELETE FROM relationship_records WHERE person_id = ?', [id]);
    await connection.query('DELETE FROM people WHERE id = ?', [id]);

    await connection.commit();
    res.json({
      code: 0,
      message: '删除人物成功',
      data: null
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ code: 500, message: '删除人物失败', data: null });
  } finally {
    connection.release();
  }
});

router.post('/upload', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的图片', data: null });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    res.json({
      code: 0,
      message: '上传成功',
      data: { url: avatarUrl }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '上传失败', data: null });
  }
});

module.exports = router;
