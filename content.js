/*
  _________              .__  ___________                           .__ 
 /   _____/____     ____ |__| \_   _____/__  _________  ____   ____ |__|
 \_____  \\__  \   / ___\|  |  |    __)_\  \/ /\_  __ \/  _ \ /    \|  |
 /        \/ __ \_/ /_/  >  |  |        \\   /  |  | \(  <_> )   |  \  |
/_______  (____  /\___  /|__| /_______  / \_/   |__|   \____/|___|  /__|
        \/     \//_____/              \/                          \/    
_______________   ________  ________   __________  ________ ____ ___    
\_____  \   _  \  \_____  \ \_____  \  \______   \/  _____/|    |   \   
 /  ____/  /_\  \  /  ____/   _(__  <   |    |  _/   \  ___|    |   /   
/       \  \_/   \/       \  /       \  |    |   \    \_\  \    |  /    
\_______ \_____  /\_______ \/______  /  |______  /\______  /______/     
        \/     \/         \/       \/          \/        \/             
/*/

// Initialize show variable
let show, RECENTcontainer,EXDOWNLDRcontainer,AVGcontainer;  

// Load settings or set default if first time
chrome.storage.sync.get(['show','RECENTcontainer', 'EXDOWNLDRcontainer', 'AVGcontainer'], (result) => {
    if (result.show === undefined) {
        // First time user - set default to true
        chrome.storage.sync.set({ show: true });
        show = true;
    } else {
        // Returning user - use their saved preference
        show = result.show;
  }
  if (result.RECENTcontainer === undefined) {
    chrome.storage.sync.set({ RECENTcontainer: true });
    RECENTcontainer = true;
} else {
    RECENTcontainer = result.RECENTcontainer;
}

if (result.EXDOWNLDRcontainer === undefined) {
    chrome.storage.sync.set({ EXDOWNLDRcontainer: true });
    EXDOWNLDRcontainer = true;
} else {
    EXDOWNLDRcontainer = result.EXDOWNLDRcontainer;
}

if (result.AVGcontainer === undefined) {
    chrome.storage.sync.set({ AVGcontainer: true });
    AVGcontainer = true;
} else {
    AVGcontainer = result.AVGcontainer;
}
    updateExtensionVisibility();
});


// Listen for settings changes from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateShow") {
        show = request.show;
        updateExtensionVisibility();
  }
  if (request.action === "updateRECENTcontainer") {
    RECENTcontainer = request.RECENTcontainer;
    updateExtensionVisibility();
  }
  if (request.action === "updateEXDOWNLDRcontainer") {
    EXDOWNLDRcontainer = request.EXDOWNLDRcontainer;
    updateExtensionVisibility();
  }
  if (request.action === "updateAVGcontainer") {
    AVGcontainer = request.AVGcontainer;
    updateExtensionVisibility();
  }
});

// Function to update extension visibility based on show variable
function updateExtensionVisibility() {
    const containerDiv = document.getElementById('course-tracker-extension');
    const containersWrapper = document.getElementById('containers-wrapper');
    const toggleButton = document.getElementById('toggle-button');

    if (!containerDiv) {
        // If elements don't exist yet, inject them
        injectContainers();
        // Get references after injection
        const newContainersWrapper = document.getElementById('containers-wrapper');
        const newToggleButton = document.getElementById('toggle-button');
        if (show) {
            // Show everything by default
            newContainersWrapper.style.display = 'flex';
            newToggleButton.querySelector('img').src = chrome.runtime.getURL('assets/logo.png');
        } else {
            // Only show button with logo
            newContainersWrapper.style.display = 'none';
            newToggleButton.querySelector('img').src = chrome.runtime.getURL('assets/logo.png');
        }
    } else {
      // Elements already exist, just update their visibility
        if (show) {
            containerDiv.style.display = ''; // Show the main container
            containersWrapper.style.display = 'flex';
            toggleButton.querySelector('img').src = chrome.runtime.getURL('assets/logo.png');
        } else {
            containerDiv.style.display = ''; // Keep main container visible
            containersWrapper.style.display = 'none';
            toggleButton.querySelector('img').src = chrome.runtime.getURL('assets/show.png');
        }
    }
}

