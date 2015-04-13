function myFunction(){
  
  // initialize prompt
  function onOpen() {
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
    .createMenu('Custom Menu')
    .addItem('Show prompt', 'showPrompt')
    .addToUi();
  }
  
  // ask for a date range 
  function showPrompt(dateRange) {
    var ui = SpreadsheetApp.getUi(); // Same variations.
    var result = ui.prompt(
      "Please enter the "+ dateRange +" day of the pay period.",
      'Use the format M/D/YYYY (i.e. 6/21/2014 )',
      ui.ButtonSet.OK_CANCEL);
    
    // Process the user's response.
    var button = result.getSelectedButton();
    var text = result.getResponseText();
    
    return text;
  }
  
  // set the spreadsheet id
  var spreadSheetID = 'YOURSPREADSHEETIDHERE';
  
  // open google spreadsheet named fieldGuide
  var doc = SpreadsheetApp.openById(spreadSheetID);
  
  // select active sheet
  var sheet = doc.getSheets()[0];

  
  onOpen();
  // get first day of range
  var date1 = showPrompt('first');
  // get last day of range
  var date2 = showPrompt('last');
  
  var ui = SpreadsheetApp.getUi();
  
  // tell user which dates they have selected
  ui.alert('You selected ' + date1 + ' through ' + date2 + ". Hit ok to continue.");
  
  // convert first and last day into a formate we can more easily compare
  // i.e. june 1, 2014 is converted to 20140601
  var firstDate = new Date( date1);
  firstDate = Utilities.formatDate(firstDate, 'GMT', 'yyyyMMdd');
  var lastDate = new Date( date2 );
  lastDate = Utilities.formatDate(lastDate, 'GMT', 'yyyyMMdd');
  //Logger.log(firstDate + ' is first and ' + lastDate + ' is last');
  
  
  // find how many columns there are
  var lastColumn = sheet.getLastColumn();
  // find how many rows there are
  var lastRow = sheet.getLastRow();
  
  // iterate through letters. use this for column index
  function nextChar(c) {
    if(c=="Z"||c=='z'){
      return "AA";
    }
    if(c.length > 1){
      return "A"+String.fromCharCode(c.charCodeAt(1)+1);
    }
    /*if(!isNaN(c)){
      c = numToLetter(c);
    }
    Logger.log('Evaluate next character of: '+c);*/
    return String.fromCharCode(c.charCodeAt(0) + 1);
  }
  
  //convert column number to letter
  function numToLetter(c){
    //Logger.log('The letter input is: '+c);
    if(c>25){
      return 'A'+String.fromCharCode('a'.charCodeAt(1) + c);
    }
    return String.fromCharCode('a'.charCodeAt(0)+c);
  }
  
  //find index of first date
  var startingRow = 2;
  var resultBool = true;
  while ( resultBool ){
    var getDate = new Date( sheet.getRange('C'+startingRow).getValue() );
    var theDay = Utilities.formatDate( getDate, 'GMT', 'dd')+'';
    var theMonth = Utilities.formatDate( getDate, 'GMT', 'MM')+'';
    var theYear = Utilities.formatDate( getDate, 'GMT', 'yyyy')+'';
    
    // full date from each row in yyyyMMdd formate
    var fullDate = theYear+theMonth+theDay;
    //Logger.log(fullDate+" vs "+firstDate);
    if (fullDate < firstDate){
      startingRow++;
    }else{
      resultBool = false;
    }
  }
  
  // let's find the index of the last date 
  var endingRow = 2;
  var resultBool = true;
  while ( resultBool ){
    var getDate = new Date( sheet.getRange('C'+endingRow).getValue() );
    var theDay = Utilities.formatDate( getDate, 'GMT', 'dd')+'';
    var theMonth = Utilities.formatDate( getDate, 'GMT', 'MM')+'';
    var theYear = Utilities.formatDate( getDate, 'GMT', 'yyyy')+'';
    
    // full date from each row in yyyyMMdd format
    var fullDate = theYear+theMonth+theDay;
    
    if (fullDate > lastDate){
      endingRow--;
      resultBool = false;
    }else{
      endingRow++;
    }
  }
  
  
  // make a new sheet with the name being the title
  var destination = SpreadsheetApp.openById(spreadSheetID);
  // set name to be the range of dates
  var newSheetName = date1 +' - '+date2;

  sheet.copyTo(destination).setName(newSheetName);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setActiveSheet(ss.getSheetByName(newSheetName));
  
  // now to delete the rows we don't need
  if(startingRow>2){
    var numToRemove = startingRow-2;
    ss.deleteRows(2,numToRemove);
  }
  
  if(endingRow>startingRow){
    var numToRemove2 = lastRow - endingRow + 1;
    //Logger.log(' number2 to remove is ' + numToRemove2);
    //Logger.log(' last row: '+lastRow+' starting row: '+startingRow+' endingRow: '+endingRow);
    ss.deleteRows(endingRow-startingRow+3,numToRemove2);
  }
  
  var newLastColumn = ss.getLastColumn();
  
  
  //Logger.log('ending Row is '+endingRow+' and startingRow is '+startingRow);
  
  var char="a";
  var employeeCount = 0;
  var firstIndex = 0;
  var employeeArray = [];
  
  // get first index of first person working AND find how many employees there are
  for ( i=0;i<lastColumn;i++){
    var cellContents = ss.getRange(char+'1').getValue();
    var cellContentsResults = cellContents.search( 'Who was working?' );
    if ( cellContentsResults == 0.0 ){
      // if positive match, we add the employee name to an array
      // first we strip the first part that says "who was working? ["
      var employeeName = cellContents.substr(18);
      //then we remove the last "]"
      employeeName = employeeName.substr(0, employeeName.length - 1);
      // here we add to the filtered result to the array
      employeeArray.push( employeeName );
      
      // and increase the employee count
      employeeCount++;
      // iff the first index is 0, set it to the first instance we found an employee
      if ( firstIndex == 0 ){
        firstIndex = i;
      }
    }
    char = nextChar(char);
  }
  
  // using index of first employee, get index of last employee
  var tempIndex = numToLetter(firstIndex);
  var lastIndex = String.fromCharCode( tempIndex.charCodeAt(0)+employeeCount-1 );
  
  // make new cell and populate with data in this spot - global function
  function makeNewColumn( newRow, newCol, newData, ss ){
    var range = newCol + newRow;
    ss.getRange(range).setValue(newData);
  }
  
  var numberOfDays = ss.getLastRow() - 1;
  Logger.log('number of days is '+numberOfDays);
  // add new blank columns for each employee, total points, point value
  //var totalNewColumns = employeeCount + 2;
  //sheet.insertColumnsAfter(lastColumn, totalNewColumns);
  
  // process one row at a time, for however many days you would like
  for ( j = 2; j < 2 + numberOfDays; j++ ){
  
    // get indexes of main columns as variables global to the row only
    var pointValue = 0;
    var totalTips = 0;
    var totalPoints = 0;
    var row = j;
    var totalColumns;
    
    // make new column labels
    
    // TOTAL POINTS
    var totalPointsCol = numToLetter(lastColumn);
    makeNewColumn ( 1, totalPointsCol , 'Total Points:', ss );
    // TOTAL TIPS
    var totalTipsCol = nextChar(totalPointsCol);
    makeNewColumn ( 1, totalTipsCol , 'Total Tips:', ss );
    // POINT VALUE
    var pointValueCol = numToLetter(lastColumn+2);
    makeNewColumn ( 1, pointValueCol, 'Point Value:', ss );
    
    // EMPLOYEE LABELS
    var employeeInsertPoint = numToLetter( lastColumn+3 );
    for (m = 0; m<employeeCount; m++){
      makeNewColumn( 1, employeeInsertPoint, employeeArray[m], ss );
      employeeInsertPoint = nextChar(employeeInsertPoint);
    }
    
    // calculate total tips for each row: cash + credit
    function getTotalTips ( tipRow, creditCol, cashCol, ss ){
      var totalTips = 0;
      if( ss.getRange(cashCol+tipRow).getValue() ){
        totalTips += ss.getRange(cashCol+tipRow).getValue();
      }
      if( ss.getRange(creditCol+tipRow).getValue() ){
        totalTips += ss.getRange(creditCol+tipRow).getValue();
      }
      return totalTips;
    }
    totalTips = getTotalTips(row, 'E', 'F', ss );
    makeNewColumn( row, totalTipsCol, totalTips, ss);

    function getTotalPoints ( startIndex, endIndex, rowIndex, ss ){
      var totalPoints=0;
      for( k=startIndex; k<=endIndex; k = nextChar(k) ){
        if( !isNaN( ss.getRange(k+rowIndex).getValue() ) ){
          totalPoints = totalPoints + ss.getRange(k+rowIndex).getValue();
        }
      }
      return totalPoints;
    }
    
    // get index of first employee and convert to a letter column
    var firstEmployee = numToLetter(firstIndex);
    
    // get point total for each row
    var pointTotal = getTotalPoints( firstEmployee, lastIndex, row, ss );
    makeNewColumn( row , totalPointsCol, pointTotal, ss );
    
    
    var pointValue = Math.floor( (totalTips / pointTotal) * 100 ) / 100;
    makeNewColumn( row, pointValueCol, pointValue, ss);

    // calculate tip share for each person
    function calcTipShare ( colIndex, rowIndex, ss, pointValue ){
      
      function makeNewColumn( newRow, newCol, newData, ss ){
        var range = newCol + newRow;
        ss.getRange(range).setValue(newData);
      }
      
      var insertionIndex = numToLetter( colIndex );
      var employeePoints = firstEmployee;
      //Logger.log('Column index is '+colIndex);
      for ( k=colIndex+1; k<colIndex+employeeCount+1; k++ ){
        
        if ( !isNaN(ss.getRange( employeePoints + rowIndex ).getValue() ) ){
          var tipShare = ss.getRange( employeePoints + rowIndex ).getValue() * pointValue;
        }
        
        // this function rounds DOWN to two decimal places
        tipShare = Math.floor( tipShare * 100 ) / 100;
        makeNewColumn( rowIndex, insertionIndex, tipShare, ss );
        employeePoints = nextChar(employeePoints);
        insertionIndex = nextChar(insertionIndex);
      }
    }
    calcTipShare ( lastColumn+3, row, ss, pointValue );
    
  }
  
  // find the new last row
  var newLastRow = ss.getLastRow();
  
  Logger.log('new last row is '+newLastRow+' and new last column is '+newLastColumn);
  // Now that all the tips are up, let's calculate the total from each column!
  var startChar = numToLetter(newLastColumn);
  for ( k = 0; k<employeeCount+3; k++ ){
    var columnTotal = 0;
    for( j = 2; j<=newLastRow; j++){
      //Logger.log("Start char is: "+startChar);
      columnTotal += ss.getRange(startChar+j).getValue();
    }
    makeNewColumn( newLastRow+1, startChar, columnTotal, ss );
    startChar=nextChar(startChar);
  }
  
}