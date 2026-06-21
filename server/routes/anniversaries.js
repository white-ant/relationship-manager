const express = require('express');
const router = express.Router();
const pool = require('../db');

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  targetDate.setFullYear(today.getFullYear());
  targetDate.setHours(0, 0, 0, 0);
  if (targetDate < today) {
    targetDate.setFullYear(today.getFullYear() + 1);
  }
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

router.get('/person/:personId', async (req, res) => {
  try {
    const { personId } = req.params;
    const [people] = await pool.query('SELECT id FROM people WHERE id = ?', [personId]);
    if (people.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }
    const [rows] = await pool.query('SELECT * FROM anniversaries WHERE person_id = ? ORDER BY date', [personId]);
    res.json({
      code: 0,
      message: 'success',
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取纪念日列表失败', data: null });
  }
});

router.post('/', async (req, res) => {
  try {
    const { person_id, title, date, type = 'custom' } = req.body;
    if (!person_id) {
      return res.status(400).json({ code: 400, message: '人物ID不能为空', data: null });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ code: 400, message: '纪念日名称不能为空', data: null });
    }
    if (!date) {
      return res.status(400).json({ code: 400, message: '纪念日日期不能为空', data: null });
    }
    const [people] = await pool.query('SELECT id FROM people WHERE id = ?', [person_id]);
    if (people.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }
    const [result] = await pool.query(
      'INSERT INTO anniversaries (person_id, title, date, type) VALUES (?, ?, ?, ?)',
      [person_id, title, date, type]
    );
    res.json({
      code: 0,
      message: '添加纪念日成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '添加纪念日失败', data: null });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ code: 400, message: '纪念日名称不能为空', data: null });
    }
    if (!date) {
      return res.status(400).json({ code: 400, message: '纪念日日期不能为空', data: null });
    }
    const [existing] = await pool.query('SELECT id FROM anniversaries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '纪念日不存在', data: null });
    }
    await pool.query(
      'UPDATE anniversaries SET title = ?, date = ? WHERE id = ?',
      [title, date, id]
    );
    res.json({
      code: 0,
      message: '更新纪念日成功',
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '更新纪念日失败', data: null });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM anniversaries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '纪念日不存在', data: null });
    }
    await pool.query('DELETE FROM anniversaries WHERE id = ?', [id]);
    res.json({
      code: 0,
      message: '删除纪念日成功',
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '删除纪念日失败', data: null });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const [rows] = await pool.query(`
      SELECT 
        a.id, a.person_id, a.title, a.date, a.type,
        p.name, p.avatar, p.birthday, p.relation
      FROM anniversaries a
      LEFT JOIN people p ON a.person_id = p.id
      WHERE p.id IS NOT NULL
    `);
    const result = rows.map(row => ({
      ...row,
      daysUntil: getDaysUntil(row.date)
    }));
    result.sort((a, b) => a.daysUntil - b.daysUntil);
    const data = limit > 0 ? result.slice(0, limit) : result;
    res.json({
      code: 0,
      message: 'success',
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取即将到来的纪念日失败', data: null });
  }
});

router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const targetMonth = parseInt(month);
    const monthStr = String(targetMonth).padStart(2, '0');
    
    const [rows] = await pool.query(`
      SELECT 
        a.id, a.person_id, a.title, a.date, a.type,
        p.name, p.avatar
      FROM anniversaries a
      LEFT JOIN people p ON a.person_id = p.id
      WHERE DATE_FORMAT(a.date, '%m') = ?
    `, [monthStr]);

    const result = {};
    rows.forEach(row => {
      const dateObj = new Date(row.date);
      const day = dateObj.getDate();
      if (!result[day]) {
        result[day] = [];
      }
      result[day].push({
        id: row.id,
        person_id: row.person_id,
        title: row.title,
        date: row.date,
        type: row.type,
        name: row.name,
        avatar: row.avatar
      });
    });

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取日历纪念日数据失败', data: null });
  }
});

module.exports = router;
