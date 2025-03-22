import { faker } from '@faker-js/faker';
import { backendSupabase } from '@/lib/backendSupa';
import 'dotenv/config';

const PATIENT_COUNT = 50;

interface PatientRecord {
  patient_id: string;
  patientName: string;
  gender: string;
  age: number;
  record_type: string;
  details: {
    date: string;
    description: string;
    type: string;
    severity?: string;
    treatment?: string;
  };
}

async function seedPatientRecords() {
  try {
    console.log('🔄 Checking existing patients...');
    
    // Check if the Supabase connection works
    const { error: dbError } = await backendSupabase.from('users').select('id').limit(1);
    if (dbError) throw new Error(`Supabase connection error: ${dbError.message}`);

    // Get all users with 'patient' role
    let { data: patients, error: patientsError } = await backendSupabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'patient');

    if (patientsError) throw new Error(`Error fetching patients: ${patientsError.message}`);

    if (!patients || patients.length === 0) {
      console.log('⚠️ No patients found. Creating dummy patients...');
      
      for (let i = 0; i < PATIENT_COUNT; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });

        const { data: authData, error: signUpError } = await backendSupabase.auth.signUp({
          email,
          password: 'password123',
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone_number: faker.phone.number(),
              role: 'patient'
            }
          }
        });

        if (signUpError) {
          console.error(`⚠️ Error signing up ${email}:`, signUpError.message);
          continue;
        }

        if (authData.user) {
          const { error: profileError } = await backendSupabase.from('users').insert([{
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone_number: faker.phone.number(),
            role: 'patient'
          }]);

          if (profileError) {
            console.error(`⚠️ Error inserting user profile for ${email}:`, profileError.message);
            continue;
          }
        }
      }

      // Re-fetch all patients
      ({ data: patients, error: patientsError } = await backendSupabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'patient'));

      if (patientsError) throw new Error(`Error fetching patients after insert: ${patientsError.message}`);
    }

    console.log(`✅ Found ${patients.length} patients. Generating records...`);

    const records: PatientRecord[] = [];

    for (const patient of patients!) {
      const patientName = `${patient.first_name} ${patient.last_name}`;
      const age = faker.number.int({ min: 18, max: 80 });
      const gender = faker.helpers.arrayElement(['male', 'female', 'other']);
      const recordCount = faker.number.int({ min: 3, max: 8 });

      for (let i = 0; i < recordCount; i++) {
        const recordTypes = ['injury', 'allergy', 'condition', 'accident'];
        const recordType = faker.helpers.arrayElement(recordTypes);
        
        let severity;
        let details: any = {
          date: faker.date.past().toISOString(),
          description: '',
          type: recordType,
        };

        switch (recordType) {
          case 'injury':
            details.description = faker.helpers.arrayElement(['Fracture', 'Sprain', 'Laceration', 'Concussion', 'Burns']);
            severity = faker.helpers.arrayElement(['mild', 'moderate', 'severe']);
            details.treatment = faker.lorem.sentence();
            break;
          case 'allergy':
            details.description = faker.helpers.arrayElement(['Peanuts', 'Penicillin', 'Latex', 'Dust', 'Pollen']);
            severity = faker.helpers.arrayElement(['mild', 'moderate', 'severe']);
            break;
          case 'condition':
            details.description = faker.helpers.arrayElement(['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis']);
            break;
          case 'accident':
            details.description = faker.helpers.arrayElement(['Car Accident', 'Fall', 'Sports Injury', 'Work Accident', 'Home Accident']);
            severity = faker.helpers.arrayElement(['mild', 'moderate', 'severe']);
            details.treatment = faker.lorem.sentence();
            break;
        }

        records.push({
          patient_id: patient.id,
          patientName,
          gender,
          age,
          record_type: recordType,
          details: { ...details, severity },
        });
      }
    }

    console.log(`📝 Inserting ${records.length} medical records...`);

    // Insert in batches to prevent overload
    const BATCH_SIZE = 100;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await backendSupabase
        .from('medical_records')
        .insert(batch);

      if (insertError) {
        console.error(`⚠️ Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError.message);
      }
    }

    console.log(`✅ Successfully seeded ${records.length} medical records!`);
  } catch (error: any) {
    console.error('❌ Error seeding data:', error.message);
  }
}

seedPatientRecords();
