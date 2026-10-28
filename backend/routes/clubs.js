const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/admin');
const { validateClub } = require('../utils/validation');
const router = express.Router();
const columns = 'id, name, category, description, meeting_details, contact_email, tags, created_at, updated_at';
function databaseUnavailable(res) { return res.status(503).json({ error: 'Database is not configured. Check the server environment and Supabase setup.' }); }
function databaseError(res, error) {
  if (error?.code === '23505') return res.status(409).json({ error: 'A club with that name already exists.' });
  if (error?.code === '23503') return res.status(400).json({ error: 'The requested related record does not exist.' });
  console.error('Supabase operation failed:', error?.message || 'Unknown database error');
  return res.status(500).json({ error: 'A database operation failed. Check the server logs for details.' });
}
router.get('/', async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  const { data, error } = await supabase.from('clubs').select(columns).order('name', { ascending: true });
  if (error) return databaseError(res, error);
  res.json({ data });
});
router.get('/:id', async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  const { data, error } = await supabase.from('clubs').select(columns).eq('id', req.params.id).maybeSingle();
  if (error) return databaseError(res, error);
  if (!data) return res.status(404).json({ error: 'Club not found.' });
  res.json({ data });
});
router.post('/', requireAdmin, async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  const { errors, value } = validateClub(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' '), details: errors });
  const { data, error } = await supabase.from('clubs').insert(value).select(columns).single();
  if (error) return databaseError(res, error);
  res.status(201).json({ data });
});
router.put('/:id', requireAdmin, async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  const { errors, value } = validateClub(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' '), details: errors });
  const { data, error } = await supabase.from('clubs').update(value).eq('id', req.params.id).select(columns).maybeSingle();
  if (error) return databaseError(res, error);
  if (!data) return res.status(404).json({ error: 'Club not found.' });
  res.json({ data });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  const { data, error } = await supabase.from('clubs').delete().eq('id', req.params.id).select('id').maybeSingle();
  if (error) return databaseError(res, error);
  if (!data) return res.status(404).json({ error: 'Club not found.' });
  res.json({ message: 'Club deleted successfully.' });
});
module.exports = router;
