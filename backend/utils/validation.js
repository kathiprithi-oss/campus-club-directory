const CATEGORIES = ['Technology','Arts & Culture','Social Impact','Sports','Academic','Entrepreneurship','Other'];
function validateClub(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: ['Request body must be a JSON object.'] };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const meeting = typeof body.meeting_details === 'string' ? body.meeting_details.trim() : '';
  const email = typeof body.contact_email === 'string' ? body.contact_email.trim() : '';
  if (name.length < 2 || name.length > 100) errors.push('Name must contain 2 to 100 characters.');
  if (!CATEGORIES.includes(category)) errors.push('Choose a valid category.');
  if (description.length < 10 || description.length > 700) errors.push('Description must contain 10 to 700 characters.');
  if (meeting.length > 120) errors.push('Meeting details must be 120 characters or fewer.');
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.push('Enter a valid contact email.');
  let tags = body.tags === undefined ? [] : body.tags;
  if (!Array.isArray(tags) || tags.length > 12 || tags.some(tag => typeof tag !== 'string' || tag.trim().length > 30)) errors.push('Tags must be an array of up to 12 short text values.');
  tags = Array.isArray(tags) ? [...new Set(tags.map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : '').filter(Boolean))] : [];
  return { errors, value: { name, category, description, meeting_details: meeting || null, contact_email: email || null, tags } };
}
module.exports = { validateClub, CATEGORIES };