let empty = true;

function findSem(lines, i) {
  // Loop while i is greater than or equal to 0
  while (i >= 0) {
    // Check the current line for "sem a", "sem b", or "sem c"
    if (lines[i].includes("סמסטר א"))
      return "1:0:4";
    else if(lines[i].includes("סמסטר ב"))
      return "2:0:4";
    else if(lines[i].includes("סמסטר קיץ")) {
      return "3:0:4";
    }
    // Decrement i to move to the previous line
    i--;
  }
  // If none of the specified strings are found, return null or an appropriate value
  return null;
}

function base64Decode(str) {
  try {
      // Decode Base64-encoded string
      return atob(str);
  } catch (error) {
      console.error("Invalid Base64 string:", error);
      return null;
  }
}


function base64Encode(str) {
  let base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64Str = '';

  for (let i = 0; i < str.length; i += 3) {
    let chunk = str.slice(i, i + 3);
    let chunkBytes = chunk.split('').map(c => c.charCodeAt(0));
    let encodedBytes = [];

    encodedBytes.push((chunkBytes[0] & 0xfc) >> 2);
    encodedBytes.push(((chunkBytes[0] & 0x03) << 4) | ((chunkBytes[1] & 0xf0) >> 4));
    encodedBytes.push(((chunkBytes[1] & 0x0f) << 2) | ((chunkBytes[2] & 0xc0) >> 6));
    encodedBytes.push(chunkBytes[2] & 0x3f);

    // Pad the encoded bytes with '=' as necessary
    if (chunk.length < 3) {
      encodedBytes[3] = 64;
      if (chunk.length == 1) {
        encodedBytes[2] = 64;
      }
    }

    base64Str += encodedBytes.map(b => base64Chars[b]).join('');
  }

  return base64Str;
}

function insertNoExamsMessage() {
    const courseList = document.querySelector('#course-list');

    if (courseList) {
        // If the course list is found, proceed with your logic
        let noExamsMessage = `
            <div class="not-found-container">
                <h1>אין מחברות לחשוף</h1>
                <p>לא נורא חבר, תמשיך לבדוק ואל תוותר</p>
            </div>`;

        // Check if the course list is empty
        if (courseList.children.length === 0) {
            courseList.innerHTML = noExamsMessage; // Insert the no exams message
           //Inserted no exams message
        } else {
            //"Course list is not empty. 
        }
    }
}


function addToList(name, date, link) {
  empty = false;
  const courseList = document.getElementById('course-list');
  // If the course list is found, proceed to add the new item
  if (courseList) {
      // Define the HTML template for the new list item
      const newItem = `
      <li class="course-item">
          <span class="course-name">${name}</span> 
          <span class="course-date">${date}</span> 
          <div class="HTable">
              <div class="Row">
                  <div class="Cell">
                      <form action="exam.php" method="POST">
                          <input type="submit" name="toopen:2:3" value="משוך בגזר" class="buttonLongEntry">
                          <input type="hidden" name="expars" value="${link}">
                      </form>
                  </div>
              </div>
          </div>
      </li>`;

      // Add the new course item
      courseList.innerHTML += newItem;
      //console.log("Added new course item:", newItem);
  } else {
      //console.log("Course list is not yet available.");
  }
}

function addToLinksList(name, date, link) {
  empty = false;
  const linksList = document.getElementById('links-list');
  // If the course list is found, proceed to add the new item
  if (linksList) {
      // Define the HTML template for the new list item
      const newItem = `
      <li class="links-list" style="display: flex; justify-content: center; align-items: center;border-bottom: 1px solid #ccc; padding: 0px;">
          <span class="course-name">${name}</span> 
          <span class="course-date">${date}</span> 
          <div class="HTable">
              <div class="Row">
                  <div class="Cell">
                      <form action="exam.php" method="POST">
                          <input type="submit" name="toopen:2:3" value="הורדה" class="buttonSmallEntry">
                          <input type="hidden" name="expars" value="${link}">
                      </form>
                  </div>
              </div>
          </div>
      </li>`;

      // Add the new course item
      linksList.innerHTML += newItem;
      //console.log("Added new course item:", newItem);
  } else {
      //console.log("Course list is not yet available.");
  }
}

