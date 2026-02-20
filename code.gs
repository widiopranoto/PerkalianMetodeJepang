
// Configuration
const SHEET_ID = '1QbzGmIEO5UAJZ7vNFDFAgTsYzByy2nvRAbeA9FkoUxg'; // Replace with your ID if different
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Headers if not exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Username', 'Level', 'XP', 'Score', 'LastUpdated']);
    }

    const username = data.username.trim();
    if (!username) return ContentService.createTextOutput("Invalid Username");

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const existingData = sheet.getDataRange().getValues();
      let rowIndex = -1;
      let existingLevel = 1;
      let existingXP = 0;
      let existingScore = 0;

      // Search for username (skip header)
      for (let i = 1; i < existingData.length; i++) {
        if (existingData[i][1] === username) {
          rowIndex = i + 1; // 1-based index
          // Retrieve current values to compare
          existingLevel = Number(existingData[i][2]) || 1;
          existingXP = Number(existingData[i][3]) || 0;
          existingScore = Number(existingData[i][4]) || 0;
          break;
        }
      }

      const timestamp = new Date();

      // Determine new values (Prevent regression)
      // Only update if new value is greater or equal
      const newLevel = Math.max(existingLevel, Number(data.level) || 1);
      const newXP = Math.max(existingXP, Number(data.xp) || 0);
      const newScore = Math.max(existingScore, Number(data.score) || 0);

      if (rowIndex > 0) {
        // Update existing row (Level, XP, Score, LastUpdated)
        sheet.getRange(rowIndex, 3, 1, 4).setValues([[
          newLevel,
          newXP,
          newScore,
          data.lastUpdated
        ]]);
        return ContentService.createTextOutput(JSON.stringify({ status: 'updated', row: rowIndex, level: newLevel }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        // Append new row
        sheet.appendRow([
          timestamp,
          username,
          Number(data.level) || 1,
          Number(data.xp) || 0,
          Number(data.score) || 0,
          data.lastUpdated
        ]);
        return ContentService.createTextOutput(JSON.stringify({ status: 'created' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const username = e.parameter.username;

    if (action === 'login' && username) {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName(SHEET_NAME);

      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      // Search for username (skip header)
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === username) {
          // Found user!
          const userData = {
            status: 'success',
            username: data[i][1],
            level: Number(data[i][2]) || 1, // Ensure number
            xp: Number(data[i][3]) || 0,
            score: Number(data[i][4]) || 0
          };
          return ContentService.createTextOutput(JSON.stringify(userData))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'invalid_request' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
