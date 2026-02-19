// -----------------------------------------------------------------------------
// Google Apps Script Code for "Game Perkalian Metode Jepang/Garis"
// -----------------------------------------------------------------------------
//
// INSTRUCTIONS FOR DEPLOYMENT:
// 1. Go to https://script.google.com/
// 2. Click "New Project".
// 3. Delete any code in the editor and paste this entire code.
// 4. Update the SHEET_ID variable below with the ID from your Google Sheet URL.
//    (The ID is the long string between /d/ and /edit in the URL).
//    Example: '1QbzGmIEO5UAJZ7vNFDFAgTsYzByy2nvRAbeA9FkoUxg'
// 5. Click "Deploy" > "New deployment".
// 6. Select "Web app" as the type.
// 7. Set "Description" to "Game Data Logger".
// 8. Set "Execute as" to "Me".
// 9. Set "Who has access" to "Anyone". (This is important for the game to work without login)
// 10. Click "Deploy".
// 11. Copy the "Web App URL" provided.
// 12. Paste this URL into the `script.js` file of your game where indicated.
//
// -----------------------------------------------------------------------------

const SHEET_ID = '1QbzGmIEO5UAJZ7vNFDFAgTsYzByy2nvRAbeA9FkoUxg'; // Updated with your Sheet ID
const SHEET_NAME = 'Sheet1'; // Make sure this matches your sheet tab name

function doPost(e) {
  try {
    // 1. Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // 2. Get the spreadsheet and sheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0]; // Fallback to first sheet

    // 3. Prepare the row data
    // Expected format: timestamp, username, level, xp, score, lastUpdated
    const timestamp = new Date();
    const rowData = [
      timestamp,           // Column A: Timestamp
      data.username,       // Column B: Username
      data.level,          // Column C: Level
      data.xp,             // Column D: XP
      data.score,          // Column E: Score
      data.lastUpdated     // Column F: Last Updated (Client timestamp)
    ];

    // 4. Append the row
    sheet.appendRow(rowData);

    // 5. Return success response
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'row': rowData
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Handle GET requests (e.g., to check if the script is running)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'active',
    'message': 'Game Data Logger is running. Please use POST to send data.'
  })).setMimeType(ContentService.MimeType.JSON);
}