function findHiddenExams() {
  let id = '333333333';
  let lines = document.documentElement.outerHTML.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(' המחברת טרם נסרקה ') || lines[i].includes(' פרסום ')) {
      let course = '', sem = '', date = '',moed = '',name = '',mo_name = 'מועד ';
      
      if (lines[i].includes('<td dir="ltr"><span class="hebText"')) {
        reg0 = /(\d{4})/;  // matches four digits in a row
        year = lines[i].match(reg0);
        if(year) {date=year[1];}
      }
      if (i >= 2 && lines[i-2].includes('<span class="hebText">')) {
        let reg = /<span class="hebText">(\d+)<\/span>/;
        let coNum = lines[i-2].match(reg);
        if (coNum) {  course = coNum[1]; }
      }
      if (i >= 1 && (lines[i-1].includes('סמסטר') || lines[i-1].includes('חריגה'))) {
        let reg_ = /<span class="hebText">(\D+)<\/span>/;
        let coName = lines[i-1].match(reg_);
          if (coName) { name = coName[1]; }
        let line = lines[i-1];
        reg1 = /סמסטר\s+(.)/; 
        sem = line.match(reg1);
        if ((sem && sem[1] == "א") || lines[i - 7].includes('סמסטר א') || lines[i + 5].includes('סמסטר א')) { sem = "1:0:1"; }
        else if ((sem && sem[1] == "ב") || lines[i - 7].includes('סמסטר ב') || lines[i + 5].includes('סמסטר ב')) { sem = "2:0:2"; }
        else if (line.includes("חריגה")) {
          sem = findSem(lines, i - 1)
        }
        let reg2 = /.*class="hebText">(.+)<\/span><\/td>$/;
        let Rmoed = line.match(reg2);
       if (Rmoed && Rmoed[1] =="א'") { moed="1:1"; mo_name+='א'}
       else if (Rmoed && Rmoed[1] == "ב'") { moed = "1:2"; mo_name += 'ב' }
       else if (Rmoed && Rmoed[1] == "ד'") { moed = "1:4"; mo_name += 'ד' }
       else if (line.includes("בוחן 1")) { moed="1:11"; sem = sem.substring(0, 4) + "4"; mo_name='בוחן'}
       else { moed = "1:3"; mo_name += 'מיוחד'; }
      }
      let encode = id + ":" + date + ":" + sem + ":" + course + ":" + moed;
      let link=base64Encode(encode);
      addToList(name, mo_name, link);
    }
  }
  // observer.observe(document.body, { childList: true, subtree: true });
  if (empty) {
  // Also, check immediately in case the element is already there
  insertNoExamsMessage(); // Start the checking process
  }
  //plus button:
  // Attach the event listener programmatically
  document.querySelector('.plus-icon').addEventListener('click', toggleFastLinks);
}

function isSameDay(dateToCheck) {
  const currentDate = new Date(); // Get the current date

  // Extract year, month, and day from the current date
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // Note: Months are zero-indexed (0 = January, 11 = December)
  const currentDay = currentDate.getDate();

  // Extract year, month, and day from the date to check
  const checkYear = dateToCheck.getFullYear();
  const checkMonth = dateToCheck.getMonth();
  const checkDay = dateToCheck.getDate();

  // Compare the year, month, and day
  return currentYear === checkYear && currentMonth === checkMonth && currentDay === checkDay;
}

