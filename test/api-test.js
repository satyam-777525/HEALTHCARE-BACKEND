/**
 * Automated End-to-End API Test Suite
 * Tests all endpoints: Auth, Patients, Doctors, Mappings, Health
 */

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');

let server;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n--- Starting Healthcare API Automated Verification ---\n');
  const port = 5099;
  baseUrl = `http://localhost:${port}/api`;

  server = app.listen(port);
  await new Promise((resolve) => setTimeout(resolve, 500));

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  let user1Token;
  let user2Token;
  let createdPatientId;
  let createdDoctorId;
  let createdMappingId;

  // 1. Health Check
  await test('GET /api/health - Health check endpoint responds', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200 || res.status === 503, `Expected 200 or 503, got ${res.status}`);
    assert(res.body.status !== undefined, 'Expected status field in response');
  });

  const timestamp = Date.now();
  const user1Email = `doctor.test.${timestamp}@hospital.com`;
  const user2Email = `other.doctor.${timestamp}@hospital.com`;

  // 2. Auth - Register
  await test('POST /api/auth/register - Register user 1', async () => {
    const res = await request('POST', '/auth/register', {
      name: 'Dr. Test One',
      email: user1Email,
      password: 'Password123!'
    });
    assert(res.status === 201, `Expected 201, got ${res.status} (${res.body.message})`);
    assert(res.body.data.id !== undefined, 'Expected user id');
    assert(res.body.data.password === undefined, 'Password hash must NOT be returned');
  });

  // 3. Auth - Duplicate Register
  await test('POST /api/auth/register - Duplicate email returns 409', async () => {
    const res = await request('POST', '/auth/register', {
      name: 'Dr. Duplicate',
      email: user1Email,
      password: 'AnotherPassword!'
    });
    assert(res.status === 409, `Expected 409, got ${res.status}`);
  });

  // 4. Auth - Login
  await test('POST /api/auth/login - Login user 1 returns JWT token', async () => {
    const res = await request('POST', '/auth/login', {
      email: user1Email,
      password: 'Password123!'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.token, 'Expected JWT token in response');
    user1Token = res.body.data.token;
  });

  // 5. Auth - Invalid Login
  await test('POST /api/auth/login - Invalid credentials returns 401', async () => {
    const res = await request('POST', '/auth/login', {
      email: user1Email,
      password: 'WrongPassword!'
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 6. Register & Login User 2
  await test('POST /api/auth/register - Register user 2 for authorization tests', async () => {
    const res = await request('POST', '/auth/register', {
      name: 'Dr. Test Two',
      email: user2Email,
      password: 'Password123!'
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);

    const loginRes = await request('POST', '/auth/login', {
      email: user2Email,
      password: 'Password123!'
    });
    user2Token = loginRes.body.data.token;
    assert(user2Token !== undefined, 'User 2 token acquired');
  });

  // 7. Patient - Create
  await test('POST /api/patients - Create patient with User 1', async () => {
    const res = await request('POST', '/patients', {
      name: 'Alice Johnson',
      age: 29,
      gender: 'FEMALE',
      contact: '+1-555-0101',
      address: '123 Pine St, City'
    }, user1Token);
    assert(res.status === 201, `Expected 201, got ${res.status} (${res.body.message})`);
    assert(res.body.data.id !== undefined, 'Expected patient ID');
    createdPatientId = res.body.data.id;
  });

  // 8. Patient - Get user patients
  await test('GET /api/patients - List only owned patients', async () => {
    const res1 = await request('GET', '/patients', null, user1Token);
    assert(res1.status === 200, `Expected 200, got ${res1.status}`);
    assert(res1.body.data.length >= 1, 'Expected at least 1 patient for user 1');

    const res2 = await request('GET', '/patients', null, user2Token);
    assert(res2.status === 200, `Expected 200, got ${res2.status}`);
    assert(res2.body.data.length === 0, 'User 2 should see 0 patients (isolation)');
  });

  // 9. Patient - Forbidden isolation check
  await test('GET /api/patients/:id - Accessing other user patient returns 403', async () => {
    const res = await request('GET', `/patients/${createdPatientId}`, null, user2Token);
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // 10. Patient - Update
  await test('PUT /api/patients/:id - Update owned patient', async () => {
    const res = await request('PUT', `/patients/${createdPatientId}`, {
      contact: '+1-555-9999'
    }, user1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.contact === '+1-555-9999', 'Patient contact was not updated');
  });

  // 11. Doctor - Create
  await test('POST /api/doctors - Create doctor with User 1', async () => {
    const res = await request('POST', '/doctors', {
      name: 'Dr. Stephen Strange',
      specialization: 'Neuro-Surgery',
      contact: '+1-555-1776',
      address: '177A Bleecker St, New York'
    }, user1Token);
    assert(res.status === 201, `Expected 201, got ${res.status} (${res.body.message})`);
    assert(res.body.data.id !== undefined, 'Expected doctor ID');
    createdDoctorId = res.body.data.id;
  });

  // 12. Doctor - List all
  await test('GET /api/doctors - List doctors (authenticated)', async () => {
    const res = await request('GET', '/doctors', null, user2Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.length >= 1, 'Expected doctors in list');
  });

  // 13. Doctor - Update Authorization rule (User 2 cannot update User 1\'s doctor)
  await test('PUT /api/doctors/:id - User 2 cannot modify User 1 doctor (403)', async () => {
    const res = await request('PUT', `/doctors/${createdDoctorId}`, {
      specialization: 'Unauthorized Update'
    }, user2Token);
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // 14. Doctor - Update (Creator)
  await test('PUT /api/doctors/:id - Creator can update doctor (200)', async () => {
    const res = await request('PUT', `/doctors/${createdDoctorId}`, {
      specialization: 'Advanced Neuro-Surgery'
    }, user1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 15. Mapping - Create
  await test('POST /api/mappings - Assign doctor to patient', async () => {
    const res = await request('POST', '/mappings', {
      patientId: createdPatientId,
      doctorId: createdDoctorId
    }, user1Token);
    assert(res.status === 201, `Expected 201, got ${res.status} (${res.body.message})`);
    assert(res.body.data.id !== undefined, 'Expected mapping ID');
    createdMappingId = res.body.data.id;
  });

  // 16. Mapping - Duplicate Prevention
  await test('POST /api/mappings - Prevent duplicate assignment (409 Conflict)', async () => {
    const res = await request('POST', '/mappings', {
      patientId: createdPatientId,
      doctorId: createdDoctorId
    }, user1Token);
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
  });

  // 17. Mapping - Get mappings for user
  await test('GET /api/mappings - List user\'s patient mappings', async () => {
    const res = await request('GET', '/mappings', null, user1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.length >= 1, 'Expected mappings for user 1');
  });

  // 18. Mapping - Get doctors for patient
  await test('GET /api/mappings/:patientId - Get doctors for specific patient', async () => {
    const res = await request('GET', `/mappings/${createdPatientId}`, null, user1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.length >= 1, 'Expected assigned doctors');
  });

  // 19. Mapping - Delete authorization check
  await test('DELETE /api/mappings/:id - User 2 cannot delete User 1 mapping (403)', async () => {
    const res = await request('DELETE', `/mappings/${createdMappingId}`, null, user2Token);
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // 20. Mapping - Delete by owner
  await test('DELETE /api/mappings/:id - Remove assignment', async () => {
    const res = await request('DELETE', `/mappings/${createdMappingId}`, null, user1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 21. Patient - Delete
  await test('DELETE /api/patients/:id - Delete owned patient', async () => {
    const res = await request('DELETE', `/patients/${createdPatientId}`, null, user1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 22. Doctor - Delete by creator
  await test('DELETE /api/doctors/:id - Delete doctor by creator', async () => {
    const res = await request('DELETE', `/doctors/${createdDoctorId}`, null, user1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  console.log(`\n--- Test Results: ${passed} Passed, ${failed} Failed ---\n`);

  server.close();
  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('Fatal test error:', err);
    if (server) server.close();
    process.exit(1);
  });
}

module.exports = runTests;
