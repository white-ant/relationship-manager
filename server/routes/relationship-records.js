const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const TYPE_MAP = {
  transfer: { category: 'money', type_name: '转账', direction: 'expense' },
  receive: { category: 'money', type_name: '收款', direction: 'income' },
  lend: { category: 'money', type_name: '借出', direction: 'expense' },
  return_in: { category: 'money', type_name: '还入', direction: 'income' },
  pay_for: { category: 'money', type_name: '代付', direction: 'expense' },
  reimburse: { category: 'money', type_name: '报销', direction: 'income' },
  red_packet_out: { category: 'money', type_name: '红包支出', direction: 'expense' },
  red_packet_in: { category: 'money', type_name: '红包收入', direction: 'income' },
  gift_in: { category: 'gift', type_name: '收礼', direction: 'neutral' },
  gift_out: { category: 'gift', type_name: '送礼', direction: 'neutral' },
  treat: { category: 'gift', type_name: '请客', direction: 'neutral' },
  treated: { category: 'gift', type_name: '被请客', direction: 'neutral' },
  help: { category: 'gift', type_name: '帮忙', direction: 'neutral' },
  helped: { category: 'gift', type_name: '被帮忙', direction: 'neutral' }
};

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
    cb(null, 'gift-' + uniqueSuffix + ext);
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

function validateRecord(data) {
  const errors = [];
  if (!data.type) {
    errors.push('类型不能为空');
  }
  if (!data.record_date) {
    errors.push('日期不能为空');
  }
  if (!data.type) {
    return errors;
  }
  const typeInfo = TYPE_MAP[data.type];
  if (!typeInfo) {
    errors.push('无效的类型');
    return errors;
  }
  if (typeInfo.category === 'money') {
    if (data.amount === undefined || data.amount === null || data.amount === '') {
      errors.push('资金类金额不能为空');
    } else if (isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      errors.push('金额必须大于0');
    }
  }
  if (typeInfo.category === 'gift') {
    if (!data.gift_name) {
      errors.push('礼物名称不能为空');
    }
  }
  return errors;
}

router.get('/people/:personId/relationship-records', async (req, res) => {
  try {
    const { personId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const offset = (page - 1) * pageSize;

    const [people] = await pool.query('SELECT id FROM people WHERE id = ?', [personId]);
    if (people.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM relationship_records WHERE person_id = ?',
      [personId]
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      'SELECT * FROM relationship_records WHERE person_id = ? ORDER BY record_date DESC, id DESC LIMIT ? OFFSET ?',
      [personId, pageSize, offset]
    );

    res.json({
      code: 0,
      message: 'success',
      data: {
        list: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取人情往来列表失败', data: null });
  }
});

router.post('/people/:personId/relationship-records', upload.single('gift_image'), async (req, res) => {
  try {
    const { personId } = req.params;
    const data = req.body;

    const [people] = await pool.query('SELECT id FROM people WHERE id = ?', [personId]);
    if (people.length === 0) {
      return res.status(400).json({ code: 400, message: '人物不存在', data: null });
    }

    const errors = validateRecord(data);
    if (errors.length > 0) {
      return res.status(400).json({ code: 400, message: errors.join('；'), data: null });
    }

    const typeInfo = TYPE_MAP[data.type];
    const amount = typeInfo.category === 'money' ? parseFloat(data.amount).toFixed(2) : null;
    const giftName = typeInfo.category === 'gift' ? data.gift_name : null;
    const giftImage = req.file ? `/uploads/${req.file.filename}` : (data.gift_image || null);

    const [result] = await pool.query(
      'INSERT INTO relationship_records (person_id, category, type, type_name, direction, amount, gift_name, gift_image, remark, record_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [personId, typeInfo.category, data.type, typeInfo.type_name, typeInfo.direction, amount, giftName, giftImage, data.remark || null, data.record_date]
    );

    res.json({
      code: 0,
      message: '新增人情往来记录成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '新增人情往来记录失败', data: null });
  }
});

router.get('/relationship-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM relationship_records WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在', data: null });
    }
    res.json({
      code: 0,
      message: 'success',
      data: rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取记录详情失败', data: null });
  }
});

router.put('/relationship-records/:id', upload.single('gift_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const [existing] = await pool.query('SELECT * FROM relationship_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在', data: null });
    }

    const errors = validateRecord(data);
    if (errors.length > 0) {
      return res.status(400).json({ code: 400, message: errors.join('；'), data: null });
    }

    const typeInfo = TYPE_MAP[data.type];
    const amount = typeInfo.category === 'money' ? parseFloat(data.amount).toFixed(2) : null;
    const giftName = typeInfo.category === 'gift' ? data.gift_name : null;
    const giftImage = req.file ? `/uploads/${req.file.filename}` : (data.gift_image || null);

    await pool.query(
      'UPDATE relationship_records SET category = ?, type = ?, type_name = ?, direction = ?, amount = ?, gift_name = ?, gift_image = ?, remark = ?, record_date = ? WHERE id = ?',
      [typeInfo.category, data.type, typeInfo.type_name, typeInfo.direction, amount, giftName, giftImage, data.remark || null, data.record_date, id]
    );

    res.json({
      code: 0,
      message: '更新人情往来记录成功',
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '更新人情往来记录失败', data: null });
  }
});

router.delete('/relationship-records/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM relationship_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在', data: null });
    }

    if (existing[0].gift_image) {
      const imagePath = path.join(__dirname, '..', existing[0].gift_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.query('DELETE FROM relationship_records WHERE id = ?', [id]);

    res.json({
      code: 0,
      message: '删除人情往来记录成功',
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '删除人情往来记录失败', data: null });
  }
});

router.get('/people/:personId/statistics', async (req, res) => {
  try {
    const { personId } = req.params;

    const [people] = await pool.query('SELECT id FROM people WHERE id = ?', [personId]);
    if (people.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }

    const [giftResult] = await pool.query(
      'SELECT COUNT(*) as gift_count FROM relationship_records WHERE person_id = ? AND category = ?',
      [personId, 'gift']
    );

    const [moneyResult] = await pool.query(
      'SELECT COALESCE(SUM(CASE WHEN direction = ? THEN amount ELSE 0 END), 0) as money_income, COALESCE(SUM(CASE WHEN direction = ? THEN amount ELSE 0 END), 0) as money_expense FROM relationship_records WHERE person_id = ? AND category = ?',
      ['income', 'expense', personId, 'money']
    );

    const [annivResult] = await pool.query(
      'SELECT COUNT(*) as anniversary_count FROM anniversaries WHERE person_id = ?',
      [personId]
    );

    const moneyIncome = parseFloat(moneyResult[0].money_income) || 0;
    const moneyExpense = parseFloat(moneyResult[0].money_expense) || 0;
    const moneyNet = moneyIncome - moneyExpense;

    res.json({
      code: 0,
      message: 'success',
      data: {
        gift_count: giftResult[0].gift_count,
        money_income: moneyIncome.toFixed(2),
        money_expense: moneyExpense.toFixed(2),
        money_net: moneyNet.toFixed(2),
        anniversary_count: annivResult[0].anniversary_count
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取统计数据失败', data: null });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的图片', data: null });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({
      code: 0,
      message: '上传成功',
      data: { url }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '上传失败', data: null });
  }
});

module.exports = router;