function findAllDownloadableExams() {
    let id = '333333333';
    const results = [];
    // Find all rows that contain the submit button with "קובץ המחברת"
    const submitButtons = Array.from(document.querySelectorAll('input[type="submit"]'))
        .filter(button => button.value === 'קובץ המחברת');
    
    submitButtons.forEach(button => {
        const row = button.closest('tr');
        if (!row) return;
        const curr_link = button.getAttribute('name'); 
        // Get all hebText spans in this row
        const hebTextSpans = Array.from(row.querySelectorAll('span.hebText'));
        // The course name is typically the first meaningful hebText in the row
        const curr_name = hebTextSpans.find(span => 
            span.textContent.trim() && 
            !span.textContent.match(/^\d/) && // Skip if it starts with a number
            !span.textContent.includes('/') // Skip if it's a date
        )?.textContent.trim();
        // Find the date
        let curr_date = null;
        for (let i = 0; i < hebTextSpans.length; i++) {
            if (hebTextSpans[i].textContent.includes('סמסטר') || hebTextSpans[i].textContent.includes('חריגה')) {
                curr_date = hebTextSpans[i + 1]?.textContent.trim();
                break;
            }
        }
      if (curr_link && curr_name && curr_date) {
        let link = curr_link.replace('ex', '');
        link.replace('=','');
        link = base64Encode(id +":"+base64Decode(link));
            // results.push({
            //     link: link,
            //     name: curr_name,
            //     date: curr_date
        // });
        addToLinksList(curr_name, curr_date, link);
        }
    });
    
    // Return results in case you want to use them programmatically
    return results;
}

//let grade = '', date_str = '',date = '', course_name = '';


// Function to find the most recent date after "ציון בחינה" and extract the line before any 1-2 digit number
function findMostRecentGradePublished() {
  // Get all span elements with class 'hebText'
  const textElements = document.querySelectorAll('span.hebText');
  
  // Initialize variables outside any loops to maintain state
  let mostRecentDate = null;
  let currentGrade = null;
  let currentCourseName = null;
  let grade = null;
  let course_name = null;
  let date = null;
  let date_str = null;
  
  // Regular expression to match 1 or 2 digits (0-99)
  const digitPattern = /^\d{1,2}$/;
  
  // Process elements in sequential order
  for (let i = 0; i < textElements.length; i++) {
    const elementText = textElements[i].innerText.trim();
    
    // Check for grade publication
    if (elementText.includes('ציון בחינה')) {
      // Extract grade
      const numberMatch = elementText.match(/\d+/);
      if (numberMatch) {
        currentGrade = numberMatch[0];
        
        // Look backward for course name
        for (let j = i - 1; j >= 0; j--) {
          const previousText = textElements[j].innerText.trim();
          
          if (digitPattern.test(previousText)) {
            if (j > 0) {
              currentCourseName = textElements[j - 1].innerText.trim();
              break;
            }
          }
        }
        
        // Look forward for date
        for (let k = i + 1; k < textElements.length; k++) {
          const dateText = textElements[k].innerText.trim();
          const dateParts = dateText.split(" ");
          
          if (dateParts.length >= 2) {
            const date = dateParts[0].split("/");
            const time = dateParts[1];
            
            // Validate date format (DD/MM/YYYY HH:MM:SS)
            if (date.length === 3 && 
                time && 
                date[0].length === 2 && 
                date[1].length === 2 && 
                date[2].length === 4) {
              
              const formattedDate = `${date[2]}-${date[1]}-${date[0]}T${time}`;
              const currentDate = new Date(formattedDate);
              
              // If valid date and more recent than previous
              if (!isNaN(currentDate.getTime())) {
                if (!mostRecentDate || currentDate > mostRecentDate) {
                  mostRecentDate = currentDate;
                  grade = currentGrade;
                  course_name = currentCourseName;
                }
                break; // Exit after finding the first valid date
              }
            }
          }
        }
      }
    }
  }
  
  // Format output if date was found
  if (mostRecentDate) {
    date = mostRecentDate.toString();
    date_str = mostRecentDate.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    return {
      date,
      date_str,
      grade,
      course_name
    };
  } else {
    //console.log("No valid dates found after 'ציון בחינה'.");
    return null;
  }
}

