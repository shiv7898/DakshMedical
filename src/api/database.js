import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'MedicalData.db',
    location: 'default',
  },
  () => { },
  error => {
    console.error('Error opening database: ', error);
  }
);

export const setupDatabase = () => {
  db.transaction(tx => {
    // 💡 CREATE TABLE IF NOT EXISTS ensures persistence. 
    // Data is only cleared via clearAllData() during Logout.

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_custom_id TEXT,
        name TEXT, age INTEGER, gender TEXT, dob TEXT,
        homeAddress TEXT, area TEXT, district TEXT, state TEXT, pincode TEXT,
        phone TEXT, email TEXT,
        device_model TEXT, machine_serial TEXT,
        doctor_name TEXT, doctor_phone TEXT
      )`,
      []
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, age INTEGER, gender TEXT, dob TEXT,
        homeAddress TEXT, area TEXT, district TEXT, state TEXT, pincode TEXT,
        phone TEXT, email TEXT,
        hospital TEXT, specialisation TEXT,
        qualification TEXT, experience TEXT, license TEXT
      )`,
      []
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        usage_hours REAL DEFAULT 0,
        therapy_type TEXT DEFAULT 'CPAP',
        avg_set_pressure REAL DEFAULT 0,
        pressure_min REAL DEFAULT 0,
        pressure_max REAL DEFAULT 0,
        pressure_avg REAL DEFAULT 0,
        ramp_start_pressure REAL DEFAULT 0,
        pressure_off INTEGER DEFAULT 0,
        ramp_duration INTEGER DEFAULT 0,
        avg_flow REAL DEFAULT 0,
        leak_rate REAL DEFAULT 0,
        large_leak_percent REAL DEFAULT 0,
        avg_resp_rate REAL DEFAULT 0,
        ahi REAL DEFAULT 0,
        cai REAL DEFAULT 0,
        oai REAL DEFAULT 0,
        apnea_count INTEGER DEFAULT 0,
        obstructive_count INTEGER DEFAULT 0,
        central_count INTEGER DEFAULT 0,
        hypopnea_count INTEGER DEFAULT 0,
        mask_fault_count INTEGER DEFAULT 0,
        mask_off_count INTEGER DEFAULT 0,
        low_pressure_count INTEGER DEFAULT 0,
        compliance_percent REAL DEFAULT 0,
        machine_type TEXT,
        meas_pressure_min REAL DEFAULT 0,
        meas_pressure_max REAL DEFAULT 0,
        cpap_pressure REAL DEFAULT 0,
        i_pap REAL DEFAULT 0,
        e_pap REAL DEFAULT 0,
        i_trigger REAL DEFAULT 0,
        e_trigger REAL DEFAULT 0,
        p_rise REAL DEFAULT 0,
        ti_min REAL DEFAULT 0,
        ti_max REAL DEFAULT 0,
        breath_rate REAL DEFAULT 0,
        ie_ratio REAL DEFAULT 0,
        vt REAL DEFAULT 0,
        ipap_max REAL DEFAULT 0,
        ipap_min REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`, []
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)',
      []
    );
    tx.executeSql(
      'INSERT OR IGNORE INTO users (id, username, password) VALUES (1, "d", "1")',
      []
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS machine_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`,
      []
    );
  },
    (error) => console.error('Setup Database Transaction Error:', error),
    () => console.log('Setup Database Transaction Success')
  );
};


