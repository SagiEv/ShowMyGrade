// Load saved settings when popup opens
    document.addEventListener('DOMContentLoaded', () => {
        chrome.storage.sync.get(['show','RECENTcontainer', 'EXDOWNLDRcontainer', 'AVGcontainer'], (result) => {
            // If the setting has never been saved (first time user), set it to true
            if (result.show === undefined) {
                chrome.storage.sync.set({ show: true });
                document.getElementById('defaultToggle').checked = true;
            } else {
                // Otherwise, use the saved value
                document.getElementById('defaultToggle').checked = result.show;
          }
          // Handle 'RECENTcontainer' toggle
            if (result.RECENTcontainer === undefined) {
              chrome.storage.sync.set({ RECENTcontainer: true });
              document.getElementById('lastGradeToggle').checked = true;
          } else {
              document.getElementById('lastGradeToggle').checked = result.RECENTcontainer;
          }

          // Handle 'EXDOWNLDRcontainer' toggle
          if (result.EXDOWNLDRcontainer === undefined) {
              chrome.storage.sync.set({ EXDOWNLDRcontainer: true });
              document.getElementById('examsDownloaderToggle').checked = true;
          } else {
              document.getElementById('examsDownloaderToggle').checked = result.EXDOWNLDRcontainer;
          }

          // Handle 'AVGcontainer' toggle
          if (result.AVGcontainer === undefined) {
              chrome.storage.sync.set({ AVGcontainer: true });
              document.getElementById('averageToggle').checked = true;
          } else {
              document.getElementById('averageToggle').checked = result.AVGcontainer;
          }
        });
    });

    // Save settings when toggle changes
    document.getElementById('defaultToggle').addEventListener('change', (e) => {
        chrome.storage.sync.set({ show: e.target.checked }, () => {
            // Notify content script of the change
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateShow",
                    show: e.target.checked
                });
            });
        });
    });

    document.getElementById('lastGradeToggle').addEventListener('change', (e) => {
      chrome.storage.sync.set({ RECENTcontainer: e.target.checked }, () => {
          // Notify content script of the change
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, {
                  action: "updateRECENTcontainer",
                  RECENTcontainer: e.target.checked
              });
          });
      });
  });
  
  document.getElementById('examsDownloaderToggle').addEventListener('change', (e) => {
      chrome.storage.sync.set({ EXDOWNLDRcontainer: e.target.checked }, () => {
          // Notify content script of the change
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, {
                  action: "updateEXDOWNLDRcontainer",
                  EXDOWNLDRcontainer: e.target.checked
              });
          });
      });
  });
  
  document.getElementById('averageToggle').addEventListener('change', (e) => {
      chrome.storage.sync.set({ AVGcontainer: e.target.checked }, () => {
          // Notify content script of the change
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, {
                  action: "updateAVGcontainer",
                  AVGcontainer: e.target.checked
              });
          });
      });
  });

    // // Info icon toggle
    // const infoIcon = document.getElementById('infoIcon');
    // const infoText = document.getElementById('infoText');
    // infoIcon.addEventListener('click', () => {
    //     if (infoText.style.display === 'none' || infoText.style.display === '') {
    //         infoText.style.display = 'block';
    //     } else {
    //         infoText.style.display = 'none';
    //     }
    // });

document.addEventListener('DOMContentLoaded', function () {
  console.log("Popup DOM content loaded"); // Debug DOM load
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) { 
    console.log("Tabs queried:", tabs); // Debug tabs info

    if (tabs.length === 0) {
      console.error("No active tabs found.");
      return;
    }
    
  var startButton = document.getElementById('startButton');
    var buttonContainer = document.getElementById('buttonContainer');
    // if (buttonContainer && buttonContainer.style.display !== 'none') {
      startButton.addEventListener('click', function () {
        revealExams(tabs[0]); // Call revealExams with the active tab
      });
    // }
  //   else {
  //     console.error("button not found.");
  //     return;
  // }
});
});
    

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  console.log("Tabs queried:", tabs); // Debug tabs info

  if (tabs.length === 0) {
    console.error("No active tabs found.");
    return;
  }

  var url = tabs[0].url;
  console.log("Current tab URL:", url); // Debug URL

  if (/^https:\/\/gezer1\.bgu\.ac\.il\/meser\/(crslist||tiflink|main)\.php.*$/.test(url)) {
    console.log("URL matches exam page pattern.");
    
    document.getElementById('button-container').style.display = 'none';
    setStatus('Logged in', 'logged-in');
    
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: scanTextForExams
      },
      function(results) {
        if (chrome.runtime.lastError) {
          console.error("Error executing script:", chrome.runtime.lastError);
        } else {
          console.log("Script results:", results); // Debug script results
          var count = results[0].result;
          processCount(count);
        }
      }
    );
  } else if (/^https:\/\/gezer1\.bgu\.ac\.il\/meser\/login\.php$/i.test(url)) {
    console.log("URL matches login page pattern.");

    document.getElementById('button-container').style.display = 'none';
    setStatus('You need to login', 'not-logged-in');
  } else {
    console.log("URL does not match any known patterns.");
    hideStatus();
  }
});

function setStatus(statusText, statusClass) {
  console.log("Setting status:", statusText, statusClass); // Debug status update
  var statusElement = document.getElementById('status');
  statusElement.textContent = statusText;
  statusElement.className = statusClass;
  statusElement.style.display = 'block';
}

function hideStatus() {
  console.log("Hiding status."); // Debug hiding status
  var statusElement = document.getElementById('status');
  statusElement.style.display = 'none';
}

function showButton() {
  console.log("Showing start button."); // Debug showing button
  document.getElementById('buttonContainer').style.display = 'flex';
}

function searchForSentence(sentence, callback) {
  console.log("Searching for sentence:", sentence); // Debug search
  var regex = new RegExp(sentence, 'gi');
  var bodyText = document.body.textContent;
  var matches = bodyText.match(regex);
  var count = matches ? matches.length : 0;
  console.log("Sentence match count:", count); // Debug match count
  callback(count);
}

function processCount(count) {
  console.log("Processing exam count:", count); // Debug count processing
  var resultText = "NO NEW EXAMS";
  if (count === 1) {
    resultText = count + " exam is available!\nClick on 'משוך בגזר' to reveal";
    showButton();
  } else if (count > 1) {
    resultText = "Found " + count + " exams are available!\nClick on 'משוך בגזר' to reveal";
    showButton();
  } else {
    console.log("No new exams available."); // Debug no new exams
  }
  var foundElement = document.getElementById('counter');
  foundElement.textContent = resultText;
}

function scanTextForExams() {
  var sentence = "המחברת נסרקה אבל תוצג אחרי פרסום ציון";
          var sentence1 = " - המחברת טרם נסרקה -";
          var regex = new RegExp(sentence, 'gi');
          var regex1 = new RegExp(sentence1, 'gi');
          var bodyText = document.body.textContent;
          var matches = bodyText.match(regex);
          var matches1 = bodyText.match(regex1);
          var count = (matches ? matches.length : 0) + (matches1 ? matches1.length : 0);
          console.log("Count of matching sentences:", count); // Debug count calculation
          return count;
}

function revealExams(tab) {
  console.log("Revealing exams..."); // Debug reveal
  document.getElementById('bgu').src = chrome.runtime.getURL('assets/pull.gif');
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['myScript.js']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error executing script:", chrome.runtime.lastError);
    } else {
      console.log("Script executed successfully.");
    }
  });
}

