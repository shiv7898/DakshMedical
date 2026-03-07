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
    // Force schema update because of missing columns like pressure_95th
    tx.executeSql('DROP TABLE IF EXISTS logs');

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER, gender TEXT, dob TEXT, address TEXT, phone TEXT, email TEXT, device_model TEXT, machine_serial TEXT)',
      []
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        usage_hours REAL DEFAULT 0,
        ahi REAL DEFAULT 0,
        cai REAL DEFAULT 0,
        oai REAL DEFAULT 0,
        leak_rate REAL DEFAULT 0,
        pressure_min REAL DEFAULT 0,
        pressure_max REAL DEFAULT 0,
        pressure_avg REAL DEFAULT 0,
        pressure_95th REAL DEFAULT 0,
        compliance INTEGER DEFAULT 0,
        machine_type TEXT,
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

      // 2️⃣ Recreate new table
      tx.executeSql(
        `CREATE TABLE logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          usage_hours REAL DEFAULT 0,
          ahi REAL DEFAULT 0,
          cai REAL DEFAULT 0,
          oai REAL DEFAULT 0,
          leak_rate REAL DEFAULT 0,
          pressure_min REAL DEFAULT 0,
          pressure_max REAL DEFAULT 0,
          pressure_avg REAL DEFAULT 0,
          pressure_95th REAL DEFAULT 0,
          compliance INTEGER DEFAULT 0,
          machine_type TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      );

      console.log("✅ New logs table created");

      // 3️⃣ Insert new file data
      logsArray.forEach(logData => {
        tx.executeSql(
          `INSERT INTO logs 
          (patient_id, date, usage_hours, ahi, leak_rate,
           pressure_min, pressure_max, pressure_avg, pressure_95th, machine_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            logData.patient_id ?? 1,
            logData.date,
            logData.usage_hours ?? 0,
            logData.ahi ?? 0,
            logData.leak_rate ?? 0,
            logData.pressure_min ?? 0,
            logData.pressure_max ?? 0,
            logData.pressure_avg ?? 0,
            logData.pressure_95th ?? (logData.pressure_max ?? 0) * 0.95,
            logData.machine_type ?? "CPAP"
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
              pressure_95th: 4.0,
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
            // Return comprehensive dummy patient for UI evaluation
            resolve({
              id: "P-78231",
              name: 'Shiv Dhakad',
              age: 32,
              gender: 'Male',
              dob: '12-Aug-1992',
              address: '102, Medical Enclave, New Delhi',
              phone: '+91 9876543210',
              email: 'daksh.singh@example.com',
              device_model: 'AirSense 11 AutoSet',
              machine_serial: 'AS11-9238-120'
            });
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

export default db;