// export const insertLog = async (logData) => {
//   console.log('SQL Attempting Insert:', logData.date);
//   return new Promise((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         `INSERT INTO logs 
//            (patient_id, date, usage_hours, ahi, leak_rate, 
//             pressure_min, pressure_max, pressure_avg, pressure_95th, machine_type) 
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           logData.patient_id ?? 1,
//           logData.date,
//           logData.usage_hours ?? 0,
//           logData.ahi ?? 0,
//           logData.leak_rate ?? 0,
//           logData.pressure_min ?? 0,
//           logData.pressure_max ?? 0,
//           logData.pressure_avg ?? 0,
//           logData.pressure_95th ?? (logData.pressure_max ?? 0) * 0.95,
//           logData.machine_type ?? "CPAP"
//         ],
//         (_, result) => {
//           console.log(`SQL Success for ${logData.date}: Row ID ${result.insertId}`);
//           resolve(result);
//         },
//         (_, error) => {
//           console.error("SQL EXECUTE ERROR:", error);
//           reject(error);
//           return false; // Prevent transaction rollback if needed, or true to rollback
//         }
//       );
//     }, (error) => {
//       console.error("DB TRANSACTION ERROR:", error);
//       reject(error);
//     }, () => {
//       // Transaction Success
//     });
//   });
// };
export const recreateLogsTableWithData = (logsArray) => {
  return new Promise((resolve, reject) => {

    db.transaction(tx => {

      console.log("🔥 Dropping old logs table...");

      // 1️⃣ Drop old table
      tx.executeSql('DROP TABLE IF EXISTS logs');

      // 2️⃣ Recreate new table with all new columns
      tx.executeSql(
        `CREATE TABLE logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          usage_hours REAL DEFAULT 0,
          therapy_type TEXT DEFAULT 'CPAP',
          avg_set_pressure REAL DEFAULT 0,
          pressure_min REAL DEFAULT 0,
          pressure_max REAL DEFAULT 0,
          pressure_avg REAL DEFAULT 0,
          ramp_start_pressure REAL DEFAULT 0,
          pressure_off INTEGER DEFAULT 0,
          ramp_duration INTEGER DEFAULT 0,
          avg_flow REAL DEFAULT 0,
          leak_rate REAL DEFAULT 0,
          large_leak_percent REAL DEFAULT 0,
          avg_resp_rate REAL DEFAULT 0,
          ahi REAL DEFAULT 0,
          cai REAL DEFAULT 0,
          oai REAL DEFAULT 0,
          apnea_count INTEGER DEFAULT 0,
          obstructive_count INTEGER DEFAULT 0,
          central_count INTEGER DEFAULT 0,
          hypopnea_count INTEGER DEFAULT 0,
          mask_fault_count INTEGER DEFAULT 0,
          mask_off_count INTEGER DEFAULT 0,
          low_pressure_count INTEGER DEFAULT 0,
          compliance_percent REAL DEFAULT 0,
          machine_type TEXT,
          meas_pressure_min REAL DEFAULT 0,
          meas_pressure_max REAL DEFAULT 0,
          cpap_pressure REAL DEFAULT 0,
          i_pap REAL DEFAULT 0,
          e_pap REAL DEFAULT 0,
          i_trigger REAL DEFAULT 0,
          e_trigger REAL DEFAULT 0,
          p_rise REAL DEFAULT 0,
          ti_min REAL DEFAULT 0,
          ti_max REAL DEFAULT 0,
          breath_rate REAL DEFAULT 0,
          ie_ratio REAL DEFAULT 0,
          vt REAL DEFAULT 0,
          ipap_max REAL DEFAULT 0,
          ipap_min REAL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      );

      console.log("✅ New logs table created");

      // 3️⃣ Insert new file data
      logsArray.forEach(logData => {
        tx.executeSql(
          `INSERT INTO logs
          (patient_id, date, usage_hours, therapy_type, avg_set_pressure,
           pressure_min, pressure_max, pressure_avg, ramp_start_pressure, pressure_off, ramp_duration,
           avg_flow, leak_rate, large_leak_percent, avg_resp_rate,
           ahi, cai, oai, apnea_count, obstructive_count, central_count,
           hypopnea_count, mask_fault_count, mask_off_count, low_pressure_count, compliance_percent, machine_type,
           meas_pressure_min, meas_pressure_max, cpap_pressure, i_pap, e_pap, i_trigger, e_trigger, p_rise, ti_min, ti_max, breath_rate, ie_ratio, vt, ipap_max, ipap_min)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            logData.patient_id ?? 1,
            logData.date,
            logData.usage_hours ?? 0,
            logData.therapy_type ?? 'CPAP',
            logData.avg_set_pressure ?? 0,
            logData.pressure_min ?? 0,
            logData.pressure_max ?? 0,
            logData.pressure_avg ?? 0,
            logData.ramp_start_pressure ?? 0,
            logData.pressure_off ?? 0,
            logData.ramp_duration ?? 0,
            logData.avg_flow ?? 0,
            logData.leak_rate ?? 0,
            logData.large_leak_percent ?? 0,
            logData.avg_resp_rate ?? 0,
            logData.ahi ?? 0,
            logData.cai ?? 0,
            logData.oai ?? 0,
            logData.apnea_count ?? 0,
            logData.obstructive_count ?? 0,
            logData.central_count ?? 0,
            logData.hypopnea_count ?? 0,
            logData.mask_fault_count ?? 0,
            logData.mask_off_count ?? 0,
            logData.low_pressure_count ?? 0,
            logData.compliance_percent ?? 0,
            logData.machine_type ?? 'CPAP',
            logData.meas_pressure_min ?? 0,
            logData.meas_pressure_max ?? 0,
            logData.cpap_pressure ?? 0,
            logData.i_pap ?? 0,
            logData.e_pap ?? 0,
            logData.i_trigger ?? 0,
            logData.e_trigger ?? 0,
            logData.p_rise ?? 0,
            logData.ti_min ?? 0,
            logData.ti_max ?? 0,
            logData.breath_rate ?? 0,
            logData.ie_ratio ?? 0,
            logData.vt ?? 0,
            logData.ipap_max ?? 0,
            logData.ipap_min ?? 0,
          ]
        );
      });

    },
      (error) => {
        console.error("❌ Transaction Failed:", error);
        reject(error);
      },
      () => {
        console.log("🚀 Table recreated and new data inserted");
        resolve();
      }
    );
  });
};
export const getLogs = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM logs ORDER BY date DESC',
        [],
        (_, results) => {
          let rows = [];
          const rowCount = results.rows.length;
          console.log(`SQL Query Success: Found ${rowCount} clinical records.`);

          if (rowCount === 0) {
            console.log('Database is empty. Providing baseline dummy record.');
            const dummyLogs = [{
              id: 9999,
              patient_id: 1,
              date: new Date().toISOString().split('T')[0],
              usage_hours: 0.0,
              ahi: 0.0,
              leak_rate: 0.0,
              pressure_min: 4.0,
              pressure_max: 4.0,
              pressure_avg: 4.0,
              machine_type: 'Click (+) to Import'
            }];
            resolve(dummyLogs);
          } else {
            for (let i = 0; i < rowCount; i++) {
              const row = results.rows.item(i);
              if (i === 0) console.log('Sample Row Schema:', Object.keys(row));
              rows.push(row);
            }
            resolve(rows);
          }
        },
        (_, error) => {
          console.error("SQL SELECT ERROR:", error);
          reject(error);
        }
      );
    });
  });
};

