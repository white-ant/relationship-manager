const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/people/:personId/relations', async (req, res) => {
  try {
    const { personId } = req.params;

    const [people] = await pool.query('SELECT id FROM people WHERE id = ?', [personId]);
    if (people.length === 0) {
      return res.status(404).json({ code: 404, message: '人物不存在', data: null });
    }

    const [rows] = await pool.query(
      `SELECT pr.*, p.name as target_name, p.avatar as target_avatar, p.relation as target_relation, p.birthday as target_birthday
       FROM person_relations pr
       LEFT JOIN people p ON pr.target_person_id = p.id
       WHERE pr.source_person_id = ?
       ORDER BY pr.created_at DESC`,
      [personId]
    );

    res.json({
      code: 0,
      message: 'success',
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取人物关系列表失败', data: null });
  }
});

router.post('/people/:personId/relations', async (req, res) => {
  try {
    const { personId } = req.params;
    const { target_person_id, relation_name, remark } = req.body;

    if (!target_person_id) {
      return res.status(400).json({ code: 400, message: '请选择关联人物', data: null });
    }
    if (!relation_name || !String(relation_name).trim()) {
      return res.status(400).json({ code: 400, message: '请输入关系称呼', data: null });
    }

    const [sourcePeople] = await pool.query('SELECT id FROM people WHERE id = ?', [personId]);
    if (sourcePeople.length === 0) {
      return res.status(400).json({ code: 400, message: '人物不存在', data: null });
    }

    const [targetPeople] = await pool.query('SELECT id FROM people WHERE id = ?', [target_person_id]);
    if (targetPeople.length === 0) {
      return res.status(400).json({ code: 400, message: '关联人物不存在', data: null });
    }

    const [result] = await pool.query(
      'INSERT INTO person_relations (source_person_id, target_person_id, relation_name, remark) VALUES (?, ?, ?, ?)',
      [personId, target_person_id, relation_name.trim(), remark || null]
    );

    res.json({
      code: 0,
      message: '添加人物关系成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '添加人物关系失败', data: null });
  }
});

router.put('/person-relations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { target_person_id, relation_name, remark } = req.body;

    const [existing] = await pool.query('SELECT * FROM person_relations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '关系记录不存在', data: null });
    }

    if (target_person_id !== undefined && target_person_id !== null) {
      const [targetPeople] = await pool.query('SELECT id FROM people WHERE id = ?', [target_person_id]);
      if (targetPeople.length === 0) {
        return res.status(400).json({ code: 400, message: '关联人物不存在', data: null });
      }
    }

    if (!relation_name || !String(relation_name).trim()) {
      return res.status(400).json({ code: 400, message: '请输入关系称呼', data: null });
    }

    const finalTargetPersonId = target_person_id !== undefined && target_person_id !== null
      ? target_person_id
      : existing[0].target_person_id;

    await pool.query(
      'UPDATE person_relations SET target_person_id = ?, relation_name = ?, remark = ? WHERE id = ?',
      [finalTargetPersonId, relation_name.trim(), remark || null, id]
    );

    res.json({
      code: 0,
      message: '更新人物关系成功',
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '更新人物关系失败', data: null });
  }
});

router.delete('/person-relations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM person_relations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '关系记录不存在', data: null });
    }

    await pool.query('DELETE FROM person_relations WHERE id = ?', [id]);

    res.json({
      code: 0,
      message: '删除人物关系成功',
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '删除人物关系失败', data: null });
  }
});

router.get('/relation-graph', async (req, res) => {
  try {
    const [people] = await pool.query('SELECT id, name, avatar, relation, birthday FROM people ORDER BY id ASC');
    const [relations] = await pool.query(
      `SELECT pr.id, pr.source_person_id as source, pr.target_person_id as target, pr.relation_name as label
       FROM person_relations pr
       ORDER BY pr.id ASC`
    );

    const nodes = people.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      relation: p.relation,
      birthday: p.birthday
    }));

    const edges = relations.map(r => ({
      id: r.id,
      source: r.source,
      target: r.target,
      label: r.label
    }));

    res.json({
      code: 0,
      message: 'success',
      data: { nodes, edges }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '获取关系图数据失败', data: null });
  }
});

module.exports = router;
