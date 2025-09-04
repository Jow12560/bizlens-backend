import supabase from '../config/db.config.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const DEBUG_AUTH = process.env.DEBUG_AUTH === '1';

function dlog(...args) {
  if (DEBUG_AUTH) console.log(...args);
}

function logSbError(tag, err) {
  if (!err) return;
  console.error(`${tag} supabase error`, {
    code: err.code,
    message: err.message,
    details: err.details,
    hint: err.hint,
  });
}

// inspect the API key to confirm role & project ref (anon vs service_role, project mismatch)
function decodeSupabaseKey(key) {
  try {
    const payload = JSON.parse(Buffer.from(String(key).split('.')[1], 'base64').toString());
    return { role: payload?.role, ref: payload?.ref, iss: payload?.iss };
  } catch {
    return null;
  }
}

function passMeta(hash) {
  if (typeof hash !== 'string') return { type: typeof hash, len: null, looksBcrypt: false };
  return {
    type: 'string',
    len: hash.length,
    looksBcrypt: /^\$2[aby]\$/.test(hash),
    prefix: hash.slice(0, 4),
  };
}

export const loginUser = async (req, res) => {
  // 0) print environment diagnostics once per request
  if (DEBUG_AUTH) {
    dlog('[SB env]', {
      urlSet: Boolean(process.env.SUPABASE_URL),
      apiKeySet: Boolean(process.env.SUPABASE_API_KEY),
      jwtSecretSet: Boolean(JWT_SECRET),
      keyInfo: decodeSupabaseKey(process.env.SUPABASE_API_KEY), // { role: 'anon', ref: 'xxxx', iss: 'supabase' }
    });
  }

  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn('[LOGIN user] validation errors', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const emailInput = String(req.body?.email ?? '');
  const email = emailInput.trim(); // keep your behavior (no forced lowercase)
  const password = String(req.body?.password ?? '');

  dlog('[LOGIN user] incoming', {
    email,
    emailLen: email.length,
    hasPassword: password.length > 0,
  });

  try {
    // (A) Sanity ping: can we see ANY rows at all with this key?
    // If this returns [], RLS or wrong project is almost certainly the issue.
    if (DEBUG_AUTH) {
      const { data: probe, error: probeErr } = await supabase
        .from('user')
        .select('id', { count: 'exact' })
        .limit(1);
      if (probeErr) logSbError('[LOGIN user] probe select', probeErr);
      dlog('[LOGIN user] probe result', {
        gotRows: Array.isArray(probe) && probe.length > 0,
        probeCountGuess: Array.isArray(probe) ? probe.length : null,
      });
    }

    // (B) Try exact match with incoming email
    let { data: users, error } = await supabase
      .from('user')
      .select('id, email, password, role, assigned_departments')
      .eq('email', email);

    if (error) {
      logSbError('[LOGIN user] select', error);
      throw error;
    }

    dlog('[LOGIN user] exact eq result', {
      isArray: Array.isArray(users),
      count: Array.isArray(users) ? users.length : null,
    });

    // (C) If nothing found, try a fallback debug query to help identify trailing spaces / casing issues
    if ((!users || users.length === 0) && DEBUG_AUTH) {
      const emailLc = email.toLowerCase();
      const { data: fallbackUsers, error: fbErr } = await supabase
        .from('user')
        .select('id, email')
        .ilike('email', emailLc); // case-insensitive match

      if (fbErr) logSbError('[LOGIN user] fallback ilike', fbErr);
      dlog('[LOGIN user] fallback ilike result', fallbackUsers);

      // Also try prefix match to catch trailing spaces in DB
      const { data: prefixUsers, error: pxErr } = await supabase
        .from('user')
        .select('id, email')
        .like('email', `${email}%`);
      if (pxErr) logSbError('[LOGIN user] fallback like prefix', pxErr);
      dlog('[LOGIN user] fallback like prefix result', prefixUsers);
    }

    if (!users || users.length === 0) {
      console.warn('[LOGIN user] no user found for email', { email });
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const meta = passMeta(user?.password);

    dlog('[LOGIN user] user meta', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      passMeta: meta,
      hasAssignedDepartments: Array.isArray(user?.assigned_departments),
    });

    if (typeof user?.password !== 'string' || user.password.length < 20) {
      console.warn('[LOGIN user] stored password does not look like a bcrypt hash', meta);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      dlog('[LOGIN user] bcrypt.compare =>', { isMatch });
    } catch (cmpErr) {
      console.error('[LOGIN user] bcrypt.compare error', { message: cmpErr?.message });
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (!isMatch) {
      console.warn('[LOGIN user] password mismatch', {
        providedLen: password.length,
        stored: meta,
      });
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        assigned_departments: user.assigned_departments,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    dlog('[LOGIN user] success', { id: user.id, email: user.email, role: user.role });

    return res.status(200).json({ token, message: 'Login successful' });
  } catch (error) {
    console.error('[ERROR]: Failed to login user', { message: error?.message, name: error?.name });
    return res.status(500).json({ message: 'Internal server error' });
  }
};


export const loginTech = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Fetch the technician with necessary fields
    const { data: technicians, error } = await supabase
      .from('technician')
      .select('id, username, password, full_name, identification_number') // Ensure full_name and identification_number are selected
      .eq('username', username);

    if (error) {
      throw error;
    }

    if (!technicians || technicians.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const technician = technicians[0];

    // Compare passwords
    const isMatch = password === technician.password;
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate JWT with all required fields
    const token = jwt.sign(
      {
        userId: technician.id,
        username: technician.username,
        name: technician.full_name, // Include name in the payload
        identification: technician.identification_number // Include identification number in the payload
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error(`[ERROR]: Failed to login: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
