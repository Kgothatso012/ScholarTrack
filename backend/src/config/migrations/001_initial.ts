import knex, { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');

  // ============ USERS TABLE ============
  await knex.schema.createTable('users', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('phone', 10).notNullable();
    table.string('full_name').notNullable();
    table.enum('role', ['driver', 'parent', 'admin']).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ============ DRIVERS TABLE ============
  await knex.schema.createTable('drivers', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('id_number', 13).unique();
    table.string('pdp_number', 20);
    table.string('license_number').unique();
    table.string('vehicle_make');
    table.string('vehicle_model');
    table.string('vehicle_plate').unique();
    table.string('vehicle_year');
    table.enum('compliance_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.decimal('rating', 2, 1).defaultTo(0);
    table.integer('trips_completed').defaultTo(0);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ============ PARENTS TABLE ============
  await knex.schema.createTable('parents', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('address');
    table.string('suburb');
    table.string('city').defaultTo('Johannesburg');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ============ CHILDREN TABLE ============
  await knex.schema.createTable('children', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('parent_id').references('id').inTable('parents').onDelete('CASCADE');
    table.string('full_name').notNullable();
    table.date('date_of_birth');
    table.string('school_name').notNullable();
    table.string('grade');
    table.string('emergency_contact', 10);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ============ SCHOOLS TABLE ============
  await knex.schema.createTable('schools', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('address');
    table.string('suburb');
    table.string('city').defaultTo('Johannesburg');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.integer('radius_meters').defaultTo(500);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Add geography column after table creation
  await knex.raw('ALTER TABLE schools ADD COLUMN IF NOT EXISTS location geography(POINT, 4326)');

  // ============ DRIVER_SCHOOLS (Many-to-Many) ============
  await knex.schema.createTable('driver_schools', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('driver_id').references('id').inTable('drivers').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.decimal('price_per_month', 10, 2);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['driver_id', 'school_id']);
  });

  // ============ TRIPS TABLE ============
  await knex.schema.createTable('trips', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('driver_id').references('id').inTable('drivers').onDelete('SET NULL');
    table.uuid('child_id').references('id').inTable('children').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('SET NULL');
    table.date('trip_date').notNullable();
    table.time('scheduled_pickup_time').notNullable();
    table.time('scheduled_dropoff_time');
    table.enum('status', ['scheduled', 'en_route', 'arrived_pickup', 'in_transit', 'arrived_dropoff', 'completed', 'cancelled']).defaultTo('scheduled');
    table.decimal('pickup_latitude', 10, 8);
    table.decimal('pickup_longitude', 11, 8);
    table.decimal('dropoff_latitude', 10, 8);
    table.decimal('dropoff_longitude', 11, 8);
    table.time('actual_pickup_time');
    table.time('actual_dropoff_time');
    table.decimal('earnings', 10, 2).defaultTo(0);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ============ COMPLIANCE DOCUMENTS TABLE ============
  await knex.schema.createTable('compliance_documents', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('driver_id').references('id').inTable('drivers').onDelete('CASCADE');
    table.enum('document_type', ['pdp', 'roadworthy', 'drivers_license', 'insurance', 'vehicle_permit', 'id_copy']).notNullable();
    table.string('file_url');
    table.string('file_name');
    table.string('expiry_date');
    table.enum('verification_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.string('rejection_reason');
    table.timestamp('verified_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ============ PAYMENTS TABLE ============
  await knex.schema.createTable('payments', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('parent_id').references('id').inTable('parents').onDelete('CASCADE');
    table.uuid('driver_id').references('id').inTable('drivers').onDelete('SET NULL');
    table.uuid('trip_id').references('id').inTable('trips').onDelete('SET NULL');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').defaultTo('ZAR');
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.string('payment_method'); // yoco, payfast
    table.string('yoco_payment_id');
    table.string('invoice_number').unique();
    table.string('month'); // e.g., '2026-02'
    table.timestamp('paid_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ============ REVIEWS TABLE ============
  await knex.schema.createTable('reviews', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('parent_id').references('id').inTable('parents').onDelete('CASCADE');
    table.uuid('driver_id').references('id').inTable('drivers').onDelete('CASCADE');
    table.integer('rating').notNullable(); // 1-5
    table.text('comment');
    table.string('month'); // e.g., '2026-02'
    table.boolean('is_released').defaultTo(false); // payment released to driver
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['parent_id', 'driver_id', 'month']);
  });

  // ============ DRIVER LOCATIONS (Real-time) ============
  await knex.schema.createTable('driver_locations', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('driver_id').references('id').inTable('drivers').onDelete('CASCADE');
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.decimal('speed_kmh', 5, 2); // Speed in km/h
    table.decimal('heading', 5, 2); // Compass heading
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });

  // ============ GEOFENCES ============
  await knex.schema.createTable('geofences', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.enum('zone_type', ['school', 'home', 'pickup', 'dropoff']).notNullable();
    table.uuid('school_id').references('id').inTable('schools').onDelete('SET NULL');
    table.uuid('parent_id').references('id').inTable('parents').onDelete('SET NULL');
    table.integer('radius_meters').defaultTo(200);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Add geography column after table creation
  await knex.raw('ALTER TABLE geofences ADD COLUMN IF NOT EXISTS location geography(POINT, 4326)');

  // ============ INDEXES ============
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_trips_child ON trips(child_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driver_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('geofences');
  await knex.schema.dropTableIfExists('driver_locations');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('compliance_documents');
  await knex.schema.dropTableIfExists('trips');
  await knex.schema.dropTableIfExists('driver_schools');
  await knex.schema.dropTableIfExists('schools');
  await knex.schema.dropTableIfExists('children');
  await knex.schema.dropTableIfExists('parents');
  await knex.schema.dropTableIfExists('drivers');
  await knex.schema.dropTableIfExists('users');
}
