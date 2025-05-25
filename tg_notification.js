/** Note that a user must first interact with the Telegram bot "Result Notification Bot" in order to recieve messages from said bot **/
var TELEGRAM_BOT_TOKEN = ''; //replace with you telegram bot token
var TELEGRAM_API_URL = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';


/**
 * Recall that in order to trigger the script upon cell edit, you must manually set the trigger in the Apps Script
 * Go to Triggers, Add a trigger, choose the "atEdit" function and set the trigger to "on Edit", and allow authorization upon saving
 */
function atEdit(e) {
  var sheet = e.source.getSheetByName('Pairings'); // Sheet where the edit happens
  var editedRange = e.range;

  //defining the columns that trigger the notification (White result column 3, Black result column 6)
  var triggerColumns = [3, 6];

  /**
  * This condition does nothing if the edited row is the first row(header row)
  * you can edit this "if statement" out if the first row contains player data and must be monitored for edits.
  * To do so delete it or simply encase the "if statement" and its brackets in the syntax /* */     /*much like this comment*/
  if (editedRange.getRow() === 1){
    return;
  }

  /** If the edit is not in the specified columns, return early */ 
  if (triggerColumns.indexOf(editedRange.getColumn()) === -1) return;

  var playerName = '';
  var telegramUserId = '';
  var resultValue = editedRange.getValue(); //to send with the Telegram message


  /**
   * Defining the columns for the "Result" & "Player name" on the Pairings Sheet
   * Edit these values to fir the corresponding column format of the Sheet
   * Such that column A = 1, column B = 2, etc.
   * */
  if (editedRange.getColumn() === 3) {
    //White player result is in Column 3, White player name is in Column 4
    playerName = sheet.getRange(editedRange.getRow(), 4).getValue();
  } 
  else if (editedRange.getColumn() === 6) {
    //Black player result is in Column 4, Black player name is in Column 6
    playerName = sheet.getRange(editedRange.getRow(), 7).getValue();
  }


  //removing the score part (the decimal inside parentheses) from the player name using regex
  playerName = playerName.replace(/\s\(\d+\.\d+\)/, '').trim(); //remove the score

  //looking up the USCF ID from Wall Chart Sheet
  var uscfId = getUSCFId(playerName);

  if (!uscfId) return;  //if no uscf id found do nothing

  //getting Telegram User ID from Information Sheet
  telegramUserId = getTelegramUserId(uscfId);

  //sending message if telegram user id and name are found
  if (telegramUserId && playerName) {
    sendTelegramNotification(telegramUserId, playerName, resultValue);
  }
}


/**
 * This function gets the USCF id from a named Sheet based on a player's name
 * Rename the string inside getSheetByName('') to your appropriate Sheet's name, assure to encase the name in single quotes 
 */
function getUSCFId(playerName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Wall Chart');
  var data = sheet.getDataRange().getValues();
 
  for (var i = 0; i < data.length - 1; i++) { // Ensure we don't go out of bounds
    if (data[i][1] === playerName) { // Player Name is in column B

      //getting USCF ID and ELO from the cell in the row directly below the player name, in column B
      var uscfCell = data[i + 1][1];
      
      //using regex to extract USCF ID (second part after the space)
      var match = uscfCell.match(/\d{3,4}\s(\d+)/); //elo can be a 3 or 4 digit integer
      
      if (match && match[1]) {
        return match[1]; // Return the USCF ID (captured group 1)
      }

      return uscfId; // Return the USCF ID
    }
  }
  
  return null; // Return null if no matching player name is found
}


/**
 * This function gets the Telegram user id from a named Sheet based on a player's USCF id
 * Rename the string inside getSheetByName('') to your appropriate Sheet's name, assure to encase the name in single quotes 
 */
function getTelegramUserId(uscfId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Information');
  var data = sheet.getDataRange().getValues();
  
  //define the columns containing corresponding data
  var uscfIdColumn = 2; // Column index for USCF ID (Column A)
  var telegramUserIdColumn = 1; // Column index for Telegram User ID (Column C)

  //looping through the data to find the matching USCF ID
  for (var i = 0; i < data.length; i++) {
    // Check if the USCF ID matches
    if (data[i][uscfIdColumn] == uscfId) { // USCF ID is in Column A
    
      // If a match is found, return the corresponding Telegram User ID
      return data[i][telegramUserIdColumn];
    }
  }
  
  return null; // Return null if no matching USCF ID is found
}


/**
 * This function sends the Telegram message, edit the "messageToSend" variable appropriately
 * Use single quptes to encase your desired message
 */
function sendTelegramNotification(telegramUserId, playerName, resultValue) {
  var messageToSend = playerName + ' has finished their game.' + ' Their result is: '+ resultValue;
  
  var payload = {
    chat_id: telegramUserId,
    text: messageToSend
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(TELEGRAM_API_URL, options);
}