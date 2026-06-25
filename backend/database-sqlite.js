const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create/Connect to database file
const db = new sqlite3.Database(path.join(__dirname, 'meetings.db'));

const connectDB = async () => {
  return new Promise((resolve, reject) => {
    // Create meetings table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS meetings (
        _id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        transcript TEXT,
        summary TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `, (err) => {
      if (err) {
        console.error('❌ SQLite connection error:', err);
        reject(err);
      } else {
        console.log('✅ SQLite database connected successfully');
        console.log('📁 Database file: meetings.db');
        resolve();
      }
    });
  });
};

// Meeting model (CRUD operations)
const Meeting = {
  // Create a new meeting
  create: async (data) => {
    const id = String(Date.now());
    const meeting = {
      _id: id,
      title: data.title,
      transcript: '',
      summary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO meetings (_id, title, transcript, summary, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [meeting._id, meeting.title, meeting.transcript, meeting.summary, meeting.createdAt, meeting.updatedAt],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(meeting);
          }
        }
      );
    });
  },
  
  // Get all meetings
  find: async () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM meetings ORDER BY createdAt DESC`, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },
  
  // Get a single meeting by ID
  findById: async (id) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM meetings WHERE _id = ?`, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },
  
  // Update a meeting
  findByIdAndUpdate: async (id, data, options) => {
    return new Promise((resolve, reject) => {
      const updates = [];
      const values = [];
      
      if (data.transcript !== undefined) {
        updates.push('transcript = ?');
        values.push(data.transcript);
      }
      if (data.summary !== undefined) {
        updates.push('summary = ?');
        values.push(data.summary);
      }
      
      updates.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      db.run(
        `UPDATE meetings SET ${updates.join(', ')} WHERE _id = ?`,
        values,
        function(err) {
          if (err) {
            reject(err);
          } else {
            // Get the updated meeting
            db.get(`SELECT * FROM meetings WHERE _id = ?`, [id], (err2, row) => {
              if (err2) {
                reject(err2);
              } else {
                resolve(row);
              }
            });
          }
        }
      );
    });
  }
};

module.exports = { connectDB, Meeting };