#!/usr/bin/env node
// Seed deterministic Supabase test workers. Requires SUPABASE_SERVICE_ROLE_KEY.
// Never put the service key in Expo env; keep it in CI/local secret storage only.
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function envValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return '';
  const line = fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((x) => x.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : '';
}

const SUPABASE_URL = envValue('EXPO_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = envValue('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY (EXPO_PUBLIC_SUPABASE_URL is read from .env).');
  process.exit(1);
}

const PASSWORD = process.env.TEST_WORKER_PASSWORD || 'Malume-Tester-2026!';
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const workers = [
  {
    email: 'john.moyo@test.local',
    full_name: 'John Moyo',
    phone: '+27821110001',
    role: 'parent',
    children: [
      { full_name: 'Amahle Moyo', grade: 'Grade 5', pickup_address: '12 Oak Street, Sandton' },
      { full_name: 'Lethabo Moyo', grade: 'Grade 3', pickup_address: '12 Oak Street, Sandton' },
    ],
  },
  {
    email: 'thabo.mkhize@test.local',
    full_name: 'Thabo Mkhize',
    phone: '+27821110002',
    role: 'driver',
    driver: {
      vehicle_type: 'Toyota Quantum',
      license_number: 'PDP12345678',
      is_verified: true,
      is_available: true,
      rating: 4.8,
    },
  },
  {
    email: 'rls-parent-a@test.local',
    full_name: 'RLS Parent A',
    phone: '+27821110003',
    role: 'parent',
  },
  {
    email: 'rls-parent-b@test.local',
    full_name: 'RLS Parent B',
    phone: '+27821110004',
    role: 'parent',
  },
  {
    email: 'rls-driver-a@test.local',
    full_name: 'RLS Driver A',
    phone: '+27821110005',
    role: 'driver',
    driver: { is_verified: true, is_available: true },
  },
];

const school = {
  name: 'Sandton Primary',
  address: 'Sandton, Gauteng',
  latitude: -26.1076,
  longitude: 28.0567,
};

async function upsertAuthUser(worker) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const existing = data.users.find((u) => u.email?.toLowerCase() === worker.email);
  const payload = {
    email: worker.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: worker.role, full_name: worker.full_name, phone: worker.phone },
  };
  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, payload);
    if (updateError) throw updateError;
    return existing.id;
  }
  const { data: created, error: createError } = await admin.auth.admin.createUser(payload);
  if (createError) throw createError;
  return created.user.id;
}

async function ensureRow(table, match, values) {
  // ponytail: select-then-upsert because live schema has no user_id/full_name unique keys
  if (match) {
    const { data: existing, error: selectError } = await admin.from(table).select('*').match(match).maybeSingle();
    if (selectError) throw new Error(`${table}: ${selectError.message}`);
    if (existing) {
      const { data, error } = await admin.from(table).update(values).eq('id', existing.id).select().single();
      if (error) throw new Error(`${table}: ${error.message}`);
      return data;
    }
  }
  const { data, error } = await admin.from(table).insert({ ...(match || {}), ...values }).select().single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function main() {
  const { data: existingSchool } = await admin.from('schools').select('*').eq('name', school.name).maybeSingle();
  const schoolId = existingSchool?.id || (await ensureRow('schools', null, school)).id;

  const ids = {};
  for (const worker of workers) {
    ids[worker.email] = await upsertAuthUser(worker);
  }

  for (const worker of workers) {
    const id = ids[worker.email];
    await ensureRow('profiles', { id }, {
      email: worker.email,
      role: worker.role,
      full_name: worker.full_name,
      phone: worker.phone,
    });
    if (worker.role === 'driver') {
      const { data: driver } = await admin.from('drivers').select('id').eq('user_id', id).maybeSingle();
      await ensureRow('drivers', driver ? { id: driver.id } : { user_id: id }, {
        user_id: id,
        full_name: worker.full_name,
        phone: worker.phone,
        ...worker.driver,
      });
    }
  }

  const john = await admin.from('profiles').select('id').eq('email', workers[0].email).single();
  if (john.error) throw john.error;
  for (const child of workers[0].children) {
    const { data: existing } = await admin.from('children').select('id')
      .eq('parent_id', john.data.id).eq('full_name', child.full_name).maybeSingle();
    await ensureRow('children', existing ? { id: existing.id } : { parent_id: john.data.id, full_name: child.full_name }, {
      parent_id: john.data.id,
      school_id: schoolId,
      ...child,
      status: 'active',
    });
  }

  const { data: amahle } = await admin.from('children').select('id').eq('full_name', 'Amahle Moyo').eq('parent_id', john.data.id).maybeSingle();
  const thaboProfile = await admin.from('profiles').select('id').eq('email', workers[1].email).single();
  const thaboDriver = await admin.from('drivers').select('id').eq('user_id', thaboProfile.data.id).maybeSingle();
  if (amahle?.id && thaboDriver?.id) {
    const { data: assignment } = await admin.from('driver_assignments').select('id')
      .eq('child_id', amahle.id).eq('driver_id', thaboDriver.id).maybeSingle();
    await ensureRow('driver_assignments', assignment ? { id: assignment.id } : { child_id: amahle.id, driver_id: thaboDriver.id }, {
      child_id: amahle.id,
      driver_id: thaboDriver.id,
      status: 'active',
      monthly_rate: 1500,
    });
  }

  console.log(`Seeded ${workers.length} test workers`);
  console.log(`Password: ${PASSWORD}`);
  for (const w of workers) console.log(`${w.role.padEnd(6)} ${w.email}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