export const getPatientInfo = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM patients LIMIT 1',
        [],
        (_, results) => {
          if (results.rows.length > 0) {
            resolve(results.rows.item(0));
          } else {
            // Return null so profile form starts blank
            resolve(null);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const savePatientInfo = (patientData) => {
  return new Promise((resolve, reject) => {
    const params = [
      patientData?.patient_custom_id || "",
      patientData?.name || "",
      patientData?.age || "",
      patientData?.gender || "",
      patientData?.dob || "",
      patientData?.homeAddress || "",
      patientData?.area || "",
      patientData?.district || "",
      patientData?.state || "",
      patientData?.pincode || "",
      patientData?.phone || "",
      patientData?.email || "",
      patientData?.device_model || "",
      patientData?.machine_serial || "",
      patientData?.doctor_name || "",
      patientData?.doctor_phone || "",
    ];

    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM patients LIMIT 1',
        [],
        (tx, results) => {
          if (results.rows.length > 0) {
            const id = results.rows.item(0).id;
            tx.executeSql(
              `UPDATE patients SET
                patient_custom_id=?, name=?, age=?, gender=?, dob=?,
                homeAddress=?, area=?, district=?, state=?, pincode=?,
                phone=?, email=?, device_model=?, machine_serial=?,
                doctor_name=?, doctor_phone=?
               WHERE id=?`,
              [...params, id],
              (_tx, res) => resolve(res),
              (_tx, err) => {
                console.error("SQL UPDATE Error:", err);
                // Try ALTER TABLE to add missing columns (for existing DBs)
                tx.executeSql('ALTER TABLE patients ADD COLUMN patient_custom_id TEXT', [], () => { }, () => { });
                tx.executeSql('ALTER TABLE patients ADD COLUMN doctor_name TEXT', [], () => { }, () => { });
                tx.executeSql('ALTER TABLE patients ADD COLUMN doctor_phone TEXT', [], () => { }, () => { });
                reject(err || new Error("SQL UPDATE Error"));
                return true;
              }
            );
          } else {
            tx.executeSql(
              `INSERT INTO patients
                (patient_custom_id, name, age, gender, dob, homeAddress, area, district, state, pincode, phone, email, device_model, machine_serial, doctor_name, doctor_phone)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              params,
              (_tx, res) => resolve(res),
              (_tx, err) => {
                console.error("SQL INSERT Error:", err);
                reject(err || new Error("SQL INSERT Error"));
                return true;
              }
            );
          }
        },
        (_tx, err) => {
          console.error("SQL SELECT Error:", err);
          reject(err || new Error("SQL SELECT Error"));
          return true;
        }
      );
    }, (err) => {
      console.error("DB Transaction Error:", err);
      reject(err || new Error("DB Transaction Error"));
    });
  });
};

export const clearPatientInfo = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM patients', [], (_, res) => resolve(res), (_, err) => reject(err));
    });
  });
};

export const clearLogs = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM logs', [], (_, res) => resolve(res), (_, err) => reject(err));
    });
  });
};

export const clearAllData = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      console.log("☢️ NUCLEAR WIPE: Dropping all tables...");
      tx.executeSql('DROP TABLE IF EXISTS patients');
      tx.executeSql('DROP TABLE IF EXISTS doctors');
      tx.executeSql('DROP TABLE IF EXISTS logs');

      // 1. Recreate Patients
      tx.executeSql(
        `CREATE TABLE patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_custom_id TEXT,
          name TEXT, age INTEGER, gender TEXT, dob TEXT,
          homeAddress TEXT, area TEXT, district TEXT, state TEXT, pincode TEXT,
          phone TEXT, email TEXT,
          device_model TEXT, machine_serial TEXT,
          doctor_name TEXT, doctor_phone TEXT
        )`
      );

      // 2. Recreate Doctors
      tx.executeSql(
        `CREATE TABLE doctors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT, age INTEGER, gender TEXT, dob TEXT,
          homeAddress TEXT, area TEXT, district TEXT, state TEXT, pincode TEXT,
          phone TEXT, email TEXT,
          hospital TEXT, specialisation TEXT,
          qualification TEXT, experience TEXT, license TEXT
        )`
      );

      // 3. Recreate Logs
      tx.executeSql(
        `CREATE TABLE logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          usage_hours REAL DEFAULT 0,
          therapy_type TEXT DEFAULT 'CPAP',
          avg_set_pressure REAL DEFAULT 0,
          pressure_min REAL DEFAULT 0,
          pressure_max REAL DEFAULT 0,
          pressure_avg REAL DEFAULT 0,
          ramp_start_pressure REAL DEFAULT 0,
          pressure_off INTEGER DEFAULT 0,
          ramp_duration INTEGER DEFAULT 0,
          avg_flow REAL DEFAULT 0,
          leak_rate REAL DEFAULT 0,
          large_leak_percent REAL DEFAULT 0,
          avg_resp_rate REAL DEFAULT 0,
          ahi REAL DEFAULT 0,
          snore_index REAL DEFAULT 0,
          hypopnea_count INTEGER DEFAULT 0,
          mask_fault_count INTEGER DEFAULT 0,
          mask_off_count INTEGER DEFAULT 0,
          low_pressure_count INTEGER DEFAULT 0,
          compliance_percent REAL DEFAULT 0,
          machine_type TEXT DEFAULT 'CPAP',
          meas_pressure_min REAL DEFAULT 0,
          meas_pressure_max REAL DEFAULT 0,
          cpap_pressure REAL DEFAULT 0,
          i_pap REAL DEFAULT 0,
          e_pap REAL DEFAULT 0,
          i_trigger REAL DEFAULT 0,
          e_trigger REAL DEFAULT 0,
          p_rise REAL DEFAULT 0,
          ti_min REAL DEFAULT 0,
          ti_max REAL DEFAULT 0,
          breath_rate REAL DEFAULT 0,
          ie_ratio REAL DEFAULT 0,
          vt REAL DEFAULT 0,
          ipap_max REAL DEFAULT 0,
          ipap_min REAL DEFAULT 0
        )`
      );
    }, (err) => {
      console.error("❌ Full Database Wipe Failed:", err);
      reject(err);
    }, () => {
      console.log("✅ Database Nuked and Recreated Successfully");
      resolve(true);
    });
  });
};

export const getDoctorInfo = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM doctors LIMIT 1',
        [],
        (_, results) => {
          if (results.rows.length > 0) {
            resolve(results.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const saveDoctorInfo = (doctorData) => {
  return new Promise((resolve, reject) => {
    const params = [
      doctorData?.name || "",
      doctorData?.age || "",
      doctorData?.gender || "",
      doctorData?.dob || "",
      doctorData?.homeAddress || "",
      doctorData?.area || "",
      doctorData?.district || "",
      doctorData?.state || "",
      doctorData?.pincode || "",
      doctorData?.phone || "",
      doctorData?.email || "",
      doctorData?.hospital || "",
      doctorData?.specialisation || "",
      doctorData?.qualification || "",
      doctorData?.experience || "",
      doctorData?.license || "",
    ];

    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM doctors LIMIT 1',
        [],
        (tx, results) => {
          if (results.rows.length > 0) {
            const id = results.rows.item(0).id;
            tx.executeSql(
              `UPDATE doctors SET
                name=?, age=?, gender=?, dob=?, 
                homeAddress=?, area=?, district=?, state=?, pincode=?,
                phone=?, email=?, hospital=?, specialisation=?, qualification=?, experience=?, license=?
               WHERE id=?`,
              [...params, id],
              (_tx, res) => resolve(res),
              (_tx, err) => {
                console.error("SQL UPDATE Error:", err);
                reject(err || new Error("SQL UPDATE Error"));
                return true;
              }
            );
          } else {
            tx.executeSql(
              `INSERT INTO doctors
                (name, age, gender, dob, homeAddress, area, district, state, pincode, phone, email, hospital, specialisation, qualification, experience, license)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              params,
              (_tx, res) => resolve(res),
              (_tx, err) => {
                console.error("SQL INSERT Error:", err);
                reject(err || new Error("SQL INSERT Error"));
                return true;
              }
            );
          }
        },
        (_tx, err) => {
          console.error("SQL SELECT Error:", err);
          reject(err || new Error("SQL SELECT Error"));
          return true;
        }
      );
    }, (err) => {
      console.error("DB Transaction Error:", err);
      reject(err || new Error("DB Transaction Error"));
    });
  });
};

export const clearDoctorInfo = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM doctors', [], (_, res) => resolve(res), (_, err) => reject(err));
    });
  });
};

export const saveMachineSettings = (settingsData) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO machine_settings (key, value) VALUES (?, ?)`,
        ['last_uploaded_settings', JSON.stringify(settingsData)],
        (_, res) => resolve(res),
        (_, err) => {
          console.error("SQL saveMachineSettings Error:", err);
          reject(err);
        }
      );
    });
  });
};

export const getMachineSettings = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT value FROM machine_settings WHERE key = ?`,
        ['last_uploaded_settings'],
        (_, results) => {
          if (results.rows.length > 0) {
            try {
              resolve(JSON.parse(results.rows.item(0).value));
            } catch (e) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          console.error("SQL getMachineSettings Error:", error);
          reject(error);
        }
      );
    });
  });
};

export default db;
