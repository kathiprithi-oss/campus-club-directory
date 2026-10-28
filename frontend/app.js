const API = '/api';
const $ = (selector) => document.querySelector(selector);
const state = { clubs: [], adminToken: '' };
const categoryIcons = { 'Technology':'💻','Arts & Culture':'🎨','Social Impact':'🌱','Sports':'⚽','Academic':'📚','Entrepreneurship':'🚀','Other':'✨' };
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 2800); }
async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers || {}) } });
  let result; try { result = await response.json(); } catch { result = { error: 'The server returned an invalid response.' }; }
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}
async function loadClubs() {
  $('#status').textContent = 'Loading the club directory…';
  try { const result = await apiRequest('/clubs'); state.clubs = result.data; buildCategoryOptions(); renderClubs(); $('#status').textContent = ''; }
  catch (error) { $('#status').textContent = `Could not load clubs. ${error.message} Check that the server and Supabase are configured.`; $('#club-grid').innerHTML = ''; $('#result-count').textContent = 'Directory unavailable'; }
}
function buildCategoryOptions() {
  const current = $('#category').value;
  const categories = [...new Set(state.clubs.map(club => club.category))].sort();
  $('#category').innerHTML = '<option value="all">All categories</option>' + categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  if (categories.includes(current)) $('#category').value = current;
}
function renderClubs() {
  const query = $('#search').value.trim().toLowerCase(); const category = $('#category').value;
  const filtered = state.clubs.filter(club => (category === 'all' || club.category === category) && [club.name,club.description,club.category,...(club.tags || [])].join(' ').toLowerCase().includes(query));
  $('#club-count').textContent = state.clubs.length;
  $('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'club' : 'clubs'} found`;
  if (!filtered.length) { $('#club-grid').innerHTML = `<div class="empty-state"><strong>No clubs found yet.</strong>Try a different search or category.</div>`; return; }
  $('#club-grid').innerHTML = filtered.map(club => `<article class="club-card" tabindex="0" role="button" data-id="${escapeHtml(club.id)}" aria-label="View ${escapeHtml(club.name)} details"><div class="club-card-top"><span class="club-icon" aria-hidden="true">${categoryIcons[club.category] || '✨'}</span><span class="club-category">${escapeHtml(club.category)}</span></div><h3>${escapeHtml(club.name)}</h3><p>${escapeHtml(club.description)}</p><div class="card-bottom"><span>${escapeHtml(club.meeting_details || 'Meeting details on request')}</span><span>View details ↗</span></div></article>`).join('');
}
function showClub(id) {
  const club = state.clubs.find(item => item.id === id); if (!club) return;
  $('#club-details').innerHTML = `<div class="detail-icon">${categoryIcons[club.category] || '✨'}</div><span class="detail-category">${escapeHtml(club.category)}</span><h2 class="detail-title">${escapeHtml(club.name)}</h2><p class="detail-description">${escapeHtml(club.description)}</p>${club.tags?.length ? `<p>${club.tags.map(tag => `<span class="club-category">${escapeHtml(tag)}</span> `).join('')}</p>` : ''}<div class="detail-meta"><div><strong>📅 Meeting details</strong><br>${escapeHtml(club.meeting_details || 'Contact the club for details')}</div><div><strong>✉ Contact</strong><br>${club.contact_email ? `<a href="mailto:${escapeHtml(club.contact_email)}">${escapeHtml(club.contact_email)}</a>` : 'Contact information not provided'}</div></div>`;
  $('#club-dialog').showModal();
}
$('#club-grid').addEventListener('click', event => { const card = event.target.closest('[data-id]'); if (card) showClub(card.dataset.id); });
$('#club-grid').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { const card = event.target.closest('[data-id]'); if (card) { event.preventDefault(); showClub(card.dataset.id); } } });
$('#search').addEventListener('input', renderClubs); $('#category').addEventListener('change', renderClubs);
$('#admin-open').addEventListener('click', () => { $('#admin-dialog').showModal(); });
$('#admin-close').addEventListener('click', () => $('#admin-dialog').close());
$('#reset-form').addEventListener('click', resetClubForm);
function resetClubForm() { $('#edit-id').value=''; $('#club-name').value=''; $('#club-category').value='Technology'; $('#club-description').value=''; $('#club-meeting').value=''; $('#club-email').value=''; $('#club-tags').value=''; $('#admin-message').textContent=''; }
$('#admin-token').addEventListener('change', async () => { state.adminToken = $('#admin-token').value.trim(); if (state.adminToken) await loadAdminList(); });
async function loadAdminList() {
  $('#admin-list').textContent = 'Loading…';
  try { const result = await apiRequest('/clubs', { headers: { 'x-admin-token': state.adminToken } }); state.clubs = result.data; buildCategoryOptions(); renderClubs(); renderAdminList(); $('#admin-message').textContent = 'Admin access verified.'; }
  catch (error) { $('#admin-list').textContent = error.message; $('#admin-message').textContent = 'Admin access could not be verified.'; }
}
function renderAdminList() {
  if (!state.clubs.length) { $('#admin-list').innerHTML = '<p class="muted small">No clubs yet. Use the form above to add one.</p>'; return; }
  $('#admin-list').innerHTML = state.clubs.map(club => `<div class="admin-row"><span><strong>${escapeHtml(club.name)}</strong><br><span class="muted">${escapeHtml(club.category)}</span></span><span class="admin-row-actions"><button class="mini-button" data-edit="${escapeHtml(club.id)}">Edit</button><button class="mini-button danger" data-delete="${escapeHtml(club.id)}">Delete</button></span></div>`).join('');
}
$('#admin-list').addEventListener('click', async event => {
  const edit = event.target.closest('[data-edit]'); const del = event.target.closest('[data-delete]');
  if (edit) { const club = state.clubs.find(item => item.id === edit.dataset.edit); if (!club) return; $('#edit-id').value=club.id; $('#club-name').value=club.name; $('#club-category').value=club.category; $('#club-description').value=club.description; $('#club-meeting').value=club.meeting_details || ''; $('#club-email').value=club.contact_email || ''; $('#club-tags').value=(club.tags || []).join(', '); $('#admin-message').textContent='Editing selected club.'; $('#club-name').focus(); }
  if (del) { const club = state.clubs.find(item => item.id === del.dataset.delete); if (!club || !window.confirm(`Delete “${club.name}”? This cannot be undone.`)) return; try { await apiRequest(`/clubs/${club.id}`, { method:'DELETE', headers:{'x-admin-token':state.adminToken} }); await loadAdminList(); showToast('Club deleted.'); } catch (error) { $('#admin-message').textContent=error.message; } }
});
$('#admin-form').addEventListener('submit', async event => {
  event.preventDefault(); state.adminToken = $('#admin-token').value.trim(); if (!state.adminToken) { $('#admin-message').textContent='Enter the admin token first.'; return; }
  const payload = { name:$('#club-name').value.trim(), category:$('#club-category').value, description:$('#club-description').value.trim(), meeting_details:$('#club-meeting').value.trim(), contact_email:$('#club-email').value.trim(), tags:$('#club-tags').value.split(',').map(tag=>tag.trim()).filter(Boolean) };
  const id = $('#edit-id').value; const button = $('#admin-form button[type="submit"]'); button.disabled=true; button.textContent='Saving…';
  try { await apiRequest(id ? `/clubs/${id}` : '/clubs', { method:id?'PUT':'POST', headers:{'x-admin-token':state.adminToken}, body:JSON.stringify(payload) }); resetClubForm(); await loadAdminList(); showToast(id?'Club updated.':'Club added.'); }
  catch (error) { $('#admin-message').textContent=error.message; }
  finally { button.disabled=false; button.textContent='Save club'; }
});
loadClubs();