function calculateAverage(grades) {
  const average = Object.values(grades).reduce((acc, { grade }) => acc + grade, 0) / Object.keys(grades).length;
  return average.toFixed(2);
}

// Global variable to store grades
let globalGrades = {};

// Function to create and inject the UI elements
function injectUI(avgValueElement) {
  // Create container around existing avgValueElement
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.width = '100%';
  container.style.position = 'relative';
  
  // Create a wrapper for the grade that takes full width
  const gradeWrapper = document.createElement('div');
  gradeWrapper.style.width = '100%';
  gradeWrapper.style.display = 'flex';
  gradeWrapper.style.justifyContent = 'center';
  
  // Edit button positioned absolutely
  const editButton = document.createElement('button');
  editButton.style.position = 'absolute';
  editButton.style.left = '0';
  editButton.style.top = '50%';
  editButton.style.transform = 'translateY(-50%)';
  editButton.style.background = 'none';
  editButton.style.border = 'none';
  editButton.style.padding = '0';
  editButton.style.cursor = 'pointer';
  editButton.style.display = 'flex';
  editButton.style.alignItems = 'center';
  editButton.style.zIndex = '1';

  // Create image inside button
  const editImg = document.createElement('img');
  editImg.src = chrome.runtime.getURL('assets/edit.png');
  editImg.style.width = '20px';
  editImg.style.height = '20px';
  editButton.appendChild(editImg);
  
  // Editor container
  const editorContainer = document.createElement('div');
  editorContainer.style.display = 'none';
  editorContainer.style.position = 'absolute';
  editorContainer.style.backgroundColor = 'white';
  editorContainer.style.padding = '15px';
  editorContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  editorContainer.style.borderRadius = '8px';
  editorContainer.style.zIndex = '1000';
  editorContainer.style.marginTop = '5px';
  
  // Replace the avgValueElement with our container
  avgValueElement.parentNode.insertBefore(container, avgValueElement);
  
  // Append elements in the desired order
  gradeWrapper.appendChild(avgValueElement);
  container.appendChild(gradeWrapper);
  container.appendChild(editButton);
  container.appendChild(editorContainer);
  
  return { avgValueElement, editButton, editorContainer };
}

function createEditorUI(grades, editorContainer) {
  editorContainer.innerHTML = '';

  // Set editor container properties to handle overflow and scrolling
  editorContainer.style.maxHeight = '150px';  // Set max height for the container
  editorContainer.style.overflowY = 'auto';  // Enable vertical scrolling if needed
  editorContainer.style.width = '100%';  // Ensure it takes the full width of parent
  editorContainer.style.boxSizing = 'border-box';

  // Create header with fixed column sizes
  const header = document.createElement('div');
  header.style.marginBottom = '3px';
  header.style.fontWeight = 'bold';
  header.style.display = 'grid';
  header.style.fontSize = '10px';
  header.style.gridTemplateColumns = 'minmax(90px, 1fr) 40px 30px 10px'; // Adjusted for course name
  header.style.gap = '3px';
  header.innerHTML = `
    <span>קורס</span>
    <span>ציון</span>
    <span>נק"ז</span>
    <span>לכלול</span>
  `;
  editorContainer.appendChild(header);

  // Create course list
  Object.entries(grades).forEach(([course, data]) => {
    const courseRow = document.createElement('div');
    courseRow.style.display = 'grid';
    courseRow.style.gridTemplateColumns = 'minmax(90px, 1fr) 40px 30px 10px'; // Match header columns
    courseRow.style.gap = '3px';
    header.style.fontSize = '10px';
    courseRow.style.marginBottom = '3px';
    courseRow.style.padding = '3px';
    courseRow.style.backgroundColor = '#f5f5f5';
    courseRow.style.borderRadius = '4px';
    courseRow.style.alignItems = 'center'; // Vertically center items

    // Ensure the row takes full width, and inputs are flexible
    courseRow.innerHTML = `
      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;font-size: 10px;">${course}</span>
      <input type="number" value="${data.grade}" min="0" max="100" class="grade-input" style="width: 100%; box-sizing: border-box; padding: 2px;font-size: 10px;">
      <input type="number" value="${data.weight || 1}" min="0" max="10" class="weight-input" style="width: 100%; box-sizing: border-box; padding: 2px;font-size: 10px;">
      <input type="checkbox" checked class="include-checkbox" style="margin: 0 auto;">
    `;
    editorContainer.appendChild(courseRow);
  });

  // Create buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.marginTop = '15px';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';

  const applyButton = document.createElement('button');
  applyButton.textContent = '✓';
  applyButton.style.padding = '8px 16px';
  applyButton.style.cursor = 'pointer';
  applyButton.style.border = 'none';
  applyButton.style.borderRadius = '4px';
  applyButton.style.backgroundColor = '#4CAF50';
  applyButton.style.color = 'white';

  const cancelButton = document.createElement('button');
  cancelButton.textContent = '✗';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '4px';
  cancelButton.style.backgroundColor = '#f44336';
  cancelButton.style.color = 'white';

  buttonContainer.appendChild(applyButton);
  buttonContainer.appendChild(cancelButton);
  editorContainer.appendChild(buttonContainer);

  return { applyButton, cancelButton };
}

// Function to calculate weighted average
function calculateWeightedAverage(grades) {
  let totalWeightedGrade = 0;
  let totalWeight = 0;
  
  Object.entries(grades).forEach(([course, data]) => {
    if (data.included !== false) {  // If included is not explicitly false
      const weight = data.weight || 1;
      totalWeightedGrade += data.grade * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? (totalWeightedGrade / totalWeight).toFixed(2) : "0.00";
}

// Function to find all grades
function findAllGrades() {
  let recentGrades = {};
  // Get all span elements with class 'hebText'
  const textElements = document.querySelectorAll('span.hebText');
  
  // Initialize variables
  let curr_course = null, curr_grade = null, curr_date = null;
  let found = false;
  let lineBeforeDigits = null;
  let number = null;
  const digitPattern = /^\d{1,2}$/;
  
  // Loop through the text elements
  textElements.forEach((element, index) => {
    const elementText = element.innerText;
    
    if (elementText.includes('ציון סופי')) {
      found = true;
      number = elementText.match(/\d+/)[0];
      for (let i = index - 1; i >= 0; i--) {
        const previousText = textElements[i].innerText.trim();
        if (digitPattern.test(previousText)) {
          lineBeforeDigits = textElements[i - 1] ? textElements[i - 1].innerText.trim() : null;
          if (lineBeforeDigits) {
            break;
          }
        }
      }
      return;
    }

    if (found) {
      const dateParts = elementText.split(" ");
      const date = dateParts[0].split("/");
      const time = dateParts[1];

      if (date.length === 3 && time && date[0].length === 2 && date[1].length === 2 && date[2].length === 4) {
        const formattedDate = `${date[2]}-${date[1]}-${date[0]}T${time}`;
        const currentDate = new Date(formattedDate);

        if (!isNaN(currentDate.getTime())) {
          curr_course = lineBeforeDigits;
          curr_grade = parseInt(number);
          curr_date = currentDate;
          
          if (!recentGrades[curr_course]) {
            recentGrades[curr_course] = { date: formattedDate, grade: curr_grade };
          } else {
            const currentDate = new Date(formattedDate);
            const existingDate = new Date(recentGrades[curr_course].date);
            if (currentDate > existingDate) {
              recentGrades[curr_course] = { date: formattedDate, grade: curr_grade };
            }
          }
        }
        found = false;
      }
    }
  });

  if (recentGrades) {
    globalGrades = recentGrades;  // Store grades globally
    
    // Find or create the average value element
    let avgValueElement = document.getElementById('avgValue');
    if (!avgValueElement) {
      avgValueElement = document.createElement('span');
      avgValueElement.id = 'avgValue';
      // Add it to the page - you might need to adjust this selector
      document.body.appendChild(avgValueElement);
    }
    
    // Initial average calculation and display
    const average = calculateWeightedAverage(globalGrades);
    avgValueElement.textContent = average;
    
    // Setup the UI
    const { editButton, editorContainer } = injectUI(avgValueElement);
    
    // Setup edit button click handler
    editButton.addEventListener('click', () => {
      editorContainer.style.display = 'block';
      const { applyButton, cancelButton } = createEditorUI(globalGrades, editorContainer);
      
      // Store original state
      const originalState = JSON.parse(JSON.stringify(globalGrades));
      
      // Setup apply button
      applyButton.addEventListener('click', () => {
        // Update grades from UI
        const courseRows = editorContainer.querySelectorAll('div:not(:first-child):not(:last-child)');
        courseRows.forEach(row => {
          const course = row.querySelector('span').textContent;
          const grade = parseInt(row.querySelector('.grade-input').value);
          const weight = parseFloat(row.querySelector('.weight-input').value);
          const included = row.querySelector('.include-checkbox').checked;
          
          globalGrades[course] = {
            ...globalGrades[course],
            grade,
            weight,
            included
          };
        });
        
        // Update average
        avgValueElement.textContent = calculateWeightedAverage(globalGrades);
        editorContainer.style.display = 'none';
      });
      
      // Setup cancel button
      cancelButton.addEventListener('click', () => {
        globalGrades = JSON.parse(JSON.stringify(originalState));
        editorContainer.style.display = 'none';
      });
    });
  }
}

// Define the toggle function
function toggleFastLinks() {
  const courseInfo = document.querySelector('#links-list');  // Dynamically injected list
  const plusIcon = document.querySelector('.plus-icon');
  
  // Check if the courseInfo (list) exists
  if (!courseInfo) {
      console.warn("Course list (#links-list) not found yet. Make sure it's injected.");
      return;
  }
  
  // Toggle the list visibility
  if (courseInfo.style.display === 'none' || courseInfo.style.display === '') {
      courseInfo.style.display = 'block';
      plusIcon.textContent = '-';
  } else {
      courseInfo.style.display = 'none';
      plusIcon.textContent = '+';
  }
}


function loadHTML(filePath, containerId) {
  const url = chrome.runtime.getURL(filePath); // Construct the URL


  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById(containerId).innerHTML = data; // Inject the loaded HTML
      // After loading, set the content for the containers
      if (containerId === 'latest-grade-container') {
        const latestGradeContainer = document.getElementById('latestGradeContainer');  
        // Define your variables

        // Set the values in the loaded HTML
        const gradeValueEl = document.getElementById('gradeValue');
        const courseNameEl = document.getElementById('courseName');
        const publishDateEl = document.getElementById('publishDate');
        // First, call the function and store its result
        const result = findMostRecentGradePublished();

        // Then check if we have a result before trying to use its properties
        if (result) {
          if (gradeValueEl) gradeValueEl.textContent += result.grade;
          if (courseNameEl) courseNameEl.textContent += result.course_name;
          if (publishDateEl) publishDateEl.textContent += result.date_str;
          if (isSameDay(new Date(result.date))) {
            //New grade received today!
            gradeValueEl.innerHTML += ' <span class="new-label">חדש!</span>';
            latestGradeContainer.classList.add('new');
            //console.log('Added "new" class:', latestGradeContainer.classList);
          }
          else {
            latestGradeContainer.classList.remove('new');
          }
        }
        
        
      }
      if (containerId === 'center-container') {
        const logoEl = document.querySelector('.extension-logo');
        if (logoEl) {
            logoEl.src = chrome.runtime.getURL('assets/shake.gif');
        }
        findHiddenExams();
        findAllDownloadableExams();
        // Attach the form submit event listener
        //for first one only:
        // const formEl = document.querySelector('form[action="exam.php"]');
        // if (formEl) {
        //     formEl.addEventListener('submit', function(event) {
        // Change the image source to assets/pull.gif
  //       if (logoEl) {
  //         logoEl.src = chrome.runtime.getURL('assets/pull.gif');
  //     }
      
  //     // Optionally handle form submission here (AJAX or other logic)
  //     //console.log('Form submitted and image updated.');
        // });
        //}
        //for all:
        const formEls = document.querySelectorAll('form[action="exam.php"]');
        formEls.forEach(formEl => {
          formEl.addEventListener('submit', function(event) {
              // Change the image source to assets/pull.gif
              if (logoEl) {
                logoEl.src = chrome.runtime.getURL('assets/pull.gif');
            }
          });
      });
                
        
      }
      if (containerId === 'right-container') {
        findAllGrades();
      }
      
    })
    .catch(error => console.error('Error loading file:', error)); // Log any errors
}

function loadLeftContainerContent() {


  // Select the left container
  const leftContainer = document.getElementById('latest-grade-container');

  // Construct HTML with variables
  leftContainer.innerHTML = `
    <h2>הציון האחרון שהתקבל:</h2>
    <div id="grade-value">Grade: ${grade}</div>
    <div id="course-name">Course: ${course_name}</div>
    <div id="publish-date">Date: ${date}</div>
  `;
}


function injectContainers() {
  const containerDiv = document.createElement('div');
  containerDiv.id = 'course-tracker-extension';
  containerDiv.classList.add('fade'); // Initially hidden with fade effect
  containerDiv.innerHTML = `
  <button id="toggle-button">
    <img src="${chrome.runtime.getURL('assets/logo.png')}" alt="Toggle">
    <span class="tooltip-text">Tap to hide</span>
  </button>
  <div id="containers-wrapper">
      <div id="latest-grade-container" class="extension-side-container"></div>
      <div id="center-container" class="extension-container"></div>
      <div id="right-container" class="extension-side-container"></div>
  </div>
  `;
  setTimeout(() => {
    containerDiv.classList.add('visible'); // Add the visible class to fade in
  }, 10); // Small delay for the transition to apply
  document.body.insertBefore(containerDiv, document.body.firstChild);

  // Load content from HTML files
  if(RECENTcontainer) { loadHTML('containers/left-container.html', 'latest-grade-container'); }
  if (EXDOWNLDRcontainer) { loadHTML('containers/center-container.html', 'center-container'); }
  if (AVGcontainer) { loadHTML('containers/right-container.html', 'right-container'); }

  // Add toggle functionality to the button
  const toggleButton = document.getElementById('toggle-button');
  const containersWrapper = document.getElementById('containers-wrapper');

  toggleButton.addEventListener('click', () => {
    if (containersWrapper.style.display === 'none') {
      containersWrapper.style.display = 'flex';  // Show the containers
      toggleButton.querySelector('img').src = chrome.runtime.getURL('assets/hide.png'); // Update to hide icon
    } else {
      containersWrapper.style.display = 'none';  // Hide the containers
      toggleButton.querySelector('img').src = chrome.runtime.getURL('assets/show.png'); // Update to show icon
    }
  });
}

// if (show) {
//   injectContainers();
//   //console.log('Extension is visible');
// }
// else {
//   //disabled by the user
//   console.log('Extension is hidden');
// }


/*
  _________              .__  ___________                           .__ 
 /   _____/____     ____ |__| \_   _____/__  _________  ____   ____ |__|
 \_____  \\__  \   / ___\|  |  |    __)_\  \/ /\_  __ \/  _ \ /    \|  |
 /        \/ __ \_/ /_/  >  |  |        \\   /  |  | \(  <_> )   |  \  |
/_______  (____  /\___  /|__| /_______  / \_/   |__|   \____/|___|  /__|
        \/     \//_____/              \/                          \/    
_______________   ________  ________   __________  ________ ____ ___    
\_____  \   _  \  \_____  \ \_____  \  \______   \/  _____/|    |   \   
 /  ____/  /_\  \  /  ____/   _(__  <   |    |  _/   \  ___|    |   /   
/       \  \_/   \/       \  /       \  |    |   \    \_\  \    |  /    
\_______ \_____  /\_______ \/______  /  |______  /\______  /______/     
        \/     \/         \/       \/          \/        \/             
/*/
